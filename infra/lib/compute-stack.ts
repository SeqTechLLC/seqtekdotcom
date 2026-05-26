import { Stack, type StackProps } from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import type { EnvConfig, EnvName } from './construct-utils'
import type { DataStack } from './data-stack'
import type { NetworkStack } from './network-stack'

export interface ComputeStackProps extends StackProps {
  envName: EnvName
  cfg: EnvConfig
  network: NetworkStack
  data: DataStack
}

/**
 * Compute plane — ECR repo, ALB + target group + listeners, ASG + launch
 * template, EC2 instance profile. Implemented in spec 002 Phase 3 User
 * Story 1 (T021). Stub for now.
 */
export class ComputeStack extends Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props)
    // TODO(T021): ECR repo, ALB, ASG, launch template, IAM instance profile.
    void props
  }
}
