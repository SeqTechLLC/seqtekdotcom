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
  instanceSize: 'micro' | 'small' | 'medium' | 'large'
  asgMinCapacity: number
  asgDesiredCapacity: number
  asgMaxCapacity: number

  rdsInstanceClass: string
  rdsAllocatedStorageGb: number
  rdsMultiAz: boolean

  ecrRetainCount: number
  logRetentionDays: number

  /**
   * Whether THIS environment's stacks create the account-wide GitHub OIDC
   * provider. Exactly one environment per AWS ACCOUNT may own it — IAM allows
   * a single provider per issuer URL — and every other environment in that
   * account imports it.
   *
   * Same account for both envs (the layout today): prod `true`, staging
   * `false`.
   * Separate accounts: `true` on BOTH, because each account needs its own.
   *
   * Getting this wrong fails silently-ish in opposite directions: two owners in
   * one account collide at CreateStack ("provider already exists"), while zero
   * owners leaves a deploy role trusting a provider that does not exist —
   * CloudFormation accepts that and every deploy then fails at assume-role.
   */
  ownsAccountOidcProvider: boolean

  /**
   * Whether THIS environment's stacks create the `seqtek-website` ECR
   * repository. Exactly one environment per AWS ACCOUNT may create it (the name
   * is unique per account); every other environment in that account imports it.
   *
   * Same account for both envs (the layout today): staging `true`, prod
   * `false` — preserving the original behaviour exactly.
   * Separate accounts: `true` on BOTH, because each account needs its own.
   *
   * Note the deliberate asymmetry with `ownsAccountOidcProvider` (prod owns
   * that one). It is not tidiness — it is what the account already contains, and
   * flipping either would mean destroying and recreating a live resource.
   */
  ownsAccountEcrRepository: boolean
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
      `${prefix}.asgMaxCapacity (${cfg.asgMaxCapacity}) must be >= asgDesiredCapacity + 1 (${cfg.asgDesiredCapacity + 1}) — required so the rolling update can launch a replacement while holding minInstancesInService.`,
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

  if (typeof cfg.ownsAccountOidcProvider !== 'boolean') {
    throw new Error(
      `${prefix}.ownsAccountOidcProvider must be a boolean; got ${typeof cfg.ownsAccountOidcProvider}. ` +
        'Exactly one env per AWS account owns the GitHub OIDC provider — see the field docs.',
    )
  }

  if (typeof cfg.ownsAccountEcrRepository !== 'boolean') {
    throw new Error(
      `${prefix}.ownsAccountEcrRepository must be a boolean; got ${typeof cfg.ownsAccountEcrRepository}. ` +
        'Exactly one env per AWS account creates the ECR repository — see the field docs.',
    )
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
