# `infra/` — AWS CDK Infrastructure

This directory contains the AWS CDK (TypeScript) source for the SEQTEK website's production and staging environments.

**Design docs**:

- Spec: [`../specs/002-aws-cdk-infrastructure/spec.md`](../specs/002-aws-cdk-infrastructure/spec.md)
- Plan: [`../specs/002-aws-cdk-infrastructure/plan.md`](../specs/002-aws-cdk-infrastructure/plan.md)
- Quickstart (60-min first deploy): [`../specs/002-aws-cdk-infrastructure/quickstart.md`](../specs/002-aws-cdk-infrastructure/quickstart.md)

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

See `quickstart.md` for the first-time bootstrap procedure (`cdk bootstrap`, OIDC trust, Parameter Store seeding, domain registration).
