# `infra/` — AWS CDK Infrastructure

This directory contains the AWS CDK (TypeScript) source for the SEQTEK website's production and staging environments.

**Operational procedures** — standing up a fresh AWS account, migrating an
environment (with its data) to another account, and the `seqtek.com` cutover:
[`../docs/INFRASTRUCTURE_RUNBOOK.md`](../docs/INFRASTRUCTURE_RUNBOOK.md). Start
there; it is the living doc.

**Design docs**:

- Architecture (promotion model, environment isolation): [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- Spec: [`../specs/002-aws-cdk-infrastructure/spec.md`](../specs/002-aws-cdk-infrastructure/spec.md)
- Plan: [`../specs/002-aws-cdk-infrastructure/plan.md`](../specs/002-aws-cdk-infrastructure/plan.md)
- Quickstart: [`../specs/002-aws-cdk-infrastructure/quickstart.md`](../specs/002-aws-cdk-infrastructure/quickstart.md) — the original first-deploy walkthrough, **superseded** by the runbook above (it predates the promotion model and describes merges to `main` deploying prod)

**Layout**:

- `bin/app.ts` — CDK app entry. Reads `-c env=prod|staging` context and instantiates the per-env stack set.
- `lib/` — five stacks (`network`, `data`, `compute`, `edge`, `observability`) + `deploy-role.ts` (GitHub OIDC) + `construct-utils.ts` (env config validator).
- `test/` — `aws-cdk-lib/assertions` invariant tests under Vitest.
- `lambda/slack-notifier/` — inline Lambda for SNS → Slack incoming webhook.

**Common commands** (from repo root):

```sh
npm --prefix infra ci
npm --prefix infra run synth -- -c env=staging
npm --prefix infra run diff -- -c env=staging 'SeqtekStaging*'
npm --prefix infra run deploy -- -c env=staging 'SeqtekStaging*'
npm --prefix infra run test
```

**Two ordering traps** when deploying into an account for the first time — both
fail _after_ an apparently successful deploy, so they are worth knowing before
you start. See `docs/INFRASTRUCTURE_RUNBOOK.md` § Facts this runbook assumes:

1. `SeqtekProdNetwork` must be the **first** stack in a new account — it creates
   the account-wide GitHub OIDC provider that staging imports.
2. The `production` GitHub Environment must exist **before** the first prod
   deploy — the prod OIDC trust pins that environment, not a git ref.
