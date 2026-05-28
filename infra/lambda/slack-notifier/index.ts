import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import type { SNSEvent } from 'aws-lambda'
import { type CloudWatchAlarmMessage, formatAlarmBlocks } from './format'

/**
 * Notifier Lambda for SEQTEK website CloudWatch alarms.
 *
 * Reads SNS-delivered CloudWatch alarm messages, formats them as Slack
 * Block Kit messages (via the pure formatter in ./format.ts), and POSTs
 * them to the webhook URL stored in SSM Parameter Store (SecureString)
 * at the path in WEBHOOK_PARAMETER_PATH.
 *
 * Contract: `specs/002-aws-cdk-infrastructure/contracts/alarm-payload.md`.
 *
 * Webhook URL is cached per warm Lambda instance — cold starts re-fetch,
 * warm invocations skip the SSM call. Webhook rotation lands on the next
 * cold start (rare enough to be acceptable; see contract § 3).
 */

const ssm = new SSMClient({})
let webhookCache: string | null = null

async function getWebhookUrl(): Promise<string> {
  if (webhookCache) return webhookCache
  const path = process.env.WEBHOOK_PARAMETER_PATH
  if (!path) throw new Error('WEBHOOK_PARAMETER_PATH env var is not set')
  const param = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: true }))
  const value = param.Parameter?.Value
  if (!value) throw new Error(`Webhook URL parameter ${path} is empty or missing`)
  webhookCache = value
  return value
}

export async function handler(event: SNSEvent): Promise<void> {
  for (const record of event.Records) {
    const alarm = JSON.parse(record.Sns.Message) as CloudWatchAlarmMessage
    const blocks = formatAlarmBlocks(alarm)
    const webhookUrl = await getWebhookUrl()
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    })
    if (!res.ok) {
      throw new Error(`Slack webhook returned ${res.status}: ${await res.text()}`)
    }
  }
}
