import { Stack, type StackProps } from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import type { EnvConfig, EnvName } from './construct-utils'
import type { NetworkStack } from './network-stack'

export interface DataStackProps extends StackProps {
  envName: EnvName
  cfg: EnvConfig
  network: NetworkStack
}

/**
 * Data plane — RDS Postgres, S3 media bucket (with OAC), Parameter
 * Store namespace seeding. Implemented in spec 002 Phase 3 User Story 1
 * (T020). Stub for now so the app entry can instantiate it during
 * Phase 1/2 synth verification.
 */
export class DataStack extends Stack {
  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props)
    // TODO(T020): RDS instance, S3 media bucket, Parameter Store entries.
    void props
  }
}
