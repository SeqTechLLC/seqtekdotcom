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
}

const stagingWithDomainCfg: EnvConfig = {
  ...stagingCfg,
  domainName: 'seqtek-preview.com',
  hostedZoneId: 'Z01234567ABCDEF',
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

    it('error response 403 → 404 for missing media objects', () => {
      t.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          CustomErrorResponses: Match.arrayWith([
            Match.objectLike({
              ErrorCode: 403,
              ResponseCode: 404,
            }),
          ]),
        }),
      })
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
  })
})
