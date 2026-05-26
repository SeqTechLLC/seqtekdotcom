import type { App } from 'aws-cdk-lib'

/**
 * Per-environment configuration block from `cdk.json` → `context.envs.{env}`.
 *
 * Schema is the contract from
 * `specs/002-aws-cdk-infrastructure/contracts/cdk-context.md`.
 */
export interface EnvConfig {
  region: 'us-east-1'

  domainName: string | null
  hostedZoneId: string | null
  certificateArn: string | null

  instanceClass: 't3' | 't4g' | 'm5'
  instanceSize: 'small' | 'medium' | 'large'
  asgMinCapacity: number
  asgDesiredCapacity: number
  asgMaxCapacity: number

  rdsInstanceClass: string
  rdsAllocatedStorageGb: number
  rdsMultiAz: boolean

  ecrRetainCount: number
  logRetentionDays: number
}

export type EnvName = 'prod' | 'staging'

/**
 * Validates an `EnvConfig` from `cdk.json`. Throws with a clear message
 * naming the offending field if any rule fails. Called at synth time
 * from `bin/app.ts` for the resolved env.
 */
export function validateEnvConfig(env: EnvName, cfg: EnvConfig): void {
  const prefix = `EnvConfig[${env}]`

  if (cfg.region !== 'us-east-1') {
    throw new Error(
      `${prefix}.region must be 'us-east-1' (CloudFront ACM constraint); got '${cfg.region}'`,
    )
  }

  if (cfg.asgMinCapacity < 1) {
    throw new Error(`${prefix}.asgMinCapacity must be >= 1; got ${cfg.asgMinCapacity}`)
  }
  if (cfg.asgDesiredCapacity < cfg.asgMinCapacity) {
    throw new Error(
      `${prefix}.asgDesiredCapacity (${cfg.asgDesiredCapacity}) must be >= asgMinCapacity (${cfg.asgMinCapacity})`,
    )
  }
  if (cfg.asgMaxCapacity < cfg.asgDesiredCapacity + 1) {
    throw new Error(
      `${prefix}.asgMaxCapacity (${cfg.asgMaxCapacity}) must be >= asgDesiredCapacity + 1 (${cfg.asgDesiredCapacity + 1}) — required for instance refresh with MinHealthyPercentage=100.`,
    )
  }

  if (cfg.rdsAllocatedStorageGb < 20) {
    throw new Error(
      `${prefix}.rdsAllocatedStorageGb must be >= 20 (RDS minimum); got ${cfg.rdsAllocatedStorageGb}`,
    )
  }

  if (cfg.domainName !== null) {
    if (cfg.hostedZoneId === null) {
      throw new Error(
        `${prefix}.domainName is set ('${cfg.domainName}') but hostedZoneId is null. Both must be set together so CDK can provision the ACM cert via DNS validation.`,
      )
    }
  }

  if (cfg.logRetentionDays < 1) {
    throw new Error(`${prefix}.logRetentionDays must be >= 1; got ${cfg.logRetentionDays}`)
  }
}

/**
 * Reads `-c env=prod|staging` and the `envs` block from the CDK app
 * context, returns the validated env name + config.
 */
export function resolveEnv(app: App): { env: EnvName; cfg: EnvConfig } {
  const envCtx = app.node.tryGetContext('env')
  if (!envCtx) {
    throw new Error('Required CDK context: -c env=prod|staging (no default).')
  }
  if (envCtx !== 'prod' && envCtx !== 'staging') {
    throw new Error(`Unknown env: '${envCtx}'. Expected 'prod' or 'staging'.`)
  }
  const env = envCtx as EnvName

  const envs = app.node.tryGetContext('envs') as Record<string, EnvConfig> | undefined
  if (!envs) {
    throw new Error("Required CDK context: 'envs' block in cdk.json.")
  }
  const cfg = envs[env]
  if (!cfg) {
    throw new Error(`No 'envs.${env}' block in cdk.json context.`)
  }

  validateEnvConfig(env, cfg)
  return { env, cfg }
}

/**
 * Stack-name prefix derivation. Stable across all stacks in an env.
 * Examples: stackName('prod', 'Network') → 'SeqtekProdNetwork'.
 */
export function stackName(env: EnvName, kind: string): string {
  const envPart = env[0]!.toUpperCase() + env.slice(1)
  return `Seqtek${envPart}${kind}`
}

/**
 * Standard env-prop block for every stack in an env, ensuring stacks
 * pick up the deploying account from `CDK_DEFAULT_ACCOUNT` and the
 * region from the env config (not the deploying shell's `AWS_REGION`).
 */
export function stackEnv(cfg: EnvConfig): { account: string | undefined; region: string } {
  return {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: cfg.region,
  }
}
