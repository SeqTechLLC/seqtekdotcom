import { Stack, type StackProps } from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import type { EnvConfig, EnvName } from './construct-utils'
import type { ComputeStack } from './compute-stack'
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
 * Observability plane — 9 CloudWatch alarms, SNS topic, Slack notifier
 * Lambda, EventBridge heartbeat rule. Implemented in spec 002 Phase 5
 * User Story 3 (T042). Stub for now.
 */
export class ObservabilityStack extends Stack {
  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props)
    // TODO(T042): SNS topic, Slack Lambda, 9 alarms, heartbeat rule.
    void props
  }
}
