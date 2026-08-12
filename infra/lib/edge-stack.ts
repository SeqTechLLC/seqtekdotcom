import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as r53targets from 'aws-cdk-lib/aws-route53-targets'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cr from 'aws-cdk-lib/custom-resources'
import type { Construct } from 'constructs'
import type { EnvConfig, EnvName } from './construct-utils'
import type { ComputeStack } from './compute-stack'
import type { DataStack } from './data-stack'

export interface EdgeStackProps extends StackProps {
  envName: EnvName
  cfg: EnvConfig
  compute: ComputeStack
  data: DataStack
}

/**
 * Edge plane — CloudFront distribution + optional ACM certificate +
 * optional Route53 alias.
 *
 * **Validation-period topology**: when `cfg.domainName` is null, the
 * distribution uses CloudFront's default cert (`*.cloudfront.net`) and
 * the default DNS hostname. No ACM cert, no Route53 record. After T029a
 * registers seqtek-preview.com and updates cdk.json, the next deploy
 * provisions the ACM cert via DNS validation in the imported hosted
 * zone and adds the alias + A-record.
 *
 * CloudFront → ALB origin uses HTTP (port 80) during the validation
 * period; viewer-facing 80 → 443 redirect happens at the CloudFront
 * viewer-policy layer. Phase 5.5 adds the ALB 443 listener + ACM cert
 * for end-to-end TLS.
 */
export class EdgeStack extends Stack {
  public readonly distribution: cloudfront.Distribution
  public readonly certificate?: acm.ICertificate
  public readonly siteUrl: string

  constructor(scope: Construct, id: string, props: EdgeStackProps) {
    super(scope, id, props)
    const { envName, cfg, compute, data } = props

    // ----- Optional: ACM cert + alias when domainName is set -----
    //
    // `domainName` is the certificate's primary name and the Route53 zone to
    // validate DNS in. `certificateSans` adds extra names to the CERT (e.g.
    // `*.seqtek.com` — a cert existing doesn't redirect any traffic).
    // `dnsRecordNames` controls which names ACTUALLY get a Route53 record
    // pointed at this distribution — deliberately independent, so a
    // preview env can request a cert covering `seqtek.com` + `*.seqtek.com`
    // while creating ONLY a `preview.seqtek.com` record, leaving the zone's
    // existing `seqtek.com` / `www.seqtek.com` records completely untouched.
    let aliases: string[] | undefined
    let hostedZone: route53.IHostedZone | undefined
    if (cfg.domainName !== null) {
      if (cfg.hostedZoneId === null) {
        throw new Error(
          `EdgeStack[${envName}]: domainName is set but hostedZoneId is null — both must be set together (validated in construct-utils).`,
        )
      }
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: cfg.hostedZoneId,
        zoneName: cfg.domainName,
      })

      this.certificate = cfg.certificateArn
        ? acm.Certificate.fromCertificateArn(this, 'Cert', cfg.certificateArn)
        : new acm.Certificate(this, 'Cert', {
            domainName: cfg.domainName,
            subjectAlternativeNames: cfg.certificateSans,
            validation: acm.CertificateValidation.fromDns(hostedZone),
          })
      // CORRECTED 2026-08-10: this used to be [domainName, ...certificateSans]
      // on the theory that a CloudFront alias with no DNS pointing at it is
      // harmless pre-cutover prep. That's true for ACM (multiple certs CAN
      // cover the same name), but FALSE for CloudFront aliases — they are
      // globally unique across every distribution in the account, no
      // exceptions, and CloudFront refuses to create a distribution that
      // claims a name another distribution already has. Discovered when
      // `seqtek.com` + `*.seqtek.com` collided with the account's existing,
      // live `E2XM0Q4LL51A4Y` distribution (aliases seqtek.com/www.seqtek.com)
      // and `E22ACPK6N6D2BS` (webassets.seqtek.com). The cert can still cover
      // broader names for later reuse (harmless, already proven above); the
      // ALIAS list must be scoped to exactly what dnsRecordNames actually
      // points here — nothing more.
      aliases = [...cfg.dnsRecordNames, ...(cfg.secondaryLane?.dnsRecordNames ?? [])]
    }

    // ----- CloudFront distribution -----
    const albOrigin = new origins.LoadBalancerV2Origin(compute.loadBalancer, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      httpPort: 80,
      connectionAttempts: 3,
      connectionTimeout: Duration.seconds(10),
      readTimeout: Duration.seconds(60),
      keepaliveTimeout: Duration.seconds(60),
    })

    // ----- Optional: forward the real Host to the ALB (secondaryLane only) -----
    // CloudFront always overwrites the `Host` header with the ORIGIN's
    // domain name before forwarding to a custom origin (documented AWS
    // behavior — not overridable via origin request policy, and `Host`
    // can't be added to one for a custom origin). With one distribution
    // and one ALB shared by two lanes, compute-stack's host-based ALB rule
    // would otherwise never see `preview.seqtek.com` or `ww3.seqtek.com` —
    // only the ALB's own DNS name, on every request. This CloudFront
    // Function (viewer-request stage, runs before origin selection) copies
    // the viewer's real Host into a new `x-forwarded-host` header, which
    // IS forwarded (covered by the ALL_VIEWER_AND_CLOUDFRONT_2022 origin
    // request policy below) — the ALB rule matches on that instead.
    const forwardHostFunction = cfg.secondaryLane
      ? new cloudfront.Function(this, 'ForwardHostFunction', {
          comment: `${envName}: copy viewer Host into x-forwarded-host for ALB lane routing`,
          code: cloudfront.FunctionCode.fromInline(
            'function handler(event) {\n' +
              '  var request = event.request;\n' +
              "  request.headers['x-forwarded-host'] = { value: request.headers.host.value };\n" +
              '  return request;\n' +
              '}\n',
          ),
        })
      : undefined
    const hostForwardingFunctionAssociations = forwardHostFunction
      ? [{ function: forwardHostFunction, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST }]
      : undefined

    // S3 media origin via OAC (Origin Access Control).
    // Import the bucket by attributes (read-only handle) so CDK's
    // auto-policy-injection from `withOriginAccessControl` becomes a
    // no-op — we own the BucketPolicy resource manually below in
    // EdgeStack, which breaks the Data ↔ Edge dependency cycle.
    const mediaBucketRef = s3.Bucket.fromBucketAttributes(this, 'MediaBucketRef', {
      bucketName: data.mediaBucket.bucketName,
      bucketArn: data.mediaBucket.bucketArn,
      region: this.region,
    })
    const mediaOac = new cloudfront.S3OriginAccessControl(this, 'MediaBucketOac', {
      description: `OAC for the ${envName} media bucket`,
    })
    const mediaOrigin = origins.S3BucketOrigin.withOriginAccessControl(mediaBucketRef, {
      originAccessControl: mediaOac,
      originAccessLevels: [cloudfront.AccessLevel.READ],
    })
    // Note: CDK emits a warning at synth time saying the imported
    // bucket's policy can't be updated automatically. That is
    // intentional — we own the BucketPolicy resource manually below
    // (per the cycle-breaking rationale above). To suppress the
    // recurring warning, acknowledge it at the app level via
    // `app.node.tryGetContext` or `cdk.json` context.

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `SEQTEK website ${envName} distribution`,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      ...(this.certificate ? { certificate: this.certificate } : {}),
      ...(aliases ? { domainNames: aliases } : {}),
      defaultRootObject: '',
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: albOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022,
        compress: true,
        functionAssociations: hostForwardingFunctionAssociations,
      },
      additionalBehaviors: {
        // Admin: never cache; forward everything to the origin.
        '/admin/*': {
          origin: albOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022,
          compress: true,
          functionAssociations: hostForwardingFunctionAssociations,
        },
        // API: never cache; full method support.
        '/api/*': {
          origin: albOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022,
          compress: true,
          functionAssociations: hostForwardingFunctionAssociations,
        },
        // Next.js static assets — long TTL, immutable.
        '/_next/static/*': {
          origin: albOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
          functionAssociations: hostForwardingFunctionAssociations,
        },
        // Media uploads — served from S3 via OAC, long TTL.
        '/media/*': {
          origin: mediaOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
      },
      // S3 returns 403 for missing objects (per OAC + BlockPublicAccess);
      // we'd like to remap to 404 but CloudFront requires both
      // `responseHttpStatus` AND `responsePagePath` together (or neither).
      // Phase 5.5 polish: add a static `/404.html` to the S3 bucket and
      // wire up the remap.
    })

    // ----- S3 media bucket policy -----
    // The policy resource is created in EdgeStack (not DataStack) to
    // break the Compute → Data → Edge → Compute cycle that would
    // otherwise occur: the policy needs the distribution ARN, which
    // lives in Edge. By owning the BucketPolicy resource in Edge, the
    // cross-stack reference goes Edge → Data (bucket name) instead of
    // Data → Edge (distribution ID).
    new s3.CfnBucketPolicy(this, 'MediaBucketPolicy', {
      bucket: data.mediaBucket.bucketName,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontServicePrincipalRead',
            Effect: 'Allow',
            Principal: { Service: 'cloudfront.amazonaws.com' },
            Action: 's3:GetObject',
            Resource: `${data.mediaBucket.bucketArn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
              },
            },
          },
        ],
      },
    })

    // ----- CloudFront invalidation wiring (spec 009 FR-011 follow-up) -----
    // Both invalidation callers (page publishes per R-03 and media
    // replace/delete per spec 009 FR-011) read CLOUDFRONT_DISTRIBUTION_ID
    // and silently skip without it.
    //
    // The parameter RESOURCE is owned by DataStack (not here) — it must
    // exist from the very first deploy, before Edge has ever run, because
    // Compute's Fargate tasks reference it by name and ECS fails a task
    // outright if a named "secret" parameter doesn't exist at all (not a
    // graceful skip like a missing/empty value). DataStack seeds it with a
    // harmless 'unset' placeholder. Here, once the real distribution ID is
    // known, a custom resource OVERWRITES that same parameter's value via
    // the SSM SDK directly — this is not a second CDK-owned resource (which
    // would collide with DataStack's), just a scripted value update.
    new cr.AwsCustomResource(this, 'CloudFrontDistributionIdParamWriter', {
      onCreate: {
        service: 'SSM',
        action: 'putParameter',
        parameters: {
          Name: `${data.parameterPathPrefix}/cloudfront_distribution_id`,
          Value: this.distribution.distributionId,
          Type: 'String',
          Overwrite: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          `${data.parameterPathPrefix}/cloudfront_distribution_id-writer`,
        ),
      },
      onUpdate: {
        service: 'SSM',
        action: 'putParameter',
        parameters: {
          Name: `${data.parameterPathPrefix}/cloudfront_distribution_id`,
          Value: this.distribution.distributionId,
          Type: 'String',
          Overwrite: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          `${data.parameterPathPrefix}/cloudfront_distribution_id-writer`,
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter${data.parameterPathPrefix}/cloudfront_distribution_id`,
        ],
      }),
      // Pin to the Lambda runtime's built-in SDK (sufficient for a single
      // SSM call) rather than downloading the latest AWS SDK on every
      // invocation — faster, deterministic, and avoids an untracked
      // moving dependency.
      installLatestAwsSdk: false,
    })

    // The grant needs the distribution ARN (Edge-owned), so the Policy
    // resource lives in Edge and attaches to the Compute-owned role —
    // Edge → Compute is an existing dependency direction (ALB origin).
    compute.appInstanceRole.attachInlinePolicy(
      new iam.Policy(this, 'AppCloudFrontInvalidationPolicy', {
        statements: [
          new iam.PolicyStatement({
            sid: 'CloudFrontCreateInvalidationScoped',
            actions: ['cloudfront:CreateInvalidation'],
            resources: [
              `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
            ],
          }),
        ],
      }),
    )

    // ----- Route53 records — ONLY for names in dnsRecordNames -----
    // This is the one part of the whole domain/cert setup that actually
    // changes what visitors see. Everything else above (the cert, the
    // CloudFront alias list) can safely cover more names than this without
    // affecting live traffic — a record only gets created for names
    // explicitly listed here. Construct IDs are derived from the record
    // name (dots stripped) to keep them stable and unique per name.
    if (hostedZone) {
      const allRecordNames = [...cfg.dnsRecordNames, ...(cfg.secondaryLane?.dnsRecordNames ?? [])]
      for (const recordName of allRecordNames) {
        const idSafeName = recordName.replace(/[^a-zA-Z0-9]/g, '')
        new route53.ARecord(this, `Alias${idSafeName}`, {
          zone: hostedZone,
          recordName,
          target: route53.RecordTarget.fromAlias(
            new r53targets.CloudFrontTarget(this.distribution),
          ),
        })
      }
    }

    // The reachable URL is the first ACTUAL DNS record, not domainName
    // (which may be a zone apex with no record pointing here at all, e.g.
    // the preview env's `seqtek.com`). Falls back to the CloudFront
    // default domain when there's no custom domain configured yet.
    this.siteUrl =
      cfg.dnsRecordNames.length > 0
        ? `https://${cfg.dnsRecordNames[0]}`
        : `https://${this.distribution.distributionDomainName}`

    // ----- Outputs -----
    new CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      exportName: `${this.stackName}-DistributionDomainName`,
    })
    new CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      exportName: `${this.stackName}-DistributionId`,
    })
    new CfnOutput(this, 'SiteUrl', {
      value: this.siteUrl,
      description: 'Public-facing URL for this environment (CloudFront default OR vanity domain).',
    })
  }
}
