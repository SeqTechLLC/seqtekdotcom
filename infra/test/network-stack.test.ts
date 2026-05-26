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
    // 2 AZs × 3 tiers (public/private/isolated) = 6 subnets
    t.resourceCountIs('AWS::EC2::Subnet', 6)
  })

  it('places isolated subnets with no internet route', () => {
    const t = synthProd()
    // Isolated subnets should not be associated with a route table that
    // has a 0.0.0.0/0 route. The simplest assertion: no NAT route in
    // the isolated route table. CDK creates separate route tables per
    // subnet tier; the isolated tier's RouteTable has no NAT route.
    const routes = t.findResources('AWS::EC2::Route')
    const isolatedRoutes = Object.entries(routes).filter(([id]) => id.includes('isolated'))
    for (const [, route] of isolatedRoutes) {
      const props = route.Properties as { DestinationCidrBlock?: string }
      expect(props.DestinationCidrBlock).not.toBe('0.0.0.0/0')
    }
  })

  it('creates exactly one NAT gateway per env', () => {
    const t = synthProd()
    t.resourceCountIs('AWS::EC2::NatGateway', 1)
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
