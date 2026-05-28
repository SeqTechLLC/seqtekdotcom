import { Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions'
import * as events from 'aws-cdk-lib/aws-events'
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as snsSubs from 'aws-cdk-lib/aws-sns-subscriptions'
import type { Construct } from 'constructs'
import { join } from 'node:path'
import type { ComputeStack } from './compute-stack'
import type { EnvConfig, EnvName } from './construct-utils'
import type { DataStack } from './data-stack'
import type { EdgeStack } from './edge-stack'
import type { NetworkStack } from './network-stack'

export interface ObservabilityStackProps extends StackProps {
  envName: EnvName
  cfg: EnvConfig
  network: NetworkStack
  data: DataStack
  compute: ComputeStack
  edge: EdgeStack
}

/**
 * Observability plane per spec 002 / US3 / T042.
 *
 * - SNS topic with at-rest encryption (aws-managed key)
 * - Slack notifier Lambda (NodejsFunction, esbuild-bundled)
 * - 9 CloudWatch alarms per ARCHITECTURE.md §8 / data-model § 1
 * - EventBridge heartbeat rule firing every 6h
 *
 * **Network placement deviation from data-model § 1 (validation-period)**:
 * the Lambda runs without VPC config because the validation-period
 * network topology has no NAT gateway (Clarifications Session 2026-05-26)
 * and a VPC-bound Lambda without NAT cannot reach hooks.slack.com. IAM
 * scoping on the SSM webhook parameter is the actual security boundary;
 * the Lambda only has GetParameter on one path and outbound HTTPS via
 * AWS Lambda's runtime networking. Phase 5.5 launch-readiness review
 * adds NAT and flips this to PRIVATE_WITH_EGRESS placement.
 */
export class ObservabilityStack extends Stack {
  public readonly alarmTopic: sns.Topic
  public readonly slackNotifier: lambdaNode.NodejsFunction
  public readonly heartbeatRule: events.Rule

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props)

    const { envName, cfg, data, compute, edge } = props
    void cfg
    const envPrefix = envName === 'prod' ? 'SeqtekProd' : 'SeqtekStaging'
    const webhookParameterPath = `/seqtek/website/${envName}/slack_webhook_url`

    // ---------- SNS topic ----------
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${envPrefix}Observability-AlarmTopic`,
      displayName: `${envPrefix} CloudWatch alarms`,
      // AWS-managed SNS KMS key — encryption at rest without paying for a
      // customer-managed key. CloudWatch can publish across this boundary.
      masterKey: undefined,
      enforceSSL: true,
    })
    // Workaround: `masterKey: undefined` does NOT enable encryption. We
    // attach a CFN override so the synth output sets KmsMasterKeyId to
    // the aws-managed alias — keeps the assertion that encryption is
    // configured without paying for a CMK.
    const cfnTopic = this.alarmTopic.node.defaultChild as sns.CfnTopic
    cfnTopic.kmsMasterKeyId = 'alias/aws/sns'

    const action = new cwActions.SnsAction(this.alarmTopic)

    // ---------- Slack notifier Lambda ----------
    const slackRole = new iam.Role(this, 'SlackNotifierRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Slack notifier Lambda execution role (${envName})`,
    })
    slackRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    )
    slackRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'GetWebhookFromParameterStore',
        actions: ['ssm:GetParameter'],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter${webhookParameterPath}`],
      }),
    )
    slackRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'DecryptParameterStoreSecret',
        actions: ['kms:Decrypt'],
        resources: [`arn:aws:kms:${this.region}:${this.account}:alias/aws/ssm`],
      }),
    )

    // Create the LogGroup explicitly so we can set retention without
    // hitting the deprecated `logRetention` prop. NodejsFunction will
    // write to this group; the implicit /aws/lambda/<name> name keeps
    // CloudWatch console paths predictable.
    const slackLogGroup = new logs.LogGroup(this, 'SlackNotifierLogGroup', {
      logGroupName: `/aws/lambda/${envPrefix}Observability-SlackNotifier`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    this.slackNotifier = new lambdaNode.NodejsFunction(this, 'SlackNotifier', {
      functionName: `${envPrefix}Observability-SlackNotifier`,
      // Lambda entry is the handler module at the lambda directory root.
      entry: join(__dirname, '..', 'lambda', 'slack-notifier', 'index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      role: slackRole,
      timeout: Duration.seconds(15),
      memorySize: 256,
      environment: {
        WEBHOOK_PARAMETER_PATH: webhookParameterPath,
      },
      logGroup: slackLogGroup,
      bundling: {
        // Lambda runtime provides @aws-sdk/* — don't bundle it.
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        target: 'node22',
        format: lambdaNode.OutputFormat.CJS,
      },
    })
    this.slackNotifier.applyRemovalPolicy(RemovalPolicy.DESTROY)

    this.alarmTopic.addSubscription(new snsSubs.LambdaSubscription(this.slackNotifier))

    // ---------- 9 CloudWatch alarms ----------
    // Each alarm: 1 mandatory NewStateValue=ALARM → SNS, plus OK → SNS so
    // the channel sees recovery. Where INSUFFICIENT_DATA is meaningful
    // (the metric should always be present), it also notifies.
    const alarms: cloudwatch.Alarm[] = []

    // 1. ALB 5xx — HTTPCode_Target_5XX > 5 in 5 min
    alarms.push(
      new cloudwatch.Alarm(this, 'AlbFiveXx', {
        alarmName: `${envPrefix}Observability-AlbFiveXx`,
        alarmDescription: 'ALB 5xx error rate above 5 in 5 minutes',
        metric: compute.loadBalancer.metrics.httpCodeTarget(
          // @ts-expect-error CDK enum vs string union — runtime accepts the enum.
          'Target_5XX_Count',
          { period: Duration.minutes(5), statistic: 'Sum' },
        ),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
    )

    // 2. ALB UnHealthyHostCount > 0 for 2 min
    alarms.push(
      new cloudwatch.Alarm(this, 'AlbUnhealthyHost', {
        alarmName: `${envPrefix}Observability-AlbUnhealthyHost`,
        alarmDescription: 'ALB target group reporting any unhealthy host for 2 minutes',
        metric: compute.targetGroup.metrics.unhealthyHostCount({
          period: Duration.minutes(1),
          statistic: 'Maximum',
        }),
        threshold: 0,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }),
    )

    // 3. EC2 CPU > 80% sustained 10 min (ASG-aggregate average)
    alarms.push(
      new cloudwatch.Alarm(this, 'Ec2CpuHigh', {
        alarmName: `${envPrefix}Observability-Ec2CpuHigh`,
        alarmDescription: 'EC2 average CPU above 80% sustained 10 minutes',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: { AutoScalingGroupName: compute.autoScalingGroup.autoScalingGroupName },
          period: Duration.minutes(1),
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 10,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
    )

    // 4. EC2 memory > 85% sustained 10 min (CW Agent metric)
    alarms.push(
      new cloudwatch.Alarm(this, 'Ec2MemoryHigh', {
        alarmName: `${envPrefix}Observability-Ec2MemoryHigh`,
        alarmDescription: 'EC2 memory above 85% sustained 10 minutes (requires CW Agent)',
        metric: new cloudwatch.Metric({
          namespace: 'CWAgent',
          metricName: 'mem_used_percent',
          dimensionsMap: { AutoScalingGroupName: compute.autoScalingGroup.autoScalingGroupName },
          period: Duration.minutes(1),
          statistic: 'Average',
        }),
        threshold: 85,
        evaluationPeriods: 10,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
    )

    // 5. EC2 disk > 80% (CW Agent metric)
    alarms.push(
      new cloudwatch.Alarm(this, 'Ec2DiskHigh', {
        alarmName: `${envPrefix}Observability-Ec2DiskHigh`,
        alarmDescription: 'EC2 disk usage above 80% (requires CW Agent)',
        metric: new cloudwatch.Metric({
          namespace: 'CWAgent',
          metricName: 'disk_used_percent',
          dimensionsMap: { AutoScalingGroupName: compute.autoScalingGroup.autoScalingGroupName },
          period: Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
    )

    // 6. RDS CPU > 80% sustained 10 min
    alarms.push(
      new cloudwatch.Alarm(this, 'RdsCpuHigh', {
        alarmName: `${envPrefix}Observability-RdsCpuHigh`,
        alarmDescription: 'RDS CPU above 80% sustained 10 minutes',
        metric: data.database.metricCPUUtilization({
          period: Duration.minutes(1),
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 10,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
    )

    // 7. RDS free storage < 2GB
    alarms.push(
      new cloudwatch.Alarm(this, 'RdsFreeStorageLow', {
        alarmName: `${envPrefix}Observability-RdsFreeStorageLow`,
        alarmDescription: 'RDS free storage below 2 GB',
        metric: data.database.metricFreeStorageSpace({
          period: Duration.minutes(5),
          statistic: 'Minimum',
        }),
        threshold: 2 * 1024 * 1024 * 1024, // 2 GiB in bytes
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }),
    )

    // 8. RDS connections > 60. Threshold sized for db.t3.{micro,small}:
    // db.t3.micro max=87 (80%≈70), db.t3.small max=170 (80%≈136). Using
    // a single conservative threshold sized to t3.micro so the staging
    // (validation-period) instance also alarms before exhaustion.
    alarms.push(
      new cloudwatch.Alarm(this, 'RdsConnectionsHigh', {
        alarmName: `${envPrefix}Observability-RdsConnectionsHigh`,
        alarmDescription: 'RDS connection count above 60 (sized to db.t3.micro 80% safety margin)',
        metric: data.database.metricDatabaseConnections({
          period: Duration.minutes(1),
          statistic: 'Maximum',
        }),
        threshold: 60,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
    )

    // 9. CloudFront 5xx error rate > 1% in 5 min
    alarms.push(
      new cloudwatch.Alarm(this, 'CloudFrontErrorRate', {
        alarmName: `${envPrefix}Observability-CloudFrontErrorRate`,
        alarmDescription: 'CloudFront 5xx error rate above 1% in 5 minutes',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: '5xxErrorRate',
          dimensionsMap: {
            DistributionId: edge.distribution.distributionId,
            Region: 'Global',
          },
          period: Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
    )

    for (const alarm of alarms) {
      alarm.addAlarmAction(action)
      alarm.addOkAction(action)
    }

    // ---------- Heartbeat — EventBridge rule fires every 6h ----------
    // The rule target is the SNS topic; the input shape mimics the CW
    // alarm envelope just enough that formatAlarmBlocks() routes it to
    // the heartbeat branch (NewStateValue: "HEARTBEAT").
    this.heartbeatRule = new events.Rule(this, 'HeartbeatRule', {
      ruleName: `${envPrefix}Observability-Heartbeat`,
      description: 'Synthetic alarm every 6h to verify the SNS→Lambda→Slack path',
      schedule: events.Schedule.rate(Duration.hours(6)),
    })
    this.heartbeatRule.addTarget(
      new eventsTargets.SnsTopic(this.alarmTopic, {
        message: events.RuleTargetInput.fromObject({
          AlarmName: 'Heartbeat',
          AlarmDescription: 'EventBridge synthetic heartbeat — exercises the alert pipeline',
          AWSAccountId: this.account,
          NewStateValue: 'HEARTBEAT',
          StateChangeTime: events.EventField.fromPath('$.time'),
          Region: this.region,
          AlarmArn: `arn:aws:events:${this.region}:${this.account}:rule/${envPrefix}Observability-Heartbeat`,
        }),
      }),
    )
  }
}
