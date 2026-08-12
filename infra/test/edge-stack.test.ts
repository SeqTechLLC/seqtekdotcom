import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { ComputeStack } from '../lib/compute-stack'
import type { EnvConfig } from '../lib/construct-utils'
import { DataStack } from '../lib/data-stack'
import { EdgeStack } from '../lib/edge-stack'
import { NetworkStack } from '../lib/network-stack'

const stagingCfg: EnvConfig = {
  region: 'us-east-1',
  domainName: null,
  hostedZoneId: null,
  certificateArn: null,
  certificateSans: [],
  dnsRecordNames: [],
  existingVpc: null,
  secondaryLane: null,
  instanceClass: 't3',
  instanceSize: 'micro',
  rdsInstanceClass: 't3.micro',
  rdsAllocatedStorageGb: 20,
  rdsMultiAz: false,
  asgMinCapacity: 1,
  asgDesiredCapacity: 1,
  asgMaxCapacity: 2,
  ecrRetainCount: 10,
  logRetentionDays: 14,
  ownsAccountOidcProvider: true,
  ownsAccountEcrRepository: true,
}

const stagingWithDomainCfg: EnvConfig = {
  ...stagingCfg,
  domainName: 'seqtek-preview.com',
  hostedZoneId: 'Z01234567ABCDEF',
  certificateSans: ['www.seqtek-preview.com'],
  dnsRecordNames: ['seqtek-preview.com', 'www.seqtek-preview.com'],
}

function synthEdge(envName: 'prod' | 'staging', cfg: EnvConfig): Template {
  const app = new App()
  const stackPrefix = envName === 'prod' ? 'SeqtekProd' : 'SeqtekStaging'
  const network = new NetworkStack(app, `${stackPrefix}Network`, {
    env: { account: '123456789012', region: 'us-east-1' },
    envName,
    cfg,
  })
  const data = new DataStack(app, `${stackPrefix}Data`, {
    env: { account: '123456789012', region: 'us-east-1' },
    envName,
    cfg,
    network,
  })
  const compute = new ComputeStack(app, `${stackPrefix}Compute`, {
    env: { account: '123456789012', region: 'us-east-1' },
    envName,
    cfg,
    network,
    data,
  })
  const edge = new EdgeStack(app, `${stackPrefix}Edge`, {
    env: { account: '123456789012', region: 'us-east-1' },
    envName,
    cfg,
    compute,
    data,
  })
  return Template.fromStack(edge)
}

describe('EdgeStack', () => {
  describe('staging without domain (validation-period default)', () => {
    const t = synthEdge('staging', stagingCfg)

    it('creates exactly one CloudFront distribution', () => {
      t.resourceCountIs('AWS::CloudFront::Distribution', 1)
    })

    it('distribution has no custom aliases (uses default CloudFront DNS)', () => {
      const dists = t.findResources('AWS::CloudFront::Distribution')
      const [, dist] = Object.entries(dists)[0]!
      const config = (dist.Properties as { DistributionConfig: { Aliases?: string[] } })
        .DistributionConfig
      expect(config.Aliases).toBeUndefined()
    })

    it('CloudFront uses PriceClass 100 (US/CA/EU only)', () => {
      t.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({ PriceClass: 'PriceClass_100' }),
      })
    })

    it('viewer protocol policy is REDIRECT_TO_HTTPS on default + all behaviors', () => {
      const dists = t.findResources('AWS::CloudFront::Distribution')
      const [, dist] = Object.entries(dists)[0]!
      const config = (
        dist.Properties as {
          DistributionConfig: {
            DefaultCacheBehavior: { ViewerProtocolPolicy: string }
            CacheBehaviors?: Array<{ ViewerProtocolPolicy: string }>
          }
        }
      ).DistributionConfig
      expect(config.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https')
      for (const behavior of config.CacheBehaviors ?? []) {
        expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https')
      }
    })

    it('per-path behaviors differentiated per ARCHITECTURE.md §3', () => {
      const dists = t.findResources('AWS::CloudFront::Distribution')
      const [, dist] = Object.entries(dists)[0]!
      const behaviors =
        (
          dist.Properties as {
            DistributionConfig: { CacheBehaviors?: Array<{ PathPattern: string }> }
          }
        ).DistributionConfig.CacheBehaviors ?? []
      const paths = behaviors.map((b) => b.PathPattern)
      expect(paths).toContain('/admin/*')
      expect(paths).toContain('/api/*')
      expect(paths).toContain('/_next/static/*')
      expect(paths).toContain('/media/*')
    })

    it('admin + api paths have caching disabled', () => {
      const dists = t.findResources('AWS::CloudFront::Distribution')
      const [, dist] = Object.entries(dists)[0]!
      const behaviors =
        (
          dist.Properties as {
            DistributionConfig: {
              CacheBehaviors?: Array<{ PathPattern: string; CachePolicyId?: string }>
            }
          }
        ).DistributionConfig.CacheBehaviors ?? []
      const cachingDisabledPolicyId = '4135ea2d-6df8-44a3-9df3-4b5a84be39ad'
      const adminBehavior = behaviors.find((b) => b.PathPattern === '/admin/*')
      const apiBehavior = behaviors.find((b) => b.PathPattern === '/api/*')
      expect(adminBehavior?.CachePolicyId).toBe(cachingDisabledPolicyId)
      expect(apiBehavior?.CachePolicyId).toBe(cachingDisabledPolicyId)
    })

    it('attaches an OAC to the S3 media origin', () => {
      t.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
        OriginAccessControlConfig: Match.objectLike({
          OriginAccessControlOriginType: 's3',
          SigningBehavior: 'always',
          SigningProtocol: 'sigv4',
        }),
      })
    })

    it('writes the real distribution ID into cloudfront_distribution_id so the invalidation hooks actually fire (spec 009 FR-011 follow-up)', () => {
      // Without this reaching CLOUDFRONT_DISTRIBUTION_ID, both invalidation
      // paths (page publishes per R-03, media replace/delete per spec 009
      // FR-011) silently skip — staging had ZERO invalidations ever before
      // this landed.
      //
      // The PARAMETER RESOURCE itself is owned by DataStack (a placeholder
      // that exists from the very first deploy — see data-stack.test.ts) so
      // Compute's Fargate tasks never reference a nonexistent named secret.
      // EdgeStack only WRITES the real value once the distribution exists,
      // via a custom resource (Custom::AWS) making a direct SSM
      // putParameter call — not a second CDK-owned ssm.StringParameter,
      // which would collide with DataStack's.
      t.hasResourceProperties('Custom::AWS', {
        Create: {
          'Fn::Join': [
            '',
            Match.arrayWith([Match.stringLikeRegexp('.*cloudfront_distribution_id.*')]),
          ],
        },
      })
    })

    it('grants the app instance role cloudfront:CreateInvalidation scoped to this distribution', () => {
      // The policy lives in EdgeStack (not ComputeStack) because it needs
      // the distribution ARN — same Compute → Data → Edge → Compute
      // cycle-breaking rationale as the media bucket policy above it.
      t.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'cloudfront:CreateInvalidation',
              Effect: 'Allow',
              // Enforce the scoping the test name promises — a regression
              // to `resources: ['*']` must fail here. The ARN embeds the
              // distribution's CFN Ref, so it synthesizes as an Fn::Join
              // whose first fragment is the literal ARN prefix.
              Resource: {
                'Fn::Join': [
                  '',
                  Match.arrayWith(['arn:aws:cloudfront::123456789012:distribution/']),
                ],
              },
            }),
          ]),
        }),
      })
    })

    it('does NOT include broken 403→404 remap (deferred to Phase 5.5)', () => {
      // CloudFront rejects responseHttpStatus without responsePagePath.
      // Phase 5.5 will add a /404.html to the S3 bucket and wire up the
      // remap. For now, S3's 403 surfaces to viewers unchanged.
      const dists = t.findResources('AWS::CloudFront::Distribution')
      const [, dist] = Object.entries(dists)[0]!
      const errorResponses = (
        dist.Properties as {
          DistributionConfig: { CustomErrorResponses?: Array<unknown> }
        }
      ).DistributionConfig.CustomErrorResponses
      expect(errorResponses).toBeUndefined()
    })

    it('does NOT create an ACM certificate when domainName is null', () => {
      t.resourceCountIs('AWS::CertificateManager::Certificate', 0)
    })

    it('does NOT create Route53 A records when hostedZoneId is null', () => {
      t.resourceCountIs('AWS::Route53::RecordSet', 0)
    })
  })

  describe('staging with seqtek-preview.com (post-T029b)', () => {
    const t = synthEdge('staging', stagingWithDomainCfg)

    it('provisions an ACM certificate via DNS validation', () => {
      t.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'seqtek-preview.com',
        ValidationMethod: 'DNS',
        SubjectAlternativeNames: ['www.seqtek-preview.com'],
      })
    })

    it('distribution aliases include apex + www', () => {
      t.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Aliases: Match.arrayWith(['seqtek-preview.com', 'www.seqtek-preview.com']),
        }),
      })
    })

    it('creates Route53 A records for apex + www', () => {
      t.resourceCountIs('AWS::Route53::RecordSet', 2)
    })

    it('does NOT create a CloudFront Function when there is no secondaryLane', () => {
      t.resourceCountIs('AWS::CloudFront::Function', 0)
    })

    it('does NOT emit a SecondaryLaneSiteUrl output when there is no secondaryLane', () => {
      const outputs = t.findOutputs('*')
      expect(outputs).not.toHaveProperty('SecondaryLaneSiteUrl')
    })
  })

  describe('staging with a secondaryLane (temporary ww3.seqtek.com PROD-preview lane)', () => {
    const t = synthEdge('staging', {
      ...stagingWithDomainCfg,
      certificateSans: ['www.seqtek-preview.com', '*.seqtek-preview.com'],
      secondaryLane: {
        name: 'prod',
        databaseName: 'seqtek_prod',
        dnsRecordNames: ['ww3.seqtek-preview.com'],
      },
    })

    it('creates a CloudFront Function that copies Host into x-forwarded-host', () => {
      t.resourceCountIs('AWS::CloudFront::Function', 1)
      const fns = t.findResources('AWS::CloudFront::Function')
      const [, fn] = Object.entries(fns)[0]!
      const code = (fn.Properties as { FunctionCode: string }).FunctionCode
      expect(code).toContain('x-forwarded-host')
      expect(code).toContain('request.headers.host.value')
    })

    it('attaches the function as a viewer-request association on the default + ALB-backed behaviors', () => {
      const dists = t.findResources('AWS::CloudFront::Distribution')
      const [, dist] = Object.entries(dists)[0]!
      const config = (
        dist.Properties as {
          DistributionConfig: {
            DefaultCacheBehavior: { FunctionAssociations?: Array<{ EventType: string }> }
            CacheBehaviors?: Array<{
              PathPattern: string
              FunctionAssociations?: Array<{ EventType: string }>
            }>
          }
        }
      ).DistributionConfig
      expect(config.DefaultCacheBehavior.FunctionAssociations?.[0]?.EventType).toBe(
        'viewer-request',
      )
      const albBackedPaths = ['/admin/*', '/api/*', '/_next/static/*']
      for (const path of albBackedPaths) {
        const behavior = config.CacheBehaviors?.find((b) => b.PathPattern === path)
        expect(
          behavior?.FunctionAssociations?.[0]?.EventType,
          `${path} should have the Host-forwarding function attached`,
        ).toBe('viewer-request')
      }
      // /media/* goes to the S3 origin, not the ALB — no Host-header
      // routing ambiguity there, so no function association expected.
      const mediaBehavior = config.CacheBehaviors?.find((b) => b.PathPattern === '/media/*')
      expect(mediaBehavior?.FunctionAssociations).toBeUndefined()
    })

    it('distribution aliases include the secondaryLane dnsRecordNames on top of the primary ones', () => {
      t.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Aliases: Match.arrayWith([
            'seqtek-preview.com',
            'www.seqtek-preview.com',
            'ww3.seqtek-preview.com',
          ]),
        }),
      })
    })

    it('creates a Route53 A record for the secondaryLane on top of the primary records', () => {
      t.resourceCountIs('AWS::Route53::RecordSet', 3)
    })

    it('emits a SecondaryLaneSiteUrl output distinct from the primary SiteUrl', () => {
      t.hasOutput('SecondaryLaneSiteUrl', { Value: 'https://ww3.seqtek-preview.com' })
      t.hasOutput('SiteUrl', { Value: 'https://seqtek-preview.com' })
    })
  })
})
