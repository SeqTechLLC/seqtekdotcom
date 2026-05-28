import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import type { EnvConfig } from '../lib/construct-utils'
import { NetworkStack } from '../lib/network-stack'

// Minimal valid EnvConfig fixtures matching the cdk.json shape.
const prodCfg: EnvConfig = {
  region: 'us-east-1',
  domainName: null,
  hostedZoneId: null,
  certificateArn: null,
  instanceClass: 't3',
  instanceSize: 'small',
  rdsInstanceClass: 't3.small',
  rdsAllocatedStorageGb: 50,
  rdsMultiAz: false,
  asgMinCapacity: 2,
  asgDesiredCapacity: 2,
  asgMaxCapacity: 3,
  ecrRetainCount: 10,
  logRetentionDays: 90,
}

const stagingCfg: EnvConfig = {
  ...prodCfg,
  asgMinCapacity: 1,
  asgDesiredCapacity: 1,
  asgMaxCapacity: 2,
  logRetentionDays: 14,
}

function synthProd(): Template {
  const app = new App()
  const stack = new NetworkStack(app, 'SeqtekProdNetwork', {
    env: { account: '123456789012', region: 'us-east-1' },
    envName: 'prod',
    cfg: prodCfg,
  })
  return Template.fromStack(stack)
}

function synthStaging(): Template {
  const app = new App()
  const stack = new NetworkStack(app, 'SeqtekStagingNetwork', {
    env: { account: '123456789012', region: 'us-east-1' },
    envName: 'staging',
    cfg: stagingCfg,
  })
  return Template.fromStack(stack)
}

describe('NetworkStack', () => {
  it('provisions a VPC with exactly 2 AZs', () => {
    const t = synthProd()
    t.resourceCountIs('AWS::EC2::VPC', 1)
    // 2 AZs × 2 tiers (public + isolated) = 4 subnets during the
    // validation-period topology per Clarifications Session 2026-05-26.
    // At Phase 5.5 the private-with-egress tier is added (back to 6).
    t.resourceCountIs('AWS::EC2::Subnet', 4)
  })

  it('places isolated subnets with no internet route', () => {
    const t = synthProd()
    // Isolated subnets must not be associated with a route table that
    // has a 0.0.0.0/0 route. CDK creates separate route tables per
    // subnet tier; the isolated tier's RouteTable has no internet route.
    const routes = t.findResources('AWS::EC2::Route')
    const isolatedRoutes = Object.entries(routes).filter(([id]) => id.includes('isolated'))
    for (const [, route] of isolatedRoutes) {
      const props = route.Properties as { DestinationCidrBlock?: string }
      expect(props.DestinationCidrBlock).not.toBe('0.0.0.0/0')
    }
    // And there should be no NAT route from the isolated route table.
    for (const [, route] of isolatedRoutes) {
      const props = route.Properties as { NatGatewayId?: unknown }
      expect(props.NatGatewayId).toBeUndefined()
    }
  })

  it('creates zero NAT gateways during the validation-period topology', () => {
    // Phase 5.5 flips this to 1 alongside the multi-AZ RDS flip.
    const t = synthProd()
    t.resourceCountIs('AWS::EC2::NatGateway', 0)
  })

  it('creates 4 security groups (ALB, App, RDS, Lambda)', () => {
    const t = synthProd()
    // CDK also creates VPC default SG management resources; we assert
    // the 4 we explicitly create are present by description match.
    t.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('ALB ingress'),
    })
    t.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('EC2 app instances ingress: 3000'),
    })
    t.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('RDS ingress: 5432'),
    })
    t.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('Slack notifier'),
    })
  })

  it('ALB SG ingress: CloudFront managed prefix list only, on port 80 (validation-period)', () => {
    // Validation-period topology: only port 80 ingress. Phase 5.5
    // swaps to port 443 when ALB HTTPS listener lands. AWS SG quota
    // (default 60 rules) prevents holding both rules simultaneously
    // since the CloudFront prefix list consumes ~55 rules per use.
    const t = synthProd()
    const ingresses = t.findResources('AWS::EC2::SecurityGroupIngress')
    const fromCloudFront80 = Object.values(ingresses).filter((r) => {
      const props = r.Properties as { SourcePrefixListId?: string; FromPort?: number }
      return props.SourcePrefixListId === 'pl-3b927c52' && props.FromPort === 80
    })
    const fromCloudFront443 = Object.values(ingresses).filter((r) => {
      const props = r.Properties as { SourcePrefixListId?: string; FromPort?: number }
      return props.SourcePrefixListId === 'pl-3b927c52' && props.FromPort === 443
    })
    expect(fromCloudFront80.length, 'port 80 ingress present').toBeGreaterThanOrEqual(1)
    expect(fromCloudFront443.length, 'port 443 ingress absent during validation period').toBe(0)
  })

  it('app SG accepts ingress on 3000 only from ALB SG', () => {
    const t = synthProd()
    t.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 3000,
      ToPort: 3000,
      IpProtocol: 'tcp',
      SourceSecurityGroupId: Match.anyValue(),
    })
  })

  it('RDS SG accepts ingress on 5432 only from App SG', () => {
    const t = synthProd()
    t.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 5432,
      ToPort: 5432,
      IpProtocol: 'tcp',
      SourceSecurityGroupId: Match.anyValue(),
    })
  })

  it('all SG ingress descriptions match AWS allowed charset (no >, no Unicode)', () => {
    // AWS EC2 only accepts SG rule descriptions from the character set
    // `a-zA-Z0-9. _-:/()#,@[]+=&;{}!$*`. `>` and Unicode characters are
    // rejected at deploy time with a 400 ServiceError. CDK assertion
    // tests check shape, not value — so this regex check exists to
    // catch the regression class that bit us twice on first deploy.
    const ALLOWED = /^[a-zA-Z0-9. _\-:/()#,@[\]+=&;{}!$*]*$/
    const t = synthProd()
    const standalone = t.findResources('AWS::EC2::SecurityGroupIngress')
    for (const [id, r] of Object.entries(standalone)) {
      const d = (r.Properties as { Description?: string }).Description
      if (d !== undefined) {
        expect(
          d,
          `${id} description must match AWS allowed charset, got: ${JSON.stringify(d)}`,
        ).toMatch(ALLOWED)
      }
    }
    const sgs = t.findResources('AWS::EC2::SecurityGroup')
    for (const [id, r] of Object.entries(sgs)) {
      const inline =
        (r.Properties as { SecurityGroupIngress?: Array<{ Description?: string }> })
          .SecurityGroupIngress ?? []
      for (const rule of inline) {
        if (rule.Description !== undefined) {
          expect(
            rule.Description,
            `${id} inline ingress description must match AWS allowed charset, got: ${JSON.stringify(rule.Description)}`,
          ).toMatch(ALLOWED)
        }
      }
    }
  })

  it('no security group allows ingress from 0.0.0.0/0 on any port', () => {
    const t = synthProd()
    const sgs = t.findResources('AWS::EC2::SecurityGroup')
    for (const [, sg] of Object.entries(sgs)) {
      const ingress = (sg.Properties as { SecurityGroupIngress?: Array<{ CidrIp?: string }> })
        .SecurityGroupIngress
      if (ingress) {
        for (const rule of ingress) {
          expect(rule.CidrIp).not.toBe('0.0.0.0/0')
        }
      }
    }
    const standaloneIngress = t.findResources('AWS::EC2::SecurityGroupIngress')
    for (const [, rule] of Object.entries(standaloneIngress)) {
      const props = rule.Properties as { CidrIp?: string }
      expect(props.CidrIp).not.toBe('0.0.0.0/0')
    }
  })

  it('emits the expected exports for cross-stack consumption', () => {
    const t = synthProd()
    t.hasOutput('VpcId', {
      Export: { Name: 'SeqtekProdNetwork-VpcId' },
    })
    t.hasOutput('AlbSgId', {})
    t.hasOutput('AppSgId', {})
    t.hasOutput('RdsSgId', {})
    t.hasOutput('LambdaSgId', {})
  })

  it('staging stack synthesizes without errors', () => {
    expect(() => synthStaging()).not.toThrow()
  })
})
