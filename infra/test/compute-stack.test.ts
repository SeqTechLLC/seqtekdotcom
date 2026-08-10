import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { ComputeStack } from '../lib/compute-stack'
import type { EnvConfig } from '../lib/construct-utils'
import { DataStack } from '../lib/data-stack'
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

const prodCfg: EnvConfig = {
  ...stagingCfg,
  instanceSize: 'small',
  rdsInstanceClass: 't3.small',
  rdsAllocatedStorageGb: 50,
  asgMinCapacity: 2,
  asgDesiredCapacity: 2,
  asgMaxCapacity: 3,
  logRetentionDays: 90,
}

function synthCompute(envName: 'prod' | 'staging', cfg: EnvConfig, imageTag?: string): Template {
  // `imageTag` mirrors what `deploy.yml` passes as `-c imageTag=<vX.Y.Z | sha>`;
  // omitting it exercises the env-scoped fallback used by a bare local synth.
  const app = new App({ context: imageTag ? { imageTag } : {} })
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
  return Template.fromStack(compute)
}

describe('ComputeStack', () => {
  describe('staging (free-tier-eligible config)', () => {
    const t = synthCompute('staging', stagingCfg)

    it('creates the ECR repository with lifecycle rules', () => {
      t.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'seqtek-website',
        ImageScanningConfiguration: { ScanOnPush: true },
      })

      const repos = t.findResources('AWS::ECR::Repository')
      const [, repo] = Object.entries(repos)[0]!
      const lifecycle = JSON.parse(
        (repo.Properties as { LifecyclePolicy: { LifecyclePolicyText: string } }).LifecyclePolicy
          .LifecyclePolicyText,
      ) as { rules: Array<{ description: string; selection: Record<string, unknown> }> }
      expect(lifecycle.rules.length).toBeGreaterThanOrEqual(2)
      const hasUntaggedExpiry = lifecycle.rules.some(
        (r) =>
          r.selection.tagStatus === 'untagged' &&
          r.selection.countType === 'sinceImagePushed' &&
          r.selection.countNumber === 7 &&
          r.selection.countUnit === 'days',
      )
      const hasRetentionLimit = lifecycle.rules.some(
        (r) =>
          r.selection.tagStatus === 'any' &&
          r.selection.countType === 'imageCountMoreThan' &&
          r.selection.countNumber === 10,
      )
      expect(hasUntaggedExpiry, 'lifecycle should expire untagged images after 7d').toBe(true)
      expect(hasRetentionLimit, 'lifecycle should retain at most 10 tagged images').toBe(true)
    })

    it('creates an internet-facing ALB in public subnets', () => {
      t.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      })
    })

    it('creates an HTTP listener on port 80 (TLS terminates at CloudFront pre-Phase-5.5)', () => {
      t.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      })
      // No 443 listener during validation period
      const listeners = t.findResources('AWS::ElasticLoadBalancingV2::Listener')
      const httpsListeners = Object.entries(listeners).filter(
        ([, res]) => (res.Properties as { Port?: number; Protocol?: string }).Port === 443,
      )
      expect(httpsListeners).toHaveLength(0)
    })

    // Note: the AlbSg CloudFront-prefix-list ingress assertion lives in
    // network-stack.test.ts since the SG (and its rules) belong to the
    // NetworkStack. See `network-stack.test.ts` → "ALB SG ingress".

    it('target group health-checks /api/health with the documented thresholds', () => {
      t.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 3000,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckPath: '/api/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 10,
        HealthyThresholdCount: 3,
        UnhealthyThresholdCount: 2,
        TargetGroupAttributes: Match.arrayWith([
          Match.objectLike({
            Key: 'deregistration_delay.timeout_seconds',
            Value: '120',
          }),
        ]),
      })
    })

    it('LaunchTemplate requires IMDSv2 with hop-limit 2', () => {
      t.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          MetadataOptions: {
            HttpTokens: 'required',
            HttpPutResponseHopLimit: 2,
          },
        }),
      })
    })

    it('ASG configured for zero-downtime instance refresh', () => {
      t.hasResource('AWS::AutoScaling::AutoScalingGroup', {
        Properties: Match.objectLike({
          MinSize: '1',
          MaxSize: '2',
          DesiredCapacity: '1',
          HealthCheckType: 'ELB',
        }),
        UpdatePolicy: Match.objectLike({
          AutoScalingRollingUpdate: Match.objectLike({
            MinInstancesInService: 1,
            MaxBatchSize: 1,
          }),
        }),
      })
    })

    it('LaunchTemplate AssociatePublicIpAddress: true (validation-period topology)', () => {
      t.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          NetworkInterfaces: Match.arrayWith([
            Match.objectLike({ AssociatePublicIpAddress: true }),
          ]),
        }),
      })
    })

    it('creates the app log group with the correct retention', () => {
      t.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/seqtek/website/staging/app',
        RetentionInDays: 14,
      })
    })

    it('LaunchTemplate uses t3.micro for staging', () => {
      t.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
        }),
      })
    })
  })

  describe('prod (spec-shape config)', () => {
    const t = synthCompute('prod', prodCfg)

    it('imports ECR repository by name (does not create it)', () => {
      t.resourceCountIs('AWS::ECR::Repository', 0)
    })

    it('never pulls a bare :latest, with or without an imageTag', () => {
      // The ECR repository is SHARED — staging creates it, prod imports it by
      // name (asserted directly above). So the image tag is the only thing
      // isolating the two environments. A bare `:latest` is rewritten by every
      // staging merge, and production would pull that staging build on its next
      // instance replacement or scale-out. Nothing fails; prod just quietly
      // starts serving main. Guarded because the regression is invisible both
      // in a diff and at deploy time.
      //
      // Two paths, both asserted: the deploy passes `-c imageTag` (immutable),
      // and a bare local synth falls back to an env-scoped moving tag.
      const bare = JSON.stringify(Object.values(t.findResources('AWS::EC2::LaunchTemplate')))
      expect(bare).toContain(':latest-prod')
      expect(/:latest(?![-\w])/.test(bare)).toBe(false)

      const pinned = JSON.stringify(
        Object.values(
          synthCompute('prod', prodCfg, 'v1.2.3').findResources('AWS::EC2::LaunchTemplate'),
        ),
      )
      expect(pinned).toContain(':v1.2.3')
      expect(pinned).not.toContain(':latest')
    })

    it('ASG min/desired/max = 2/2/3 with min-in-service = 2', () => {
      t.hasResource('AWS::AutoScaling::AutoScalingGroup', {
        Properties: Match.objectLike({
          MinSize: '2',
          MaxSize: '3',
          DesiredCapacity: '2',
        }),
        UpdatePolicy: Match.objectLike({
          AutoScalingRollingUpdate: Match.objectLike({
            MinInstancesInService: 2,
          }),
        }),
      })
    })

    it('prod log group has 90d retention', () => {
      t.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/seqtek/website/prod/app',
        RetentionInDays: 90,
      })
    })

    it('prod LaunchTemplate uses t3.small', () => {
      t.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.small',
        }),
      })
    })

    it('prod ALB has deletion protection enabled', () => {
      t.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        LoadBalancerAttributes: Match.arrayWith([
          Match.objectLike({
            Key: 'deletion_protection.enabled',
            Value: 'true',
          }),
        ]),
      })
    })
  })
})
