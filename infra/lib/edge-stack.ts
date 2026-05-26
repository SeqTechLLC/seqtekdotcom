import { Stack, type StackProps } from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import type { EnvConfig, EnvName } from './construct-utils'
import type { ComputeStack } from './compute-stack'
import type { DataStack } from './data-stack'

export interface EdgeStackProps extends StackProps {
  envName: EnvName
  cfg: EnvConfig
  compute: ComputeStack
  data: DataStack
}

/**
 * Edge plane — CloudFront distribution + ACM certificate + Route53 alias.
 * Implemented in spec 002 Phase 3 User Story 1 (T022). Stub for now.
 */
export class EdgeStack extends Stack {
  constructor(scope: Construct, id: string, props: EdgeStackProps) {
    super(scope, id, props)
    // TODO(T022): ACM cert, OAC, CloudFront distribution, Route53 records.
    void props
  }
}
