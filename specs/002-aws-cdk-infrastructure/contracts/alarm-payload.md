# Contract: Alarm Payload → Slack Message

End-to-end shape of an alarm notification, from CloudWatch through SNS through the Lambda notifier to a Slack channel message. Pure-function payload formatter, unit-tested in `infra/test/slack-lambda.test.ts`.

---

## 1. CloudWatch → SNS

CloudWatch alarms publish to the `AlarmTopic` SNS topic with the standard alarm message shape (CloudWatch's default, not customized — keeps the path opaque to the alarm authoring):

```jsonc
{
  "AlarmName": "SeqtekProdObservability-AlbFiveXx",
  "AlarmDescription": "ALB 5xx error rate above 5 in 5 minutes",
  "AWSAccountId": "<account-id>",
  "AlarmConfigurationUpdatedTimestamp": "2026-05-24T20:00:00.000+0000",
  "NewStateValue": "ALARM", // or "OK", "INSUFFICIENT_DATA"
  "NewStateReason": "Threshold Crossed: 1 datapoint [12.0 (24/05/26 19:55:00)] was greater than the threshold (5.0).",
  "StateChangeTime": "2026-05-24T20:00:12.345+0000",
  "Region": "US East (N. Virginia)",
  "AlarmArn": "arn:aws:cloudwatch:us-east-1:<account>:alarm:SeqtekProdObservability-AlbFiveXx",
  "OldStateValue": "OK",
  "OKActions": [],
  "AlarmActions": ["arn:aws:sns:us-east-1:<account>:SeqtekProdObservability-AlarmTopic"],
  "InsufficientDataActions": [],
  "Trigger": {
    "MetricName": "HTTPCode_Target_5XX_Count",
    "Namespace": "AWS/ApplicationELB",
    "Statistic": "SUM",
    "Dimensions": [{ "name": "LoadBalancer", "value": "app/SeqtekProdComp-Alb-XXXX/YYYY" }],
    "Period": 300,
    "EvaluationPeriods": 1,
    "ComparisonOperator": "GreaterThanThreshold",
    "Threshold": 5.0,
    "TreatMissingData": "notBreaching",
  },
}
```

SNS wraps this in its own envelope when delivered to Lambda — the Lambda receives `event.Records[i].Sns.Message` as a JSON string.

---

## 2. Lambda → Slack webhook

Slack incoming-webhook URL POST body. Block Kit format, not the legacy `text` shape:

```jsonc
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 SeqtekProd · ALB 5xx error rate",
      },
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*State*\nALARM (was OK)" },
        { "type": "mrkdwn", "text": "*Dimension*\nALB" },
        { "type": "mrkdwn", "text": "*Threshold*\n> 5 in 5 min" },
        { "type": "mrkdwn", "text": "*Observed*\n12.0" },
      ],
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Reason*\nThreshold Crossed: 1 datapoint [12.0 (24/05/26 19:55:00)] was greater than the threshold (5.0).",
      },
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Open in CloudWatch" },
          "url": "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarm:alarm=SeqtekProdObservability-AlbFiveXx",
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "ALB logs" },
          "url": "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups$3FlogGroupName$3D%2Fseqtek%2Fwebsite%2Fprod%2Falb-access",
        },
      ],
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Account `<account>` · Region us-east-1 · Triggered 2026-05-24 20:00:12 UTC",
        },
      ],
    },
  ],
}
```

OK-state transitions get a green ✅ header and no action buttons (recovery doesn't need to page anyone, just confirm). HEARTBEAT-prefixed messages get a gray ⚙️ header and shorter body.

---

## 3. Lambda code shape

```ts
// infra/lambda/slack-notifier/index.ts (~40 LOC)

import type { SNSEvent } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({});
let webhookCache: string | null = null;

export async function handler(event: SNSEvent): Promise<void> {
  for (const record of event.Records) {
    const alarm = JSON.parse(record.Sns.Message);
    const blocks = formatAlarmBlocks(alarm);
    const webhookUrl = await getWebhookUrl();
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
    if (!res.ok) throw new Error(`Slack returned ${res.status}: ${await res.text()}`);
  }
}

async function getWebhookUrl(): Promise<string> {
  if (webhookCache) return webhookCache;
  const param = await ssm.send(
    new GetParameterCommand({
      Name: process.env.WEBHOOK_PARAMETER_PATH,
      WithDecryption: true,
    }),
  );
  webhookCache = param.Parameter?.Value ?? '';
  if (!webhookCache) throw new Error('Webhook URL parameter empty');
  return webhookCache;
}

// formatAlarmBlocks is the pure function under unit test
export function formatAlarmBlocks(alarm: CloudWatchAlarmMessage): SlackBlock[] { … }
```

`formatAlarmBlocks` is exported separately and tested directly with fixture alarms covering ALARM, OK, INSUFFICIENT_DATA, and HEARTBEAT states. No AWS calls in the unit test.

Webhook URL caching is per-warm-Lambda-instance — cold start re-fetches, warm invocations skip the SSM call. Rotation works because rotation requires changing the Parameter Store value, which doesn't immediately invalidate warm Lambda caches — but the next cold start picks up the new value, and webhook rotation is not a frequent operation. If cache invalidation becomes a problem, switch to per-invocation fetch (~10ms SSM call).

---

## 4. Alarm-to-dashboard URL convention

Each alarm's Slack message includes a CloudWatch console deep link. The URLs are deterministic:

| Dimension  | CloudWatch URL pattern       |
| ---------- | ---------------------------- |
| ALB        | `…#alarm:alarm=<alarm-name>` |
| ASG        | `…#alarm:alarm=<alarm-name>` |
| RDS        | `…#alarm:alarm=<alarm-name>` |
| CloudFront | `…#alarm:alarm=<alarm-name>` |

A second "logs" button per alarm dimension links to the most useful log group:

| Dimension  | Log group                                           |
| ---------- | --------------------------------------------------- |
| ALB        | `/seqtek/website/{env}/alb-access`                  |
| ASG / EC2  | `/seqtek/website/{env}/app` (Docker stdout)         |
| RDS        | `/aws/rds/instance/seqtek-website-{env}/postgresql` |
| CloudFront | `/seqtek/website/{env}/cloudfront-access`           |

These log groups are created by CDK in their respective stacks (compute, data, edge) so the URLs work from day one.

---

## 5. Heartbeat (FR-022 verifiable notification path)

`EventBridge` rule fires every 6h with a fixed test payload to `AlarmTopic`. The Lambda formats it with a distinctive header:

```json
{
  "blocks": [
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "⚙️ Heartbeat — alert pipeline is healthy (2026-05-24 18:00 UTC)"
        }
      ]
    }
  ]
}
```

Channel members see a heartbeat 4 times a day. If they stop appearing, the pipeline is broken even if no alarms are firing — which is the failure mode FR-022 exists to catch.

---

## 6. Test coverage

`infra/test/slack-lambda.test.ts`:

- ALARM transition fixture → expected block structure (header, fields, reason, two buttons, context)
- OK transition fixture → green header, no action buttons
- HEARTBEAT fixture → context-only block
- INSUFFICIENT_DATA fixture → orange ⚠️ header
- Malformed input → throws with a clear error (no silent ignore)

Vitest, no AWS SDK calls, no network calls — `formatAlarmBlocks` is a pure function.
