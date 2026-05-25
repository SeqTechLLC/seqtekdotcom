# Contract: CDK App Context Schema

**Source**: `infra/cdk.json` under the `context.envs.{env}` key. Validated at synth time by `EnvConfig` interface in `infra/lib/construct-utils.ts`.

## Shape

```ts
interface EnvConfig {
  // Identity
  region: 'us-east-1' // research.md §1
  // Account is read from CDK_DEFAULT_ACCOUNT at synth — not committed in cdk.json

  // DNS / TLS (nullable for pre-launch staging)
  domainName: string | null // e.g., 'seqtek.com'; null = use CloudFront default
  hostedZoneId: string | null // Route53 hosted zone — required if domainName is set
  certificateArn: string | null // pre-issued ACM cert in us-east-1; null = CDK provisions one

  // Compute sizing
  instanceClass: 't3' | 't4g' | 'm5' // open enum; expand only with research
  instanceSize: 'small' | 'medium' | 'large'
  asgMinCapacity: number // ≥ 2 for prod (research.md §3)
  asgDesiredCapacity: number // ≥ asgMinCapacity
  asgMaxCapacity: number // ≥ asgDesiredCapacity + 1 for instance refresh

  // Data sizing
  rdsInstanceClass: string // e.g., 't3.small'
  rdsAllocatedStorageGb: number // ≥ 20
  rdsMultiAz: boolean // false at launch, flip to true at Phase 5.5

  // Retention
  ecrRetainCount: number // research.md §7 (10)
  logRetentionDays: number // 90 prod / 14 staging
}
```

## Validation rules (enforced in `construct-utils.ts`)

- `asgMaxCapacity >= asgDesiredCapacity + 1` — required for instance refresh with MinHealthyPercentage=100.
- `asgMinCapacity >= 1` and `asgMinCapacity <= asgDesiredCapacity`.
- If `domainName !== null`, both `hostedZoneId !== null` and (`certificateArn !== null` OR CDK is configured to provision via DNS validation through the same hosted zone).
- `region === 'us-east-1'` — hard-coded for the CloudFront ACM constraint; loosen only after a deliberate cross-region story.
- `rdsAllocatedStorageGb >= 20` (RDS minimum).

If any rule fails, `cdk synth` errors with a clear message naming the offending field.

## Reading at runtime

```ts
// In infra/bin/app.ts
const env = app.node.tryGetContext('env') as 'prod' | 'staging'
if (!env) throw new Error('Required: -c env=prod|staging')

const envs = app.node.tryGetContext('envs') as Record<string, EnvConfig>
const cfg = envs[env]
if (!cfg) throw new Error(`Unknown env: ${env}`)

validateEnvConfig(cfg) // throws on rule violations
```

Stack names are derived as `Seqtek${env[0].toUpperCase() + env.slice(1)}${stackKind}` — e.g., `SeqtekProdNetwork`, `SeqtekStagingObservability`.

## Adding a new env

1. Add a new top-level key under `context.envs` in `cdk.json` matching the `EnvConfig` shape.
2. Deploy roles for the new env (`Seqtek${Name}Deploy`) need to be added to `infra/lib/deploy-role.ts` and bootstrapped manually (the OIDC trust policy is one-time-per-env).
3. Parameter Store namespace `/seqtek/website/{newEnv}/...` needs seeding before first deploy (per `contracts/parameter-store.md`).

No other code changes required.
