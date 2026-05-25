# Implementation Plan: AWS CDK Infrastructure & Blue-Green CI/CD

**Branch**: `002-aws-cdk-infrastructure` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-aws-cdk-infrastructure/spec.md`

## Summary

Provision the production and staging AWS environments for the SEQTEK website with AWS CDK (TypeScript), productionize the existing D-13-era Dockerfile, and ship the GitHub Actions deploy workflow that builds the image, pushes to ECR, and triggers a zero-downtime ASG instance refresh. The resource topology and stack split are pre-decided in ARCHITECTURE.md §5 + §13 — this plan composes against those by reference and reconciles three points where the spec's 99.9% SLA target diverges from the older architecture doc's cost-optimized defaults: production ASG sizing (desired=1 → desired=2 across 2 AZs), alarm SNS targets (email → Slack webhook), and CloudWatch action wording in §9's failure-scenarios table. The CI deploy principal authenticates via GitHub OIDC short-lived credentials — no static IAM user keys anywhere. Slack notification path is SNS → Lambda → incoming webhook (webhook URL in Parameter Store, channel + URL provisioned out-of-band by Kenn). Multi-AZ RDS flip is deferred to Phase 5.5 launch-readiness per spec Clarifications Q2.

## Technical Context

**Language/Version**: TypeScript 5.7 (matches app `tsconfig`, `strict: true`, no `any`). Node ≥ 22 (matches app `engines.node`). CDK uses the same toolchain.

**Primary Dependencies** (new, all in `infra/package.json`, exact-pinned per Constitution V):

- `aws-cdk-lib` — Amazon first-party, mature constructs for every service we touch (ALB, ASG, RDS, S3, CloudFront, ACM, Route53, ECR, Lambda, SNS, CloudWatch). Constitution IV "load-bearing security path" review trivially clears (first-party Amazon, AWS SDK underneath, npm audit clean expected).
- `constructs` — peer dep of `aws-cdk-lib`.
- `aws-cdk` CLI — devDep only; engineers and CI invoke `npx cdk synth|diff|deploy`.
- `@types/node`, `typescript`, `vitest` (devDeps) — the existing app pins serve as the version source of truth; `infra/package.json` references the same majors.

No new **runtime** dependencies on the application. No new dep on the auth / session / secret-handling / public-render path — Constitution IV's dependency-trust review threshold is not crossed.

**Storage**: RDS Postgres 16 (`db.t3.small`, single-AZ for launch, multi-AZ flip in Phase 5.5). Two logical databases on the same instance: `seqtek_prod`, `seqtek_staging` (per ARCHITECTURE.md §5 Branch Strategy). Per-environment S3 media buckets (`seqtek-media-prod`, `seqtek-media-staging`) per §5 OAC. ECR repository shared across environments, tagged by git SHA.

**Testing**:

- `aws-cdk-lib/assertions` (Vitest harness) under `infra/test/` — verifies stack invariants: private subnets for RDS, TLS 1.2+ on ALB listener, OAC attached to S3 origin, public access blocked on media buckets, no IAM wildcards on sensitive actions, security groups deny `0.0.0.0/0` ingress except ALB:443 from CloudFront managed prefix list, ASG min capacity ≥ 2 on prod, MinHealthyPercentage=100 on prod instance refresh.
- One Vitest test for the SNS-to-Slack Lambda payload formatter (pure-function unit; no AWS calls).
- A new Playwright smoke test that hits the deployed staging URL post-deploy and asserts `/api/health` returns 200 and `/admin` reaches the SSO entry — gates the deploy job, not the PR.
- Existing CI workflow (`ci.yml`) extends to call `npm run synth` against `infra/` as part of `quality`; PR-time `infra-diff` is a separate workflow with `id-token: write` for OIDC.

**Target Platform**: AWS. Default region `us-east-1` (ACM certs for CloudFront must live in `us-east-1`; rest of the stack also lives there for latency simplicity). Single account — production and staging coexist with stack-name prefixes (`SeqtekProd*`, `SeqtekStaging*`) per ARCHITECTURE.md §13.

**Project Type**: Infrastructure-as-code (CDK app under `infra/`) + container-image build (Dockerfile productionization at repo root) + two GitHub Actions workflows (`deploy.yml`, `infra-diff.yml`).

**Performance Goals** (from spec Success Criteria):

- SC-001: First-deploy wall-clock ≤ 60 min from a fresh clone + AWS credentials.
- SC-002: Merge-to-`main` → in-service production image ≤ 20 min.
- SC-005: Alarm transition → Slack notification ≤ 5 min.
- SC-009: Representative PR pipeline (tests + diff + image push + dry-run deploy staging) ≤ 30 min.
- SC-010: Post-launch production uptime ≥ 99.9% over rolling 30-day windows (gated on the Phase 5.5 multi-AZ RDS flip).

**Constraints**:

- Zero-downtime deploys (FR-014): ASG instance refresh, `MinHealthyPercentage: 100`, ALB health-check gate, target-group deregistration delay sized for in-flight requests, minimum capacity ≥ 2 across ≥ 2 AZs **on production**. Staging is desired=1 (cost over availability — no SLA on staging).
- No secrets in repo (Constitution IV). Parameter Store for every runtime secret. CDK references via `StringParameter.fromStringParameterName()` at runtime, not `valueFromLookup` for sensitive paths (synth-time materialization would bake them into the CloudFormation template).
- OIDC-federated CI principal — no `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` anywhere. GitHub OIDC trust + scoped deploy role added under `infra/lib/deploy-role.ts`. Constitution IV explicit: "Static AWS credential variables are not used anywhere in this codebase."
- Staging monthly cost ≤ 25% of prod (SC-006). Concrete sizing in `data-model.md`.
- All cross-resource permissions are least-privilege IAM (FR-009). No wildcards on `s3:*` or `ssm:*`.

**Framework internals read** (per Constitution Principle I, "read the source" addendum):

The CDK constructs we compose against are first-party Amazon and well-documented. **No `node_modules/...` source-read list required** — this plan does not implement against undocumented framework internals. The "read the source" addendum was added because spec 001 estimated `~50 LOC against payload-auth-plugin` and discovered ~250 LOC of undocumented Payload internals; the CDK case is the opposite shape (high-quality first-party docs + L2/L3 constructs cover every service we use). If during implementation a CDK construct's behavior diverges from its TypeScript-API docs in a way that materially changes LOC, this Technical Context section gets amended with the file(s) read and the discovery, per the constitution.

**Scale/Scope**: 5 CDK stacks (network, data, compute, edge, observability) × 2 environments = 10 deployed CloudFormation stacks. ~30 CDK assertion tests. 1 productionized Dockerfile. 2 new GitHub Actions workflows. ~3 doc reconciliations in ARCHITECTURE.md. ROADMAP P1 item completion + PROJECT_HISTORY entries.

## Constitution Check

_GATE: Pass required before Phase 0; re-checked after Phase 1._

| Principle                                        | Status | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Spec Before Code**                          | ✅     | Spec at `specs/002-aws-cdk-infrastructure/spec.md`; this plan cites ARCHITECTURE.md §5, §8, §9, §13 + spec Clarifications Session 2026-05-24 + ROADMAP §4 by section/ID rather than re-deriving. "Read the source" addendum N/A (first-party CDK, see Technical Context). Three doc reconciliations (ARCHITECTURE.md §5, §8, §9) listed up-front and bundled into this feature's PR per Principle III.                                                                                                                                                                                                                                                                                                                                              |
| **II. Tests Gate Merge**                         | ✅     | Every user story has a verifying test: US1 (first deploy) → post-deploy Playwright smoke + CDK assertion that the synth produces the expected outputs; US2 (CD) → infra-diff workflow assertion + intentional-failing-image rollback test in staging; US3 (alarms) → SNS-to-Slack Lambda unit test + staging alarm simulation in quickstart; US4 (secret rotation) → quickstart procedure with a verifiable invariant; US5 (staging spin-up) → end-to-end `cdk deploy SeqtekStaging*` smoke. Performance budgets staged (per existing precedent in P1-9); a11y/best-practices/SEO budgets continue to gate at ≥ 0.95 against staging post-deploy. No coverage gate added.                                                                           |
| **III. Docs Are Code**                           | ✅     | This feature's PR reconciles: ARCHITECTURE.md §5 (prod ASG min=2 desired=2 across 2 AZs; replaces "min=1 max=2 desired=1"), §8 (alarm action column "SNS → email" → "SNS → Lambda → Slack #seqtek-website-alerts"), §9 Failure Scenarios table (single-AZ-RDS row keeps the ~15-30 min note + cross-references the Phase 5.5 multi-AZ flip; AZ-failure row updates to "ASG launches replacement in surviving AZ within ~3 min, prod's desired=2 keeps one instance serving throughout"). ROADMAP P1 CDK/Dockerfile/CI bullets move to PROJECT_HISTORY as the implementation lands (per Principle III "moved, not checkbox-flipped"). CLAUDE.md SPECKIT pointer flips to this plan in the Phase 1 `init` task.                                       |
| **IV. Security Baseline**                        | ✅     | All runtime secrets in Parameter Store, sourced at runtime not synth time (FR-017, FR-018). OIDC-federated CI principal, no static AWS keys (FR-019). New deps are first-party Amazon (`aws-cdk-lib`) — dep-trust review is "verify pinning + npm audit clean," not the full ADR-level review reserved for low-trust third-party deps on the auth path. Slack webhook Lambda writes payload formatting inline (~40 LOC) rather than pulling `@slack/webhook` (single-purpose, keeps the new-dep surface at zero on the alerts path). Pre-commit gitleaks + CI re-scan + `npm audit --omit=dev --audit-level=high` (ratified in constitution v1.1.0) all continue to gate. CSP unchanged — this feature ships no third-party scripts to the browser. |
| **V. Bleeding-Edge Stack, Pinned and Defensive** | ✅     | `aws-cdk-lib` exact-pinned in `infra/package.json` (no caret) for the launch; bump cadence becomes a quarterly maintenance task. AWS SDK pulled transitively from `aws-cdk-lib` — same pin discipline. No deprecation warnings tolerated in `cdk synth` output; if a construct emits one during implementation, fix immediately (per V "Migrate or document the deferral; do not leave warnings in the build output"). The Phase 5.5 multi-AZ RDS flip is a deliberate scope split, not deferred-because-too-hard.                                                                                                                                                                                                                                  |

**Result**: 5/5 gates pass. **Complexity Tracking** section intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-aws-cdk-infrastructure/
├── spec.md              # /speckit-specify output (existing)
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 — region, alarm thresholds, MinHealthyPercentage with desired=1, Slack Lambda pattern, OIDC role split, ECR retention, Parameter Store namespace
├── data-model.md        # Phase 1 — 5 CDK stacks, construct tree, Parameter Store namespace, per-env sizing
├── quickstart.md        # Phase 1 — first-time bootstrap walkthrough (AWS account → cdk bootstrap → OIDC trust → first prod deploy)
├── contracts/           # Phase 1 — interfaces this feature exposes
│   ├── cdk-context.md       # cdk.json context schema (env → instance sizes, domains, retention)
│   ├── parameter-store.md   # /seqtek/website/{env}/... namespace
│   ├── github-workflows.md  # deploy.yml + infra-diff.yml trigger/permission/output contracts
│   └── alarm-payload.md     # SNS message shape consumed by the Slack Lambda
├── checklists/
│   └── requirements.md  # Spec quality checklist (existing, all green)
└── tasks.md             # /speckit-tasks output — NOT created here
```

### Source Code (repository root)

```text
infra/                              # NEW — all CDK code lives here
├── bin/
│   └── app.ts                      # CDK app entry. Reads `-c env=prod|staging`, instantiates per-env stack set.
├── lib/
│   ├── network-stack.ts            # VPC, 2 AZs, public + private + isolated subnets, NAT (1 per env, single AZ for cost), security groups (ALB, EC2, RDS, Lambda)
│   ├── data-stack.ts               # RDS instance (single-AZ for launch), Parameter Store namespace setup, S3 media bucket + OAC
│   ├── compute-stack.ts            # ECR repo (shared across envs), ALB + target group + listener (TLS 1.2+, redirect-to-HTTPS), ASG + launch template (Amazon Linux 2023 + Docker + CloudWatch Agent), IAM instance profile
│   ├── edge-stack.ts               # CloudFront distribution (us-east-1 ACM cert, OAC for S3 origin, cache behaviors per ARCHITECTURE.md §3), Route53 record set (where the hosted zone is available)
│   ├── observability-stack.ts      # CloudWatch alarms per ARCHITECTURE.md §8, SNS topic, Slack notifier Lambda + IAM role, alarm subscriptions
│   ├── deploy-role.ts              # GitHub OIDC identity provider (one-time) + per-env CI deploy role (scoped policies)
│   └── construct-utils.ts          # Shared helpers — tagging, naming, env-resolver
├── test/                           # Vitest + aws-cdk-lib/assertions
│   ├── network-stack.test.ts
│   ├── data-stack.test.ts
│   ├── compute-stack.test.ts
│   ├── edge-stack.test.ts
│   ├── observability-stack.test.ts
│   └── slack-lambda.test.ts        # Pure-function payload formatter test
├── lambda/
│   └── slack-notifier/
│       ├── index.ts                # SNS event → formatted Slack message → POST to webhook
│       └── package.json            # Bundled by CDK NodejsFunction (esbuild)
├── cdk.json                        # CDK app config + per-env context
├── package.json
├── tsconfig.json
└── README.md                       # Pointer to plan.md + quickstart.md

# At repo root — existing files modified, no new top-level dirs
Dockerfile                          # Productionized — npm-only branch, no yarn/pnpm dead code; HEALTHCHECK directive
.dockerignore                       # NEW or expanded — excludes node_modules, .next, .git, tests/, specs/, docs/, etc.

.github/workflows/
├── ci.yml                          # EXISTING — extended to run `npm --prefix infra ci && npm --prefix infra run synth` in the `quality` job (proves CDK code synthesizes)
├── infra-diff.yml                  # NEW — on PR: assume OIDC role, run `cdk diff`, post as PR comment via `actions/github-script`. Skips silently if no infra/ files changed in the PR.
└── deploy.yml                      # NEW — on push to main: build Docker image, push to ECR (tag = git SHA + 'latest'), `cdk deploy SeqtekProd*Compute --require-approval never`. Triggers ASG instance refresh.

docs/
├── ARCHITECTURE.md                 # MODIFIED — §5 ASG sizing reconciliation, §8 alarm action column, §9 Failure Scenarios refresh
├── ROADMAP.md                      # MODIFIED — P1 CDK/Dockerfile/CI bullets move to PROJECT_HISTORY when shipped
├── PROJECT_HISTORY.md              # MODIFIED — new P1-10/P1-11/P1-12 entries (or similar)
└── decisions/
    └── 0004-cdk-stack-split.md     # NEW ADR if implementation reveals a non-obvious decision worth capturing
```

**Structure Decision**: Five CDK stacks under `infra/lib/` exactly as ARCHITECTURE.md §13 prescribes — split by blast radius (network rare-change vs compute deploy-time-change). One CDK app under `infra/bin/app.ts` switches environments via `-c env=prod|staging` context, producing stack-name-prefixed deployments (`SeqtekProd*` vs `SeqtekStaging*`) in the same account. Lambda code colocated in `infra/lambda/` and bundled via CDK's `NodejsFunction` construct (no separate build pipeline). Dockerfile stays at repo root (build context is the repo), `.dockerignore` adjusted to bound the image. Two new GitHub Actions workflows kept separate from `ci.yml` because their permission profiles differ (deploy requires `id-token: write` for OIDC; the existing test pipeline must not).

## Phase 0: Outline & Research

See [`research.md`](./research.md) — covers 9 decisions:

1. AWS region selection — **us-east-1** (CloudFront ACM constraint + latency simplicity)
2. ALB target-group deregistration delay — **120s** (longer than typical Next.js request, shorter than `next/image` worst case)
3. ASG `MinHealthyPercentage` semantics with `desired=2 max=3` (prod) vs `desired=1 max=2` (staging) — both deliver zero-downtime instance refresh; trade-off documented
4. Slack notifier — **inline ~40 LOC `NodejsFunction`** rather than `@slack/webhook` (zero new deps on the alerts path)
5. GitHub OIDC trust + role split — **one OIDC provider, two deploy roles** (`SeqtekProdDeploy`, `SeqtekStagingDeploy`), each scoped to its own env's stack ARNs
6. RDS storage — **gp3, 50 GB allocated, 1000 IOPS** (Postgres workload is read-heavy with small writes; gp3 is cheaper than gp2 at this size)
7. ECR lifecycle policy — **keep last 10 tagged images + 7d untagged retention** (matches ARCHITECTURE.md §9; tunable later)
8. Parameter Store namespace — **`/seqtek/website/{env}/...`** (matches existing OAuth client spec; extended with DB password path, Payload secret path, Slack webhook URL path, revalidation secret path)
9. CDK app context schema — **per-env block in `cdk.json`** with `instanceClass`, `instanceSize`, `rdsClass`, `domainName`, `certificateArn?`, `hostedZoneId?`, `desiredCapacity`, `minCapacity`, `maxCapacity`

**Output**: research.md with all 9 decisions resolved.

## Phase 1: Design & Contracts

### Data model

See [`data-model.md`](./data-model.md). For an infra feature, "data model" is the CDK construct tree + Parameter Store namespace + per-env sizing table. Captures:

- Per-stack construct list with cross-stack references explicitly enumerated (one-directional; observability references compute/data/edge; compute references network/data; data references network; edge references compute)
- Per-env sizing table (prod vs staging) for instance class, RDS class, ASG desired/min/max, NAT instance count, alarm thresholds
- Parameter Store namespace map (all paths the app reads + all paths CDK writes)
- IAM role inventory (CI deploy role, EC2 instance profile, Slack Lambda role) with scoped policy summaries

### Contracts

External interfaces this feature exposes — see [`contracts/`](./contracts/):

- `cdk-context.md` — `cdk.json` `context.envs.{prod,staging}` schema (what an engineer can/must set)
- `parameter-store.md` — `/seqtek/website/{env}/*` path namespace, which paths CDK writes vs which the app reads, classification (SecureString vs String)
- `github-workflows.md` — `deploy.yml` and `infra-diff.yml` triggers, required secrets/vars, OIDC role ARNs, outputs
- `alarm-payload.md` — SNS message shape produced by CloudWatch + consumed by the Slack notifier Lambda; resulting Slack message format

### Agent context update

CLAUDE.md's SPECKIT pointer (lines 45-51) flips from `specs/001-google-oauth-sso/plan.md` to `specs/002-aws-cdk-infrastructure/plan.md` (handled at the end of this Phase 1 step).

### Quickstart

See [`quickstart.md`](./quickstart.md). Walks a fresh engineer (or a fresh AWS account) from zero to a deployed staging environment in under 60 minutes. Covers: AWS account prerequisites → `cdk bootstrap` → OIDC trust setup (one-time, requires AWS console session) → Slack channel + webhook URL provisioning (out-of-band, Kenn) → Parameter Store seeding → first `cdk deploy` → smoke-test checklist → alarm-firing simulation → tear-down procedure.

## Constitution Check (post-design re-check)

Re-evaluated after writing research.md, data-model.md, contracts/, quickstart.md:

| Principle                                        | Status | Notes                                                                                                                                                                                                                                        |
| ------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Spec Before Code**                          | ✅     | No new framework-internals dependencies discovered during design. Doc cross-references intact.                                                                                                                                               |
| **II. Tests Gate Merge**                         | ✅     | Test inventory finalized in data-model.md and quickstart.md verification checklist — each FR is covered by at least one assertion or smoke test.                                                                                             |
| **III. Docs Are Code**                           | ✅     | Three ARCHITECTURE.md reconciliations confirmed; no new doc drift introduced by Phase 1 artifacts.                                                                                                                                           |
| **IV. Security Baseline**                        | ✅     | OIDC trust documented in `contracts/github-workflows.md`; no static AWS keys; Slack webhook URL kept in Parameter Store (SecureString); Slack Lambda inline (no new deps on alerts path); CDK assertion tests gate IAM-wildcard regressions. |
| **V. Bleeding-Edge Stack, Pinned and Defensive** | ✅     | `aws-cdk-lib` exact-pinned in `infra/package.json`; per-env CDK context shape allows version bumps to be tested on staging first.                                                                                                            |

**Result**: 5/5 gates still pass post-design. No new constitution risks surfaced.

## Complexity Tracking

> **Empty — no constitution violations to justify.**
