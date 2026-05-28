/**
 * Pure CloudWatch-alarm-to-Slack-Block-Kit formatter. Imported by:
 * - `index.ts` (Lambda handler) for production runtime use.
 * - `infra/test/slack-lambda.test.ts` for fixture-based unit tests.
 *
 * Kept dependency-free (no `aws-sdk`, no `aws-lambda` types) so the
 * unit test path doesn't need to install Lambda-only modules.
 *
 * Contract: `specs/002-aws-cdk-infrastructure/contracts/alarm-payload.md`.
 */

export type AlarmState = 'ALARM' | 'OK' | 'INSUFFICIENT_DATA' | 'HEARTBEAT'

export interface CloudWatchAlarmMessage {
  AlarmName: string
  AlarmDescription?: string
  AWSAccountId: string
  NewStateValue: AlarmState
  NewStateReason?: string
  StateChangeTime: string
  Region: string
  AlarmArn: string
  OldStateValue?: AlarmState
  Trigger?: {
    MetricName?: string
    Namespace?: string
    Statistic?: string
    Period?: number
    EvaluationPeriods?: number
    ComparisonOperator?: string
    Threshold?: number
    Dimensions?: { name: string; value: string }[]
  }
}

export type SlackBlock = Record<string, unknown>

const STATE_PRESENTATION: Record<
  AlarmState,
  { icon: string; label: string; showActions: boolean }
> = {
  ALARM: { icon: '🚨', label: 'ALARM', showActions: true },
  OK: { icon: '✅', label: 'OK', showActions: false },
  INSUFFICIENT_DATA: { icon: '⚠️', label: 'INSUFFICIENT_DATA', showActions: true },
  HEARTBEAT: { icon: '⚙️', label: 'HEARTBEAT', showActions: false },
}

// Priority order: alarm-name prefix wins over metric-name fallback. RDS
// uses CPUUtilization just like EC2 does, so matching by metric name
// alone misclassifies RdsCpuHigh as EC2.
const DIMENSION_HINTS: { match: RegExp; label: string; logGroup: (env: string) => string }[] = [
  {
    match: /Rds/,
    label: 'RDS',
    logGroup: (env) => `/aws/rds/instance/seqtek-website-${env}/postgresql`,
  },
  {
    match: /CloudFront|5xxErrorRate/,
    label: 'CloudFront',
    logGroup: (env) => `/seqtek/website/${env}/cloudfront-access`,
  },
  {
    match: /Alb|HTTPCode_Target|HTTPCode_ELB/,
    label: 'ALB',
    logGroup: (env) => `/seqtek/website/${env}/alb-access`,
  },
  {
    match: /Ec2|UnHealthyHostCount|CPUUtilization|mem_used|disk_used/,
    label: 'EC2 / ASG',
    logGroup: (env) => `/seqtek/website/${env}/app`,
  },
]

function isHeartbeat(alarm: CloudWatchAlarmMessage): boolean {
  return alarm.NewStateValue === 'HEARTBEAT' || alarm.AlarmName === 'Heartbeat'
}

function resolveDimension(alarm: CloudWatchAlarmMessage): {
  label: string
  logGroup: string | null
  env: string
} {
  // Alarm names follow `Seqtek{Env}Observability-{Kind}`; extract env.
  const envMatch = alarm.AlarmName.match(/^Seqtek(Prod|Staging)/)
  const env = envMatch ? envMatch[1].toLowerCase() : 'prod'
  const haystack = `${alarm.AlarmName} ${alarm.Trigger?.MetricName ?? ''}`
  for (const hint of DIMENSION_HINTS) {
    if (hint.match.test(haystack)) {
      return { label: hint.label, logGroup: hint.logGroup(env), env }
    }
  }
  return { label: 'Generic', logGroup: null, env }
}

function cloudwatchAlarmUrl(alarmName: string, region: string): string {
  return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#alarm:alarm=${encodeURIComponent(alarmName)}`
}

function logGroupUrl(group: string, region: string): string {
  // CloudWatch console encodes `/` as `$252F` in the URL fragment.
  const encoded = group.split('/').join('$252F')
  return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups$3FlogGroupName$3D${encoded}`
}

function comparisonLabel(op: string | undefined, threshold: number | undefined): string {
  if (op == null || threshold == null) return 'n/a'
  const symbol =
    {
      GreaterThanThreshold: '>',
      GreaterThanOrEqualToThreshold: '≥',
      LessThanThreshold: '<',
      LessThanOrEqualToThreshold: '≤',
      GreaterThanUpperThreshold: '>',
      LessThanLowerThreshold: '<',
    }[op] ?? op
  return `${symbol} ${threshold}`
}

function extractObserved(reason: string | undefined): string {
  if (!reason) return 'n/a'
  // CloudWatch's reason format: "Threshold Crossed: 1 datapoint [12.0 (timestamp)] ..."
  const match = reason.match(/\[([\d.]+)\s/)
  return match ? match[1] : 'n/a'
}

export function formatAlarmBlocks(alarm: CloudWatchAlarmMessage): SlackBlock[] {
  if (typeof alarm.AlarmName !== 'string' || typeof alarm.NewStateValue !== 'string') {
    throw new Error('Malformed CloudWatch alarm message: missing AlarmName or NewStateValue')
  }

  if (isHeartbeat(alarm)) {
    return [
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `⚙️ Heartbeat — alert pipeline is healthy (${alarm.StateChangeTime})`,
          },
        ],
      },
    ]
  }

  const state = alarm.NewStateValue
  const presentation = STATE_PRESENTATION[state]
  if (!presentation) {
    throw new Error(`Unrecognized alarm state: ${state}`)
  }
  const { label: dimensionLabel, logGroup } = resolveDimension(alarm)
  const headline = alarm.AlarmDescription ?? alarm.AlarmName

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${presentation.icon} ${alarm.AlarmName.split('-')[0]} · ${headline}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*State*\n${presentation.label}${alarm.OldStateValue ? ` (was ${alarm.OldStateValue})` : ''}`,
        },
        { type: 'mrkdwn', text: `*Dimension*\n${dimensionLabel}` },
        {
          type: 'mrkdwn',
          text: `*Threshold*\n${comparisonLabel(alarm.Trigger?.ComparisonOperator, alarm.Trigger?.Threshold)}`,
        },
        {
          type: 'mrkdwn',
          text: `*Observed*\n${extractObserved(alarm.NewStateReason)}`,
        },
      ],
    },
  ]

  if (alarm.NewStateReason) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Reason*\n${alarm.NewStateReason}` },
    })
  }

  if (presentation.showActions) {
    const actions: SlackBlock[] = [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Open in CloudWatch' },
        url: cloudwatchAlarmUrl(alarm.AlarmName, alarm.Region),
      },
    ]
    if (logGroup) {
      actions.push({
        type: 'button',
        text: { type: 'plain_text', text: `${dimensionLabel} logs` },
        url: logGroupUrl(logGroup, alarm.Region),
      })
    }
    blocks.push({ type: 'actions', elements: actions })
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Account \`${alarm.AWSAccountId}\` · Region ${alarm.Region} · Triggered ${alarm.StateChangeTime}`,
      },
    ],
  })

  return blocks
}
