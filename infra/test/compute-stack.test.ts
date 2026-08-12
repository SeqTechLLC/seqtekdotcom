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
  cognitoAuthEnabled: false,
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

    it('secondaryImageTag defaults to imageTag, so an ordinary deploy moves both lanes together', () => {
      const bare = JSON.stringify(Object.values(t.findResources('AWS::ECS::TaskDefinition')))
      // Neither `-c imageTag` nor `-c secondaryImageTag` was passed to this
      // synth, so both fall back to the env-scoped default.
      expect(bare.match(/latest-staging/g)?.length).toBe(2)
    })

    it('an explicit secondaryImageTag promotes ONLY the secondary lane, leaving the primary tag untouched', () => {
      // Mirrors what a GitHub release deploy passes: `-c imageTag=<pinned,
      // currently-running tag>` (so the primary lane's task def is a no-op)
      // plus `-c secondaryImageTag=<the release's vX.Y.Z tag>`.
      const app = new App({
        context: { imageTag: 'abc1234', secondaryImageTag: 'v1.2.3' },
      })
      const cfg = {
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
      }
      const network = new NetworkStack(app, 'SeqtekStagingNetwork2', {
        env: { account: '123456789012', region: 'us-east-1' },
        envName: 'staging',
        cfg,
      })
      const data = new DataStack(app, 'SeqtekStagingData2', {
        env: { account: '123456789012', region: 'us-east-1' },
        envName: 'staging',
        cfg,
        network,
      })
      const compute = new ComputeStack(app, 'SeqtekStagingCompute2', {
        env: { account: '123456789012', region: 'us-east-1' },
        envName: 'staging',
        cfg,
        network,
        data,
      })
      const pinned = Template.fromStack(compute)
      const bare = JSON.stringify(Object.values(pinned.findResources('AWS::ECS::TaskDefinition')))
      expect(bare).toContain(':abc1234')
      expect(bare).toContain(':v1.2.3')
      expect(bare).not.toContain('latest-staging')
    })
  })

  describe('with cognitoAuthEnabled (Google Workspace SSO gate)', () => {
    const cfg: EnvConfig = {
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
      cognitoAuthEnabled: true,
    }
    const t = synthCompute('staging', cfg)

    it('creates exactly one Cognito User Pool, Client, Domain, and UI customization', () => {
      t.resourceCountIs('AWS::Cognito::UserPool', 1)
      t.resourceCountIs('AWS::Cognito::UserPoolClient', 1)
      t.resourceCountIs('AWS::Cognito::UserPoolDomain', 1)
      t.resourceCountIs('AWS::Cognito::UserPoolUICustomizationAttachment', 1)
      t.resourceCountIs('AWS::Cognito::UserPoolIdentityProvider', 1)
    })

    it('uses an HTTPS (443) listener with a certificate, not the validation-period HTTP/80 one', () => {
      // ALB's authenticate-oidc action (the Cognito gate) only works on
      // HTTPS listeners — a real deploy rejection confirmed this
      // 2026-08-12. No HTTP listener should exist on this ALB at all.
      t.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS',
        Certificates: Match.arrayWith([Match.objectLike({ CertificateArn: Match.anyValue() })]),
      })
      const listeners = t.findResources('AWS::ElasticLoadBalancingV2::Listener')
      const httpListeners = Object.entries(listeners).filter(
        ([, res]) => (res.Properties as { Port?: number }).Port === 80,
      )
      expect(httpListeners).toHaveLength(0)
    })

    it('the App Client is Google-only, with a callback/logout URL per gated hostname', () => {
      t.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        SupportedIdentityProviders: ['Google'],
        GenerateSecret: true,
        CallbackURLs: Match.arrayWith([
          'https://seqtek-preview.com/oauth2/idpresponse',
          'https://ww3.seqtek-preview.com/oauth2/idpresponse',
        ]),
      })
    })

    it('wraps the primary lane default action in authenticate-oidc before forwarding', () => {
      // OnUnauthenticatedRequest defaults to AUTHENTICATE per CDK's own
      // docs, but CDK omits the property from the template rather than
      // writing the literal default — ALB applies it server-side, so
      // asserting its presence here would fail against correct behavior.
      t.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'authenticate-oidc',
            Order: 1,
            AuthenticateOidcConfig: Match.objectLike({
              Issuer: Match.anyValue(),
              AuthorizationEndpoint: Match.anyValue(),
            }),
          }),
          Match.objectLike({ Type: 'forward', Order: 2 }),
        ]),
      })
    })

    it('wraps the secondaryLane rule in authenticate-oidc too', () => {
      t.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 10,
        Actions: Match.arrayWith([
          Match.objectLike({ Type: 'authenticate-oidc' }),
          Match.objectLike({ Type: 'forward' }),
        ]),
      })
    })

    it('exempts /api/health, /_next/image, and /api/media/file/* on BOTH lanes with plain forward rules ahead of the gated rules', () => {
      // /_next/image added 2026-08-12: gating Next.js's image-optimizer
      // route broke every <Image> on the site (browser got a redirect-to-
      // login instead of image bytes). /api/media/file/* added the SAME
      // day — exempting only /_next/image wasn't enough, since the
      // optimizer's own upstream fetch (next.config.ts's
      // images.localPatterns) was STILL gated. Scoped to .../file/* so
      // Payload's collection list/create/delete endpoints at the bare
      // /api/media stay gated. /api/revalidate deliberately NOT exempted
      // — nothing calls it over HTTP (content publishes trigger an
      // in-process hook instead), so there's nothing to unblock yet.
      const rules = t.findResources('AWS::ElasticLoadBalancingV2::ListenerRule')
      const byPriority = (p: number) =>
        Object.values(rules).find((r) => (r.Properties as { Priority: number }).Priority === p)
      const primaryBypass = byPriority(6)
      const secondaryBypass = byPriority(5)
      expect(
        primaryBypass,
        'expected a priority-6 rule for the primary health bypass',
      ).toBeDefined()
      expect(
        secondaryBypass,
        'expected a priority-5 rule for the secondary lane health bypass',
      ).toBeDefined()
      for (const rule of [primaryBypass, secondaryBypass]) {
        const props = rule!.Properties as {
          Actions: Array<{ Type: string }>
          Conditions: Array<{ Field: string; PathPatternConfig?: { Values: string[] } }>
        }
        expect(props.Actions.every((a) => a.Type === 'forward')).toBe(true)
        const pathValues = props.Conditions.find((c) => c.Field === 'path-pattern')
          ?.PathPatternConfig?.Values
        expect(pathValues).toContain('/api/health')
        expect(pathValues).toContain('/_next/image')
        expect(pathValues).toContain('/api/media/file/*')
        expect(pathValues).not.toContain('/api/revalidate')
      }
    })

    it('does NOT create any Cognito resources when cognitoAuthEnabled is false', () => {
      const withoutGate = synthCompute('staging', { ...cfg, cognitoAuthEnabled: false })
      withoutGate.resourceCountIs('AWS::Cognito::UserPool', 0)
      withoutGate.resourceCountIs('AWS::ElasticLoadBalancingV2::ListenerRule', 1) // just SecondaryLaneRule
    })
  })

  describe('NEXT_PUBLIC_SITE_URL when domainName differs from dnsRecordNames (the real preview env shape)', () => {
    // Regression test for a bug found live 2026-08-12: the primary lane's
    // container set NEXT_PUBLIC_SITE_URL from cfg.domainName instead of
    // cfg.dnsRecordNames[0]. Every fixture elsewhere in this file uses a
    // domainName that happens to equal dnsRecordNames[0], so the bug
    // synthed clean and only showed up against the real preview env's
    // actual cdk.json shape: domainName is the CERTIFICATE's domain
    // ('seqtek.com', the real live site, which this env doesn't serve),
    // dnsRecordNames is what's ACTUALLY reachable ('preview.seqtek.com').
    // The bug pointed every absolute URL the app built — including every
    // image src — at https://seqtek.com instead of itself.
    const t = synthCompute('staging', {
      ...stagingCfg,
      domainName: 'seqtek.com',
      hostedZoneId: 'ZDNRI358EUS3R',
      certificateSans: ['*.seqtek.com'],
      dnsRecordNames: ['preview.seqtek.com'],
    })

    it('uses dnsRecordNames[0], not domainName', () => {
      const taskDefs = t.findResources('AWS::ECS::TaskDefinition')
      const envVars = Object.values(taskDefs)[0]!.Properties as {
        ContainerDefinitions: Array<{ Environment?: Array<{ Name: string; Value?: string }> }>
      }
      const siteUrl = envVars.ContainerDefinitions[0]?.Environment?.find(
        (e) => e.Name === 'NEXT_PUBLIC_SITE_URL',
      )?.Value
      expect(siteUrl).toBe('https://preview.seqtek.com')
    })
  })
})
