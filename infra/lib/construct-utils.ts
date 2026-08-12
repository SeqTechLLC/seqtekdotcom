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

  /**
   * Extra names on the ACM certificate beyond `domainName` itself — e.g.
   * `['*.seqtek.com']` for a wildcard covering every subdomain, or
   * `['www.seqtek-preview.com']` for a single explicit name. A certificate
   * existing does not redirect any traffic by itself; it only lists which
   * names this AWS distribution is ALLOWED to serve HTTPS for. Ignored
   * when `domainName` is null.
   */
  certificateSans: string[]

  /**
   * Route53 record names to actually CREATE and point at the CloudFront
   * distribution — this is the part that changes what visitors see.
   * Deliberately separate from `certificateSans`: a cert can cover
   * `seqtek.com` + `*.seqtek.com` while `dnsRecordNames` creates ONLY
   * `preview.seqtek.com`, leaving the zone's existing `seqtek.com` /
   * `www.seqtek.com` records (pointing at whatever they point at today)
   * completely untouched. Every entry must be an exact name the
   * certificate covers (itself or via a `certificateSans` wildcard/SAN).
   * Ignored when `domainName` is null.
   */
  dnsRecordNames: string[]

  /**
   * When set, NetworkStack imports this EXISTING VPC instead of creating a
   * new one, and adds one new subnet pair (public + isolated) in
   * `secondaryAz` to satisfy the ALB's and RDS's independent 2-AZ
   * requirements — rather than creating a whole new VPC just for that.
   * `null` (prod/staging today) creates a fresh dedicated VPC as before;
   * this is a per-env opt-in, not a behavior change for existing envs.
   *
   * `preview` uses this to reuse the account's existing `SeqtekDeploy` VPC
   * (which pre-dates this codebase — see `cdk.json`'s comment) instead of
   * requesting a VPC quota increase, since the account was already at its
   * 5-VPC-per-region limit. The IGW is reused too (also already at its
   * account limit) — only the two new subnets, their route tables, and the
   * routes/associations are created.
   */
  existingVpc: {
    vpcId: string
    igwId: string
    publicSubnetId: string
    isolatedSubnetId: string
    primaryAz: string
    secondaryAz: string
    secondaryPublicCidr: string
    secondaryIsolatedCidr: string
  } | null

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

  /**
   * Optional second application lane sharing THIS env's cluster, ALB, and
   * RDS instance instead of standing up a whole separate env's worth of
   * stacks. Added for the temporary `ww3.seqtek.com` PROD-preview lane
   * (2026-08-11): a second ECS task definition/service/target group behind
   * the same ALB (new host-header-routed listener rule), and a second
   * Postgres DATABASE on the SAME RDS instance (`databaseName` here, NOT a
   * new `rds.DatabaseInstance` — Postgres supports multiple isolated
   * databases per instance). The new database is created by the lane's own
   * container startup command (`CREATE DATABASE IF NOT EXISTS`-equivalent
   * check via the `pg` client already in node_modules), not a CDK/CFN
   * resource — CloudFormation has no native "Postgres database inside an
   * existing instance" resource type.
   *
   * `dnsRecordNames` here work the same as the top-level field: added to
   * the CloudFront distribution's alias list AND get real Route53 A
   * records, on top of (not replacing) the top-level `dnsRecordNames`.
   * Every entry must already be covered by the top-level `certificateSans`
   * (e.g. `*.seqtek.com` covers `ww3.seqtek.com` with zero new cert
   * validation). `null` for every env that doesn't need a second lane.
   */
  secondaryLane: {
    /** Short slug used in resource IDs/names — e.g. 'prod'. */
    name: string
    /** New database name on the SAME RDS instance — e.g. 'seqtek_prod'. */
    databaseName: string
    /** Route53 record names for this lane only — e.g. ['ww3.seqtek.com']. */
    dnsRecordNames: string[]
  } | null
}

export type EnvName = 'prod' | 'staging' | 'preview'

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
    if (cfg.dnsRecordNames.length === 0) {
      throw new Error(
        `${prefix}.domainName is set but dnsRecordNames is empty. Nothing would actually be reachable — ` +
          'a cert with no DNS record pointing at the distribution serves no traffic. Set at least one name ' +
          '(it must be domainName itself or covered by a certificateSans wildcard/SAN).',
      )
    }
  }

  if (cfg.existingVpc !== null) {
    const ev = cfg.existingVpc
    const required: Array<[string, string]> = [
      ['vpcId', ev.vpcId],
      ['igwId', ev.igwId],
      ['publicSubnetId', ev.publicSubnetId],
      ['isolatedSubnetId', ev.isolatedSubnetId],
      ['primaryAz', ev.primaryAz],
      ['secondaryAz', ev.secondaryAz],
      ['secondaryPublicCidr', ev.secondaryPublicCidr],
      ['secondaryIsolatedCidr', ev.secondaryIsolatedCidr],
    ]
    for (const [field, value] of required) {
      if (!value) {
        throw new Error(`${prefix}.existingVpc.${field} is required when existingVpc is set.`)
      }
    }
    if (ev.primaryAz === ev.secondaryAz) {
      throw new Error(
        `${prefix}.existingVpc.primaryAz and secondaryAz must differ — that is the whole point ` +
          '(ALB and RDS subnet groups both require 2 distinct AZs).',
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

  if (cfg.secondaryLane !== null) {
    const lane = cfg.secondaryLane
    if (!lane.name) {
      throw new Error(`${prefix}.secondaryLane.name is required when secondaryLane is set.`)
    }
    if (!lane.databaseName) {
      throw new Error(`${prefix}.secondaryLane.databaseName is required when secondaryLane is set.`)
    }
    if (lane.dnsRecordNames.length === 0) {
      throw new Error(
        `${prefix}.secondaryLane.dnsRecordNames must be non-empty — a second lane with nothing ` +
          'routed to it would deploy dead infrastructure.',
      )
    }
    if (cfg.domainName === null || cfg.hostedZoneId === null) {
      throw new Error(
        `${prefix}.secondaryLane requires domainName + hostedZoneId to be set — it reuses the ` +
          "env's existing ACM cert/hosted zone, it doesn't provision its own.",
      )
    }
  }
}

/**
 * Reads `-c env=prod|staging` and the `envs` block from the CDK app
 * context, returns the validated env name + config.
 */
export function resolveEnv(app: App): { env: EnvName; cfg: EnvConfig } {
  const envCtx = app.node.tryGetContext('env')
  if (!envCtx) {
    throw new Error('Required CDK context: -c env=prod|staging|preview (no default).')
  }
  if (envCtx !== 'prod' && envCtx !== 'staging' && envCtx !== 'preview') {
    throw new Error(`Unknown env: '${envCtx}'. Expected 'prod', 'staging', or 'preview'.`)
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
  return `${stackPrefix(env)}${kind}`
}

/**
 * The `Seqtek<Env>` prefix shared by every stack/role/resource name in an
 * env — e.g. `stackPrefix('preview')` → `'SeqtekPreview'`. Was previously
 * duplicated as an inline `envName === 'prod' ? 'SeqtekProd' : 'SeqtekStaging'`
 * ternary in `deploy-role.ts` and `observability-stack.ts`; that hardcoded
 * the non-prod branch to `'SeqtekStaging'` specifically, which silently
 * mis-scoped IAM policies to nonexistent `SeqtekStaging*` ARNs for any
 * THIRD env name (like `preview`) instead of the real `SeqtekPreview*`
 * stacks. Centralizing here makes it correct for any `EnvName`.
 */
export function stackPrefix(env: EnvName): string {
  return `Seqtek${env[0]!.toUpperCase()}${env.slice(1)}`
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
