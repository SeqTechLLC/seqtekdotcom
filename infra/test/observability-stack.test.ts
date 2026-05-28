import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { ComputeStack } from '../lib/compute-stack'
import type { EnvConfig } from '../lib/construct-utils'
import { DataStack } from '../lib/data-stack'
import { EdgeStack } from '../lib/edge-stack'
import { NetworkStack } from '../lib/network-stack'
import { ObservabilityStack } from '../lib/observability-stack'

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

function synthObservability(
  envName: 'prod' | 'staging',
  cfg: EnvConfig,
): { template: Template; stackName: string } {
  const app = new App()
  const prefix = envName === 'prod' ? 'SeqtekProd' : 'SeqtekStaging'
  const network = new NetworkStack(app, `${prefix}Network`, { envName, cfg })
  const data = new DataStack(app, `${prefix}Data`, { envName, cfg, network })
  const compute = new ComputeStack(app, `${prefix}Compute`, { envName, cfg, network, data })
  const edge = new EdgeStack(app, `${prefix}Edge`, { envName, cfg, compute, data })
  const obs = new ObservabilityStack(app, `${prefix}Observability`, {
    envName,
    cfg,
    network,
    data,
    compute,
    edge,
  })
  return { template: Template.fromStack(obs), stackName: `${prefix}Observability` }
}

const EXPECTED_ALARM_SHORT_NAMES = [
  'AlbFiveXx',
  'AlbUnhealthyHost',
  'Ec2CpuHigh',
  'Ec2MemoryHigh',
  'Ec2DiskHigh',
  'RdsCpuHigh',
  'RdsFreeStorageLow',
  'RdsConnectionsHigh',
  'CloudFrontErrorRate',
]

describe('ObservabilityStack', () => {
  describe.each([
    { envName: 'staging' as const, cfg: stagingCfg },
    { envName: 'prod' as const, cfg: prodCfg },
  ])('$envName synthesis', ({ envName, cfg }) => {
    const { template, stackName } = synthObservability(envName, cfg)

    it('creates exactly one SNS topic with at-rest encryption (alias/aws/sns)', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1)
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `${stackName}-AlarmTopic`,
        KmsMasterKeyId: 'alias/aws/sns',
      })
    })

    it('exposes exactly 9 CloudWatch alarms with the documented short names', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 9)
      for (const shortName of EXPECTED_ALARM_SHORT_NAMES) {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `${stackName}-${shortName}`,
        })
      }
    })

    it('routes both ALARM and OK transitions to the SNS topic on every alarm', () => {
      // Each alarm must publish both ALARM and OK actions to the topic so
      // the channel sees recovery as well as the initial fire.
      const alarms = template.findResources('AWS::CloudWatch::Alarm')
      const alarmEntries = Object.values(alarms)
      expect(alarmEntries).toHaveLength(9)
      for (const alarm of alarmEntries) {
        const props = (alarm as { Properties: Record<string, unknown> }).Properties
        expect(Array.isArray(props.AlarmActions)).toBe(true)
        expect(Array.isArray(props.OKActions)).toBe(true)
        expect((props.AlarmActions as unknown[]).length).toBeGreaterThanOrEqual(1)
        expect((props.OKActions as unknown[]).length).toBeGreaterThanOrEqual(1)
      }
    })

    it('creates the SlackNotifier Lambda with the correct env var, runtime, and bundling target', () => {
      template.resourceCountIs('AWS::Lambda::Function', 1)
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${stackName}-SlackNotifier`,
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            WEBHOOK_PARAMETER_PATH: `/seqtek/website/${envName}/slack_webhook_url`,
          },
        },
      })
    })

    it('SlackNotifier IAM role grants SSM:GetParameter scoped to the webhook path only', () => {
      // The policy renders the Resource ARN as a Fn::Join with refs to
      // AWS::Partition / AccountId etc. — match on the joined-segment
      // that carries the webhook parameter path suffix.
      const expectedSuffix = `:parameter/seqtek/website/${envName}/slack_webhook_url`
      const policies = template.findResources('AWS::IAM::Policy')
      const hasWebhookStatement = Object.values(policies).some((policy) => {
        const statements = (
          policy as {
            Properties: { PolicyDocument: { Statement: { Sid?: string; Resource?: unknown }[] } }
          }
        ).Properties.PolicyDocument.Statement
        return statements.some(
          (s) =>
            s.Sid === 'GetWebhookFromParameterStore' &&
            JSON.stringify(s.Resource).includes(expectedSuffix),
        )
      })
      expect(hasWebhookStatement).toBe(true)
    })

    it('SlackNotifier is intentionally NOT in a VPC (validation-period — no NAT yet)', () => {
      // Documents the validation-period deviation from data-model § 1
      // (PrivateSubnet + LambdaSg). Flips at Phase 5.5 launch readiness.
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${stackName}-SlackNotifier`,
        VpcConfig: Match.absent(),
      })
    })

    it('subscribes the Lambda to the SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
      })
    })

    it('creates the EventBridge heartbeat rule firing every 6 hours with the HEARTBEAT payload', () => {
      template.resourceCountIs('AWS::Events::Rule', 1)
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `${stackName}-Heartbeat`,
        ScheduleExpression: 'rate(6 hours)',
      })
      // The InputTemplate is a CFN Fn::Join because we reference event
      // path fields (`$.time`); walk the actual rule and assert one of
      // the join segments carries the HEARTBEAT marker.
      const rules = template.findResources('AWS::Events::Rule')
      const rule = Object.values(rules)[0] as {
        Properties: {
          Targets: { InputTransformer?: { InputTemplate: unknown } }[]
        }
      }
      const inputTemplate = rule.Properties.Targets[0]?.InputTransformer?.InputTemplate
      const flattened = JSON.stringify(inputTemplate)
      expect(flattened).toContain('NewStateValue')
      expect(flattened).toContain('HEARTBEAT')
      expect(flattened).toContain('AlarmName')
    })

    it('SlackNotifier log group has 14-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/${stackName}-SlackNotifier`,
        RetentionInDays: 14,
      })
    })
  })

  it('alarm thresholds match the data-model § 1 spec', () => {
    const { template, stackName } = synthObservability('staging', stagingCfg)
    const cases: { short: string; check: Record<string, unknown> }[] = [
      {
        short: 'AlbFiveXx',
        check: { Threshold: 5, EvaluationPeriods: 1, ComparisonOperator: 'GreaterThanThreshold' },
      },
      {
        short: 'AlbUnhealthyHost',
        check: { Threshold: 0, EvaluationPeriods: 2 },
      },
      {
        short: 'Ec2CpuHigh',
        check: { Threshold: 80, EvaluationPeriods: 10 },
      },
      {
        short: 'RdsFreeStorageLow',
        check: {
          Threshold: 2 * 1024 * 1024 * 1024,
          ComparisonOperator: 'LessThanThreshold',
        },
      },
      {
        short: 'CloudFrontErrorRate',
        check: { Threshold: 1, EvaluationPeriods: 1 },
      },
    ]
    for (const { short, check } of cases) {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${stackName}-${short}`,
        ...check,
      })
    }
  })
})
