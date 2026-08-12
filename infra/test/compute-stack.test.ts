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
  ownsAccountOidcProvider: false,
  ownsAccountEcrRepository: true,
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
  ownsAccountOidcProvider: true,
  ownsAccountEcrRepository: false,
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
        // 'ip' (not 'instance') is the awsvpc-mode target type Fargate
        // services require — there is no EC2 instance to register.
        TargetType: 'ip',
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

    it('Fargate service runs in public subnets with a public IP (validation-period topology)', () => {
      // Replaces the old LaunchTemplate AssociatePublicIpAddress assertion —
      // same no-NAT topology, expressed as ECS awsvpc network config instead
      // of an EC2 LaunchTemplate NetworkInterfaces override.
      t.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        NetworkConfiguration: Match.objectLike({
          AwsvpcConfiguration: Match.objectLike({
            AssignPublicIp: 'ENABLED',
          }),
        }),
      })
    })

    it('Fargate service has a native rolling deployment with circuit-breaker rollback', () => {
      // Replaces the old ASG AutoScalingRollingUpdate assertion. ECS checks
      // ALB target-group health during the deployment itself and rolls back
      // automatically on failure — no blind pauseTime wait like the ASG
      // version needed.
      t.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 1,
        DeploymentConfiguration: Match.objectLike({
          DeploymentCircuitBreaker: { Enable: true, Rollback: true },
        }),
      })
    })

    it('creates the app log group with the correct retention', () => {
      t.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/seqtek/website/staging/app',
        RetentionInDays: 14,
      })
    })

    it('Fargate task definition uses the cpu/memory mapped from instanceSize=micro', () => {
      t.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '256',
        Memory: '512',
      })
    })
  })

  describe('prod (spec-shape config)', () => {
    const t = synthCompute('prod', prodCfg)

    it('imports the ECR repository rather than creating a second one', () => {
      // Ownership is config (`ownsAccountEcrRepository`), not an env-name
      // assumption — that is what lets prod live in its own account, where it
      // would create the repo instead. With both envs in ONE account (this
      // fixture, matching cdk.json) staging creates it and prod imports it, so
      // the name never collides.
      t.resourceCountIs('AWS::ECR::Repository', 0)
    })

    it('never pulls a bare :latest, with or without an imageTag', () => {
      // Belt and braces alongside the per-env repositories above: even if the
      // repos were ever shared again, an immutable tag leaves nothing for a
      // staging build to overwrite. A bare `:latest` would reintroduce exactly
      // that, and the failure is invisible both in a diff and at deploy time —
      // prod would simply start serving main after its next task replacement.
      //
      // Two paths, both asserted: the deploy passes `-c imageTag` (immutable),
      // and a bare local synth falls back to an env-scoped moving tag. The
      // image URI now lives on the ECS TaskDefinition's container image
      // (was the EC2 LaunchTemplate's UserData docker-pull command).
      const bare = JSON.stringify(Object.values(t.findResources('AWS::ECS::TaskDefinition')))
      expect(bare).toContain(':latest-prod')
      expect(/:latest(?![-\w])/.test(bare)).toBe(false)

      const pinned = JSON.stringify(
        Object.values(
          synthCompute('prod', prodCfg, 'v1.2.3').findResources('AWS::ECS::TaskDefinition'),
        ),
      )
      expect(pinned).toContain(':v1.2.3')
      expect(pinned).not.toContain(':latest')
    })

    it('Fargate service desired count = 2, min/maxHealthyPercent scaled from asgMin/Max', () => {
      // Replaces the old ASG min/desired/max assertion. ECS expresses the
      // same "how many can be down / how many extra during a deploy" intent
      // as healthy-percent ratios rather than absolute instance counts:
      // minHealthyPercent 100% (= asgMinCapacity/asgDesiredCapacity = 2/2)
      // keeps min-in-service, maxHealthyPercent 150% (= asgMaxCapacity/
      // asgDesiredCapacity = 3/2) caps how many extra tasks run during a
      // rolling deployment.
      t.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 2,
        DeploymentConfiguration: Match.objectLike({
          MinimumHealthyPercent: 100,
          MaximumPercent: 150,
        }),
      })
    })

    it('prod log group has 90d retention', () => {
      t.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/seqtek/website/prod/app',
        RetentionInDays: 90,
      })
    })

    it('prod Fargate task definition uses the cpu/memory mapped from instanceSize=small', () => {
      t.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '512',
        Memory: '1024',
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

  describe('with a secondaryLane (temporary ww3.seqtek.com PROD-preview lane)', () => {
    const t = synthCompute('staging', {
      ...stagingCfg,
      domainName: 'seqtek-preview.com',
      hostedZoneId: 'Z0000000000000000000A',
      certificateSans: ['*.seqtek-preview.com'],
      dnsRecordNames: ['seqtek-preview.com'],
      secondaryLane: {
        name: 'prod',
        databaseName: 'seqtek_prod',
        dnsRecordNames: ['ww3.seqtek-preview.com'],
      },
    })

    it('creates a second Fargate task definition and service sharing the same cluster', () => {
      t.resourceCountIs('AWS::ECS::TaskDefinition', 2)
      t.resourceCountIs('AWS::ECS::Service', 2)
      t.resourceCountIs('AWS::ECS::Cluster', 1)
    })

    it('second task definition points DB_NAME at the lane database as a literal, not a secret', () => {
      const containers = t.findResources('AWS::ECS::TaskDefinition')
      const secondaryDef = Object.values(containers).find((r) => {
        const envVars = (
          r.Properties as {
            ContainerDefinitions: Array<{ Environment?: Array<{ Name: string; Value?: string }> }>
          }
        ).ContainerDefinitions[0]?.Environment
        return envVars?.some((e) => e.Name === 'DB_NAME' && e.Value === 'seqtek_prod')
      })
      expect(
        secondaryDef,
        'expected one task def with a literal DB_NAME=seqtek_prod env var',
      ).toBeDefined()
    })

    it('creates a second target group and a host-header-forwarding ALB rule at a non-default priority', () => {
      t.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2)
      t.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 10,
        Conditions: Match.arrayWith([
          Match.objectLike({
            Field: 'http-header',
            HttpHeaderConfig: Match.objectLike({
              HttpHeaderName: 'x-forwarded-host',
              Values: ['ww3.seqtek-preview.com'],
            }),
          }),
        ]),
      })
    })

    it('does NOT create a second lane when secondaryLane is null', () => {
      const withoutLane = synthCompute('staging', stagingCfg)
      withoutLane.resourceCountIs('AWS::ECS::TaskDefinition', 1)
      withoutLane.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1)
    })
  })
})
