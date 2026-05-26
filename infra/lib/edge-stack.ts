import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as r53targets from 'aws-cdk-lib/aws-route53-targets'
import * as s3 from 'aws-cdk-lib/aws-s3'
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
            subjectAlternativeNames: [`www.${cfg.domainName}`],
            validation: acm.CertificateValidation.fromDns(hostedZone),
          })
      aliases = [cfg.domainName, `www.${cfg.domainName}`]
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
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        compress: true,
      },
      additionalBehaviors: {
        // Admin: never cache; forward everything to the origin.
        '/admin/*': {
          origin: albOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          compress: true,
        },
        // API: never cache; full method support.
        '/api/*': {
          origin: albOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          compress: true,
        },
        // Next.js static assets — long TTL, immutable.
        '/_next/static/*': {
          origin: albOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
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
      errorResponses: [
        // S3 returns 403 for missing objects (per OAC + BlockPublicAccess); rewrite to 404.
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          ttl: Duration.seconds(0),
        },
      ],
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

    // ----- Optional: Route53 A-record (when domainName is set) -----
    if (hostedZone && cfg.domainName) {
      new route53.ARecord(this, 'ApexAlias', {
        zone: hostedZone,
        recordName: cfg.domainName,
        target: route53.RecordTarget.fromAlias(new r53targets.CloudFrontTarget(this.distribution)),
      })
      new route53.ARecord(this, 'WwwAlias', {
        zone: hostedZone,
        recordName: `www.${cfg.domainName}`,
        target: route53.RecordTarget.fromAlias(new r53targets.CloudFrontTarget(this.distribution)),
      })
    }

    this.siteUrl = cfg.domainName
      ? `https://${cfg.domainName}`
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
