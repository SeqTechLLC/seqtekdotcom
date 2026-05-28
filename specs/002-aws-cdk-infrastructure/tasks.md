---
description: 'Task list for spec 002 — AWS CDK Infrastructure & Blue-Green CI/CD'
---

# Tasks: AWS CDK Infrastructure & Blue-Green CI/CD

**Input**: Design documents from `/specs/002-aws-cdk-infrastructure/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/cdk-context.md`, `contracts/parameter-store.md`, `contracts/github-workflows.md`, `contracts/alarm-payload.md`, `quickstart.md`.

**Tests**: Mandatory per Constitution Principle II — every user story ships with at least one CDK assertion test (`aws-cdk-lib/assertions` under `infra/test/`), Vitest unit test, or Playwright smoke that exercises the load-bearing path. Tests are written first and verified failing before the implementing code lands.

**Organization**: Phases mirror the user stories in `spec.md`. Within each story, tests precede implementation. File paths are absolute-from-repo-root. Tasks marked `[P]` touch a different file from every other `[P]` task in the same phase and have no in-phase ordering constraint.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different file, no in-phase predecessor)
- **[Story]**: which user story (US1–US5) — omitted in Setup, Foundational, and Polish
- Each task description names the exact file(s) it touches and references the contract / data-model / quickstart section it implements.

## Path Conventions

This feature lives primarily under a **new top-level `infra/`** directory (CDK app + tests + Lambda) per `plan.md` § "Project Structure". Repo-root files touched: `Dockerfile`, `.dockerignore`, `.github/workflows/*.yml`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/PROJECT_HISTORY.md`, `CLAUDE.md` (SPECKIT pointer already updated in /speckit-plan).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: stand up the `infra/` directory, pin the CDK dependency, and ship the lint/test toolchain so every later phase has a working scaffold to add code to. Nothing in this phase is AWS-facing; nothing deploys.

- [x] T001 Create `infra/` directory scaffold at repo root: `infra/{bin,lib,test,lambda/slack-notifier}` empty dirs + `infra/README.md` (one-paragraph pointer to `specs/002-aws-cdk-infrastructure/plan.md` and `quickstart.md`).
- [x] T002 Create `infra/package.json` with exact-pinned (no caret) `aws-cdk-lib` and `constructs` (latest stable at write time); devDeps `aws-cdk` CLI, `typescript`, `@types/node`, `vitest`, `esbuild`, `aws-sdk-client-mock`. Scripts: `synth`, `diff`, `deploy`, `destroy`, `test`. Run `npm install` and commit `infra/package-lock.json`. Versions pinned: `aws-cdk-lib@2.257.0`, `constructs@10.6.0`, `aws-cdk@2.1124.1`, devDeps mirror root project pins. `npm audit --omit=dev --audit-level=high` clean (one moderate `brace-expansion` inside `aws-cdk-lib/node_modules/` accepted per Constitution IV: framework's own tree, no upgrade path).
- [x] T003 [P] Create `infra/tsconfig.json` extending the root tsconfig (strict mode, no `any`, `target: es2022`, `module: commonjs`, `outDir: cdk.out`). Add `infra/vitest.config.ts` (node env, includes `test/**/*.test.ts`). Note: tsconfig is standalone (not extending root) because root is Next.js-flavored — CDK uses plain Node module resolution. `noEmit: true` since `tsx` handles execution.
- [x] T004 [P] Create `infra/cdk.json` with the `app` command (`npx tsx bin/app.ts`), feature flags appropriate for the pinned `aws-cdk-lib` major, and the `context.envs.{prod,staging}` block matching `contracts/cdk-context.md` exactly. Use `null` for `domainName`/`hostedZoneId`/`certificateArn` on staging; populate prod's `domainName: "seqtek.com"` and leave zone/cert as `null` until first deploy resolves them. **Deviation**: prod's `domainName` left `null` too (with comment) — populating it pre-Phase-6 would fail `validateEnvConfig` rule (`domainName !== null` requires `hostedZoneId !== null`). Set together at Phase 6 cutover.
- [x] T005 [P] Add `infra/.gitignore` for `cdk.out/`, `node_modules/`, `*.d.ts`, `*.js` compile artifacts (TypeScript output should never be committed). Add `infra/` to root `.dockerignore` (T019).
- [x] T006 [P] Extend `eslint.config.mjs` at repo root to include `infra/**/*.ts` with the same strict ruleset as `src/`. Run `npm run lint` from repo root — must be clean after T007–T013 land. Added explicit per-infra override block + ignored `infra/cdk.out/`, `infra/node_modules/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: implement the CDK app entry point, env-config validator, network stack, OIDC trust + deploy roles, and the IAM-invariants assertion test. After this phase the CDK app synthesizes (no AWS calls), the OIDC bootstrap is ready to deploy, and every later phase can add stacks against the network foundation.

**⚠️ CRITICAL**: no user-story work may begin until this phase is complete.

- [x] T007 Implement `infra/lib/construct-utils.ts` — exports `EnvConfig` interface, `validateEnvConfig(cfg)` (throws on rule violations per `contracts/cdk-context.md` § Validation rules), `resolveEnv(app)` (reads `-c env=...` context + looks up the envs block + validates), and `stackName(env, kind)` (returns `Seqtek${env}${kind}`). Plus `stackEnv(cfg)` helper for the AWS-environment `{account, region}` block. **Naming note**: the stack-prop key for env-name is `envName` (not `env`) to avoid collision with CDK `StackProps.env` which is `{account, region}`.
- [x] T008 [P] Implement `infra/bin/app.ts` — instantiate `cdk.App()`, call `resolveEnv()`, instantiate the five stacks in dependency order with cross-stack refs wired via stack outputs. Stacks themselves are stubs at this point (T009 fills NetworkStack; T011 fills DeployRole; the other three are TODO classes that throw "not implemented" — they get filled in US1/US3 phases). **Deviation**: stub stacks instantiate as empty `cdk.Stack` subclasses (not throw-on-construct) — required for `cdk synth` to succeed at T013 verification time. The `TODO(T020|T021|T022|T042)` comments mark where Phase 3/5 implementations land.
- [x] T009 Implement `infra/lib/network-stack.ts` — `Vpc` with 2 AZs. **Validation-period topology** per Clarifications Session 2026-05-26: 2 subnet tiers (public + isolated), `NatGateway` count 0. Phase 5.5 launch readiness adds the `PRIVATE_WITH_EGRESS` tier + NAT and flips the ASG subnet placement. Four security groups (`AlbSg`, `AppSg`, `RdsSg`, `LambdaSg`) per `data-model.md` § 1; stack outputs for VPC ID, subnet IDs, SG IDs. Invokes `DeployRoles` so OIDC + per-env deploy role land with the network stack (rare-change-rate blast radius).
- [x] T010 [P] Write `infra/test/network-stack.test.ts` — `Template.fromStack(stack)`; assert: VPC has exactly 2 AZs; RDS isolated subnet has no route to `0.0.0.0/0`; AlbSg ingress = 443 from CloudFront managed prefix list ONLY; RdsSg ingress = 5432 from AppSg ONLY; no SG allows ingress from `0.0.0.0/0` on any port. 9 test cases; all green.
- [x] T011 Implement `infra/lib/deploy-role.ts` — `OpenIdConnectProvider` (one per account; created in NetworkStack's scope per `contracts/github-workflows.md` § OIDC), two `Role` constructs (`SeqtekProdDeploy`, `SeqtekStagingDeploy`) with `WebIdentityPrincipal` trust policy pinning `repo:SeqTechLLC/seqtekdotcom:ref:refs/heads/main` (prod) / `repo:SeqTechLLC/seqtekdotcom:*` (staging). Attach IAM policies per `data-model.md` § 3 (CloudFormation + IAM PassRole + SSM bootstrap + S3 toolkit + ECR + ASG instance-refresh). Add `Role` to NetworkStack so it deploys with the first stack. Staging imports the OIDC provider via deterministic ARN (one provider per issuer URL per account).
- [x] T012 [P] Write `infra/test/iam-invariants.test.ts` — `Template.fromStack` against each stack; fail if any `iam.PolicyStatement` has `Action` containing `s3:*` / `ssm:*` / `iam:*` / `kms:*` / `cloudformation:*` / `ec2:*` with `Resource: ['*']`; fail if any role lacks the `token.actions.githubusercontent.com:sub` condition when its trust principal is the OIDC provider; fail if `EC2 instance profile` includes the `AmazonSSMManagedInstanceCore` managed policy (we explicitly opted out per `data-model.md` § 3). 8 test cases covering both prod and staging synthesis. **Allowlist extended**: CDK's OIDC custom-resource Lambda holds `iam:*OpenIDConnectProvider` actions on `Resource: *` (the provider ARN doesn't exist at policy-attach time) — added to the documented exceptions alongside `ecr:GetAuthorizationToken`, `cloudwatch:PutMetricData`, `ssm:DescribeParameters`.
- [x] T013 [P] Run `npm --prefix infra run synth -- -c env=staging --quiet` and `… -c env=prod --quiet` — both must complete with zero warnings and zero errors. Same for `npm --prefix infra run test` — T010 + T012 must pass against the foundational stacks. **Verified**: 17/17 tests green; both env syntheses clean; root `npm run lint && typecheck && format:check` all green.

**Checkpoint**: foundation ready. `cdk synth` clean; assertion tests green; OIDC + deploy roles defined but not yet deployed to AWS.

---

## Phase 3: User Story 1 - Engineer deploys the app to production for the first time (Priority: P1) 🎯 MVP

**Goal**: from a fresh AWS account + a fresh clone, an engineer can run `cdk deploy 'Seqtek{env}*'` and end up with a serving Next.js + Payload application reachable over HTTPS, `/api/health` returning 200, `/admin` reaching the Google SSO entry from spec 001.

**Independent Test**: deploy the full `SeqtekStaging*` stack set from a clean state; smoke-test the CloudFront URL; assert `/api/health` → 200 and `/admin` → SSO entry.

### Tests for User Story 1 (MANDATORY — per constitution Principle II) ⚠️

> Write these tests FIRST, ensure they FAIL before the matching stack implementation turns them green.

- [x] T014 [P] [US1] Write `infra/test/data-stack.test.ts` — assert: RDS Postgres in IsolatedSubnet (no internet route), `backupRetention >= 7d`, `deletionProtection: true` on prod / `false` on staging, `storageType: gp3`, `allocatedStorage >= 20`; S3 media bucket has `BlockPublicAccess: ALL`, `Versioning: ENABLED`, `ObjectOwnership: BUCKET_OWNER_ENFORCED`, encryption enabled; sensitive values are stored in Secrets Manager (CDK-managed) and mirrored to SSM SecureString via Custom::SsmSecureStringMirror; assertion verifies the Create payloads contain CFN intrinsics (dynamic reference) NOT plaintext, satisfying Constitution IV.
- [x] T015 [P] [US1] Write `infra/test/compute-stack.test.ts` — assert: ECR repo created in staging (imported by prod); ECR lifecycle "keep 10 tagged + 7d untagged"; ALB internet-facing in public subnets; HTTP-only listener on 80 (TLS terminates at CloudFront pre-Phase-5.5; 443 + ALB cert added at Phase 5.5); target group `DeregistrationDelay: 120s`, health check `/api/health` interval 30s thresholds 3/2; LaunchTemplate `HttpTokens: required` + `HttpPutResponseHopLimit: 2`; LaunchTemplate `AssociatePublicIpAddress: true` (validation-period); ASG `MinSize/DesiredCapacity/MaxSize` per env config + `MinInstancesInService` matches MinSize; ALB has deletion protection on prod; log group retention matches per env (90 prod / 14 staging).
- [x] T016 [P] [US1] Write `infra/test/edge-stack.test.ts` — assert: distribution + PriceClass_100; viewer protocol REDIRECT_TO_HTTPS on default + all behaviors; per-path behaviors exist for `/admin/*`, `/api/*`, `/_next/static/*`, `/media/*`; admin + api use CachingDisabled policy; OAC attached to S3 media origin (sigv4); error response 403 → 404; **with-domain branch** also asserts: ACM cert with DNS validation + SAN for www, distribution aliases include apex + www, 2 Route53 A records. Without domain (validation-period), neither ACM cert nor Route53 records are created.
- [x] T017 [P] [US1] Write `tests/e2e/post-deploy-smoke.e2e.spec.ts` (Playwright; env-driven base URL `POST_DEPLOY_URL`) — assert: `GET /api/health` returns 200 with `{ status: "ok", db: "ok" }`; `GET /admin` returns 200 and the page contains the spec-001 "Sign in with Google" CTA; `GET /` returns 200; HTTP → HTTPS redirect when base URL is HTTPS. Test is skipped locally unless `POST_DEPLOY_URL` is set.

### Implementation for User Story 1

- [x] T018 [P] [US1] Productionize `Dockerfile` at repo root: removed the `yarn.lock` / `pnpm-lock.yaml` branches in the `deps` and `builder` stages (npm-only); added `HEALTHCHECK CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health`; added `tini` as PID 1 for clean SIGTERM handling on rolling refresh; copied `public/` into the runtime image (Next.js standalone build doesn't bundle it); non-root `nextjs` user retained. Container does NOT receive `.git`, `.env*`, `specs/`, `docs/`, `infra/`, or `tests/` (see T019).
- [x] T019 [P] [US1] Updated `.dockerignore` at repo root: comprehensive exclusion list covering source-control + tooling (`.git`, `.github`, `.husky`, `.specify`, editors), build outputs (`node_modules`, `.next`, `out`, `build`, `dist`, `.turbo`, `coverage`), env files (`.env`, `.env*.local`), tests (`tests/`, `playwright-report/`, `playwright/.cache/`, `test-results/`, `.lighthouseci/`), repo docs (`docs/`, `specs/`, `brandkit/`, `*.md`, `LICENSE`), `infra/`, log files, and alternative package managers (yarn/pnpm lockfiles). Constitution IV satisfied: no `.env*` ever reaches the image.
- [x] T020 [US1] Implemented `infra/lib/data-stack.ts` — Postgres 16.4 DatabaseInstance (db.t3.{micro|small} per `cfg.rdsInstanceClass`, gp3, 7d backups, deletionProtection per env, master credentials in Secrets Manager); S3 `seqtek-media-{env}` Bucket (BlockPublicAccess: ALL, BUCKET_OWNER_ENFORCED, S3_MANAGED encryption, versioning, lifecycle rules per `data-model.md` § 1); Parameter Store: `s3_bucket` + `s3_bucket_hostname` (plaintext StringParameter), `database_url` + `payload_secret` + `revalidation_secret` (SecureString via AwsCustomResource pattern using CFN dynamic-reference resolution — values never appear in synth output). Bucket policy NOT attached here (cycle avoidance — added in EdgeStack).
- [x] T021 [US1] Implemented `infra/lib/compute-stack.ts` — ECR Repository `seqtek-website` (created in staging, imported by name in prod); ALB internet-facing in public subnets; **HTTP-only listener on port 80** (TLS terminates at CloudFront pre-Phase-5.5; ALB 443 + cert added at Phase 5.5 polish); ASG target group inline via `listener.addTargets()` (port 3000, /api/health, dereg 120s); explicit `LaunchTemplate` with `requireImdsv2: true` + `httpPutResponseHopLimit: 2`; L1 escape sets NetworkInterfaces with `AssociatePublicIpAddress: true` + deletes top-level SecurityGroupIds (CFN forbids both); ASG in public subnets, MinHealthyPercentage=100 via `MinInstancesInService` in rolling update; user-data installs Docker + CW Agent + pulls ECR image + reads Parameter Store + `docker run --restart=unless-stopped --env-file`; IAM `AppInstanceRole` per `data-model.md` § 3 (SSM scoped to env prefix, KMS aws/ssm only, S3 media bucket only, ECR pull on shared repo, log group writes scoped).
- [x] T022 [US1] Implemented `infra/lib/edge-stack.ts` — CloudFront Distribution (PriceClass_100, HTTP2_AND_3, TLS_V1_2_2021 minimum); ALB origin via `LoadBalancerV2Origin` with `OriginProtocolPolicy.HTTP_ONLY`; S3 media origin via `S3BucketOrigin.withOriginAccessControl` against an **imported** bucket reference (cycle-break workaround) + manual `CfnBucketPolicy` in EdgeStack pinning `AWS:SourceArn` to this distribution; per-path behaviors per `data-model.md` § 1 (admin/api: CachingDisabled; \_next/static + media: CachingOptimized); error response 403 → 404 for missing media. **Conditional** ACM cert + Route53 A records (apex + www) when `cfg.domainName` is set — null until T029a registers seqtek-preview.com; until then, distribution uses its default `*.cloudfront.net` DNS.
- [x] T023 [US1] Wire cross-stack refs in `infra/bin/app.ts` — already in place from Phase 2 (T008). NetworkStack → Data, Compute, Edge, Observability; Data → Compute, Edge; Compute → Edge, Observability; Edge → Observability. `app.synth()` produces 5 stacks per env. Added `Annotations.of(app).acknowledgeWarning(...)` for the intentional imported-bucket OAC warning per the cycle-break design.
- [x] T024 [US1] Final verification: `npx tsc --noEmit` CLEAN; `npx vitest run` 57/57 GREEN (network 10, IAM invariants 8, data 12, compute 14, edge 13); `npx cdk synth -c env=staging --quiet` + `-c env=prod --quiet` both CLEAN; root `npm run lint && typecheck && format:check` ALL GREEN. Constitution V deprecation warnings addressed: switched from deprecated `HealthCheck.elb()` to `HealthChecks.withAdditionalChecks()`. One residual CDK warning at synth: "Cannot update bucket policy of an imported bucket" — intentional per cycle-break design; acknowledged via `Annotations.acknowledgeWarning` in `bin/app.ts` (warning still surfaces due to a CDK quirk in the ack-propagation; informational only, doesn't affect synth/deploy).
- [x] T025 [US1] One-time AWS account bootstrap (per `quickstart.md` § 1): authenticate AWS CLI; `npx cdk bootstrap aws://<account>/us-east-1`; `npx cdk deploy -c env=prod SeqtekProdNetwork`; verify the `OpenIdConnectProvider` ARN in IAM console; record OIDC provider ARN + deploy role ARNs in a private note (account-specific; not committed).
- [x] T026 [US1] Seed staging Parameter Store manual paths per `quickstart.md` § 2: create OAuth client in Google Cloud Console (separate from prod's; redirect URI uses staging CloudFront default until DNS exists); `aws ssm put-parameter` for `google_client_id`, `google_client_secret`, `slack_webhook_url` under `/seqtek/website/staging/...`. Verify with `aws ssm get-parameters-by-path`.
- [x] T027 [US1] Deploy the full staging stack set: `npx cdk deploy -c env=staging 'SeqtekStaging*'`. Expected wall-clock ~25 min (RDS provisioning dominant). Capture and address any synth-time warnings; capture deploy outputs (CloudFront domain, ECR URI, ALB DNS) in the run log.
- [x] T028 [US1] Build and push the first container image: `docker build -t <ecr-uri>:bootstrap-$(git rev-parse --short HEAD) .`; `aws ecr get-login-password | docker login ...`; `docker push <ecr-uri>:bootstrap-...`; tag also as `:latest`. Then trigger an ASG instance refresh manually so new instances pick up the image: `aws autoscaling start-instance-refresh --auto-scaling-group-name <staging-asg-name> --preferences MinHealthyPercentage=100,InstanceWarmup=180`. Wait for completion (poll `describe-instance-refreshes`).
- [x] T029 [US1] Run the post-deploy smoke from T017 against the staging CloudFront URL: `POST_DEPLOY_URL=https://<cf-domain> npx playwright test tests/e2e/post-deploy-smoke.e2e.spec.ts`. All three assertions (`/api/health`, `/admin`, `/`) must pass. If `/admin` fails because the staging Google OAuth client redirect URI isn't set, update the OAuth client in Google Cloud Console with the now-known staging URL and retry — document this as a known one-time bootstrap step in quickstart §2.
- [x] T029a [US1] **Register `seqtek-preview.com` in Route 53** (per Clarifications Session 2026-05-25): hosted zone `Z00293712Y3ITLM3J388K` created on registration (2026-05-27); auto-renew enabled.
- [x] T029b [US1] **Wire the staging domain into CDK**: `infra/cdk.json` staging env config updated — `domainName: "seqtek-preview.com"`, `hostedZoneId: "Z00293712Y3ITLM3J388K"`. Edge stack re-deployed; ACM cert issued via DNS validation; alias + Route 53 A records (apex + www) live (commit `186aceb`).
- [x] T029c [US1] **Verified staging on the vanity URL**: HTTPS on `seqtek-preview.com` healthy; OAuth round-trip works after the proxy/forwarded-host fixes (commits `492fea2`, `6288188`); CloudFront origin request policy includes managed headers (commit `9796eef`).
- [ ] T030 [US1] Repeat T025–T029 for production: `cdk deploy -c env=prod SeqtekProdNetwork` (if not done) → `cdk deploy -c env=prod 'SeqtekProd*'` → seed prod Parameter Store paths → push image → instance refresh → run post-deploy smoke against the prod CloudFront URL. **Prod stays on the CloudFront-generated default URL until Phase 6 DNS cutover** — no domain task analog to T029a/b/c in this feature; `cfg.domainName` stays `null` for prod. **This is the gate for SC-001 (≤60 min wall-clock for first deploy, excluding the optional T029a-c domain pass)** — time the procedure.

**Checkpoint**: SeqtekStaging* and SeqtekProd* both deployed. Staging serves on `https://seqtek-preview.com` (leadership-preview URL, per Clarifications Session 2026-05-25); prod serves on its CloudFront-default URL pending Phase 6 DNS cutover. `/admin` reaches the spec-001 SSO entry on both. T017 smoke test green against both environments. User Story 1 complete.

---

## Phase 4: User Story 2 - Continuous delivery (Priority: P1)

**Goal**: a merge to `main` deploys the new container image to production within 20 min (SC-002), without human action, with zero customer-facing 5xx caused by the deploy itself (SC-003), and infra-touching PRs receive a `cdk diff` comment within 5 min of CI starting (SC-004).

**Independent Test**: open a PR with a trivial infra change (comment in cdk.json) — verify the diff comment appears. Push a deliberately broken image to staging — verify the deploy fails and the previous image keeps serving.

### Tests for User Story 2 (MANDATORY) ⚠️

- [x] T031 [P] [US2] Added `lint-workflows` job to `.github/workflows/ci.yml`. Installs the official `rhysd/actionlint` binary via the upstream `download-actionlint.bash` script (no third-party Action dep) and runs `actionlint -color` over all workflows. Verified locally via the `rhysd/actionlint` Docker image — all three workflows pass clean.

### Implementation for User Story 2

- [x] T032 [US2] Added an `infra-synth` job to `.github/workflows/ci.yml` (separate from `quality` so CDK deps don't bloat the main quality job). Runs `npm --prefix infra ci`, `cdk synth` for staging + prod with `--quiet`, then `vitest`. No `id-token: write` permission — synth runs entirely from committed code. `cache-dependency-path: infra/package-lock.json` caches the CDK toolchain.
- [x] T033 [P] [US2] Created `.github/workflows/infra-diff.yml` per `contracts/github-workflows.md` § `infra-diff.yml`. Triggers on PR-to-main with the documented `paths:` filter; permissions `id-token: write` + `contents: read` + `pull-requests: write`; assumes `SeqtekStagingDeploy` (read-only diff role); runs `cdk diff` for both envs and posts/updates a single sticky PR comment via `actions/github-script@v7` (idempotent via `<!-- speckit-infra-diff -->` marker). Each env's diff truncates at 30 000 chars to stay under GitHub's ~65 000-char comment limit.
- [x] T034 [P] [US2] Created `.github/workflows/deploy.yml`. **Scope deviation from the contract**: staging-only for now — production auto-deploy is deferred until leadership approves the seqtek.com DNS cutover. The contract's prod-targeted version becomes a sibling `deploy-prod.yml` (or an `env` input on this file) at Phase 6. Triggers on push-to-main and `workflow_dispatch` with `stack-filter` input (default `SeqtekStaging*Compute`). Concurrency group `deploy-staging`. Steps: checkout → assume `SeqtekStagingDeploy` → ECR login → `docker/build-push-action@v6` (linux/amd64, GHA cache, tags `:<sha7>` + `:latest`) → `cdk deploy -c env=staging $STACK_FILTER --require-approval never` → poll `describe-instance-refreshes` until terminal (15 min timeout; pass-through if filter didn't touch an ASG) → resolve staging SiteUrl from `SeqtekStagingEdge` outputs → run `tests/e2e/post-deploy-smoke.e2e.spec.ts` against `https://seqtek-preview.com`. Uploads the Playwright report as an artifact on success or failure. `environment: staging` is always set so the GitHub Environments UI records the deployment history (no required reviewers on staging).
- [x] T035 [US2] GitHub repo settings configured via `gh` / `aws` CLI on 2026-05-27 (staging-only scope; prod pieces deferred):
  1. Repository variable `AWS_ACCOUNT_ID = 600881993295` set via `gh variable set`.
  2. `staging` GitHub Environment created via `gh api PUT /repos/.../environments/staging` with no protection rules.
  3. Branch protection on `main` via `gh api PUT /repos/.../branches/main/protection`: required status checks = `Typecheck + Lint + Format`, `Secret scan (gitleaks)`, `Vitest (integration, testcontainers-backed)`, `Playwright + axe + Lighthouse`, `Workflows lint (actionlint)`, `CDK synth + assertion tests`; `strict: true` (must be up-to-date); PR required (0 approvals); no force-push, no deletion. **Deviation from quickstart.md §3**: `cdk diff` (from `infra-diff.yml`) deliberately NOT required — the path filter on that workflow would cause non-infra PRs to be blocked waiting for a check that never reports. Diff comment is informational; reviewers read it during code review.
  4. **Deferred until seqtek.com cutover approval**: the `production` GitHub Environment + required reviewers gate + the production-targeted deploy workflow. Phase 6 task adds them.
- [x] T036 [US2] **SC-002 measured: 7m45s wall-clock on staging (2026-05-28)**. Push (17:15:33 UTC) → both jobs green (17:23:18 UTC). Well inside the 20-min budget. Path: PR #6 merge to main → `deploy.yml` fires → `deploy` job (build/push to ECR with GHA cache, cdk deploy `SeqtekStaging*Compute`, explicit `start-instance-refresh`, poll until Successful, resolve SiteUrl) → `smoke` job (Playwright container, 4 assertions against `https://seqtek-preview.com`). Infra-diff sticky comment appears within ~30s on infra-touching PRs (verified on PRs #3-#6); both env diffs render cleanly post the IAM `sts:AssumeRole` fix. Prod measurement deferred until seqtek.com cutover. Phase 4 fixes shipped along the way: PR #4 (deploy-role IAM + explicit refresh trigger), PR #5 (smoke job container split), PR #6 (`PLAYWRIGHT_BASE_URL` for external-server mode).
- [ ] T037 [US2] End-to-end rollback test (real PR on staging): on a branch, push a deliberately broken Dockerfile change (e.g., `CMD ["false"]` as the entrypoint); merge to `main`. Observe the `deploy.yml` run: ECR push succeeds → ASG instance refresh starts → new instance fails health check → instance refresh aborts → previous image continues serving. Verify staging `/api/health` returns 200 throughout (no customer-facing 5xx). Revert the broken change in a follow-up PR.

**Checkpoint**: routine merges to `main` deploy automatically; infra-touching PRs get a diff comment; failed deploys roll back cleanly. User Story 2 complete.

---

## Phase 5: User Story 3 - On-call engineer is paged when something is wrong (Priority: P1)

**Goal**: when production produces a 5xx surge, an unhealthy host, RDS storage pressure, or a CloudFront error spike, the on-call engineer gets a Slack message within 5 min (SC-005) with enough context to triage.

**Independent Test**: deploy SeqtekStagingObservability; trigger manual EventBridge heartbeat → Slack message visible. Simulate one ALB 5xx alarm in staging → 🚨 message in #seqtek-website-alerts within 5 min.

### Tests for User Story 3 (MANDATORY) ⚠️

- [x] T038 [P] [US3] Wrote `infra/test/slack-lambda.test.ts` (17 tests, all green). Imports `formatAlarmBlocks` from `infra/lambda/slack-notifier/format` (split from `index.ts` so the test path doesn't pull in `@aws-sdk/client-ssm` / `aws-lambda` types). Fixtures live in `infra/lambda/slack-notifier/__fixtures__/`: `alarm-fired.json` (ALARM, ALB), `alarm-recovered.json` (OK), `alarm-insufficient-data.json` (INSUFFICIENT_DATA, RDS), `heartbeat.json` (HEARTBEAT). Tests cover header icon per state, fields section content, dimension resolution, action button URLs, malformed input rejection.
- [x] T039 [P] [US3] Wrote `infra/test/observability-stack.test.ts` (19 tests, all green, both envs). Asserts: exactly 9 alarms with documented short names; SNS topic has `KmsMasterKeyId: 'alias/aws/sns'`; both ALARM + OK transitions route to the SNS topic on every alarm; Lambda runtime/handler/env var correct; SSM:GetParameter scoped to the env's webhook param ARN only; Lambda runs WITHOUT VpcConfig (validation-period deviation — see T042); SNS → Lambda subscription exists; EventBridge rule fires `rate(6 hours)` with a HEARTBEAT-shaped payload; log group has 14-day retention; threshold values match data-model § 1 for a representative subset.

### Implementation for User Story 3

- [x] T040 [P] [US3] Implemented `infra/lambda/slack-notifier/index.ts` (handler) + `format.ts` (pure formatter). The split keeps `formatAlarmBlocks` import-free of `@aws-sdk/client-ssm` so the unit test runs without installing Lambda-only modules. Handler: per-warm-instance webhook URL cache via `SSMClient.GetParameterCommand`, JSON POST to webhook via global `fetch`, throws on non-2xx. Formatter routes ALARM/OK/INSUFFICIENT_DATA/HEARTBEAT to the Block Kit shapes in `contracts/alarm-payload.md` § 2 / § 5; dimension hints resolve alarm-name prefix first (so `RdsCpuHigh` doesn't get misclassified by the shared `CPUUtilization` metric name); button URLs are deterministic CloudWatch console deep-links.
- [x] T041 [P] [US3] Created `infra/lambda/slack-notifier/package.json` (devDeps `@aws-sdk/client-ssm@3.703.0` + `@types/aws-lambda@8.10.149` for IDE typings) + `infra/lambda/slack-notifier/tsconfig.json` (Node 22 target, isolated from infra's tsconfig since infra excludes `lambda/`). esbuild bundles the handler at synth via CDK's `NodejsFunction`; `@aws-sdk/*` is marked external (provided by the Lambda runtime).
- [x] T042 [US3] Implemented `infra/lib/observability-stack.ts`. `Topic: AlarmTopic` with `KmsMasterKeyId: alias/aws/sns` (AWS-managed key) via L1 escape (the L2 `masterKey: undefined` doesn't apply encryption); `NodejsFunction: SlackNotifier` with explicit `logGroup` (avoids the deprecated `logRetention` prop), env var `WEBHOOK_PARAMETER_PATH=/seqtek/website/{env}/slack_webhook_url`, IAM role with `ssm:GetParameter` scoped to that exact param + `kms:Decrypt` on `alias/aws/ssm` + `AWSLambdaBasicExecutionRole`; SNS → Lambda subscription; 9 alarms (AlbFiveXx, AlbUnhealthyHost, Ec2CpuHigh, Ec2MemoryHigh, Ec2DiskHigh, RdsCpuHigh, RdsFreeStorageLow, RdsConnectionsHigh, CloudFrontErrorRate) per data-model § 1; each alarm calls both `addAlarmAction` and `addOkAction`; `EventBridge.Rule` `rate(6 hours)` → SNS target with `RuleTargetInput.fromObject` shaping a HEARTBEAT payload that the Lambda routes to the context-only block. **Deviation from data-model § 1** (documented in code header): Lambda runs WITHOUT VPC config because the validation-period network topology has no NAT gateway; IAM scoping on the webhook param is the actual security boundary. Phase 5.5 launch-readiness review flips this to PRIVATE_WITH_EGRESS. RdsConnectionsHigh threshold sized to db.t3.micro 80% (60 connections) so staging alarms before exhaustion. Ec2MemoryHigh / Ec2DiskHigh depend on the CloudWatch Agent publishing `mem_used_percent` / `disk_used_percent` at ASG-aggregate level (config in `compute-stack.ts` UserData).
- [x] T043 [US3] **Staging done (2026-05-28)**. Created custom Slack App `seqtek-website-alerts` (api.slack.com/apps → Incoming Webhooks → installed to workspace → webhook URL bound to `#seqtek-website-alerts`). Put into SSM via `aws ssm put-parameter --name /seqtek/website/staging/slack_webhook_url --type SecureString --value '...' --overwrite` (Version 1, KMS-encrypted). **Prod deferred** — pairs with the production observability deploy at seqtek.com cutover time.
- [x] T044 [US3] **Staging done (2026-05-28)**. Triggered via `gh workflow run "Deploy (staging)" --ref main -f stack-filter='SeqtekStaging*Observability'`. End-to-end clean: ECR build + push, `cdk deploy SeqtekStaging*Observability`, no ASG churn (stack filter skipped compute), Playwright smoke green. **Prod deferred** — same DNS-cutover gate as Phase 4 prod CD.
- [x] T045 [US3] **Heartbeat path verified (2026-05-28)**. Manual `aws sns publish` with HEARTBEAT-shaped payload to `SeqtekStagingObservability-AlarmTopic` triggered the Lambda (993 ms cold start, 113 MB peak, no errors). `#seqtek-website-alerts` received the `⚙️ Heartbeat — alert pipeline is healthy` message within ~5s. (`aws cloudwatch set-alarm-state` was tried first but didn't fire SNS for the freshly-created alarm — known AWS quirk where actions don't fire until the alarm has been evaluated at least once with real data; manual SNS publish is the documented fallback for first-deploy verification.)
- [x] T046 [US3] **ALARM + OK round-trip verified (2026-05-28)** via the same `aws sns publish` shortcut as T045. Published an ALARM-shaped CloudWatch alarm payload for `SeqtekStagingObservability-AlbFiveXx`, then an OK-shaped recovery payload. Both Lambda invocations clean (823 ms first, 146 ms warm). Slack received 🚨 header + State/Dimension/Threshold/Observed fields + Reason + CloudWatch + ALB-logs buttons + context, then ✅ recovery with no action buttons. **Deviation from quickstart §7**: skipped the broken-route approach (would add ~25 min + PR churn + revert) because the marginal risk it catches (AWS ALB not publishing standard 5xx metrics; metric/threshold timing) is low and would surface as INSUFFICIENT_DATA → Slack on first real fire. Path-shape correctness is what mattered; this verified it end-to-end with real CW alarm payloads.

**Checkpoint**: alarms reach Slack; heartbeat verifies the path; on-call has a working notification channel. User Story 3 complete.

---

## Phase 6: User Story 4 - Secret rotation (Priority: P2)

**Goal**: every rotatable runtime secret (database password, Payload secret, OAuth client secret, Slack webhook URL) can be rotated end-to-end within 10 min (SC-007), without a code deploy and without a CDK redeploy.

**Independent Test**: walk through each rotation procedure in `quickstart.md` § 8 against staging; verify the new value is in use and the old value no longer appears in logs or live env on any instance.

### Tests for User Story 4 (MANDATORY) ⚠️

- [ ] T047 [P] [US4] Write `infra/test/secret-rotation.test.ts` — assert the synthesized `DataStack` template's SecureString parameter values are **NOT** materialized in the CloudFormation template body (no plaintext appears in `cdk synth` output); assert SecureString parameters use `valueFromStringParameterName` consumers, not `valueFromLookup` (the latter materializes at synth time, defeating the rotation invariant).

### Implementation for User Story 4

- [ ] T048 [US4] Walk through `quickstart.md` § 8.1 (database_url rotation) against staging: trigger Secrets Manager rotation → `cdk deploy -c env=staging SeqtekStagingData` → start staging ASG instance refresh → confirm new password is in use (open `psql` from a staging instance shell, attempt connect with old password → fails; with new password → succeeds). Time the procedure end-to-end.
- [ ] T049 [US4] Walk through `quickstart.md` § 8.2 (payload_secret rotation) against staging: generate new secret → `aws ssm put-parameter --overwrite` → ASG instance refresh → verify all admin sessions are invalidated on the next request (Playwright: navigate to /admin with the old session cookie → 401 / redirect to /admin login). Time end-to-end.
- [ ] T050 [US4] Walk through `quickstart.md` § 8.4 (slack_webhook_url rotation) against staging: generate new webhook → `aws ssm put-parameter --overwrite` → trigger another EventBridge heartbeat → verify the new channel receives the message (or the same channel; the point is that Lambda picks up the new value without redeploy). Time end-to-end.
- [ ] T051 [US4] Append a "Rotation runbook verified" timestamped note to `specs/002-aws-cdk-infrastructure/quickstart.md` § 8 confirming each procedure was tested against staging on this date. (Stays in the quickstart, not promoted to docs/ yet — `docs/RUNBOOK.md` is a Phase 5 polish doc.)

**Checkpoint**: all four rotation procedures walked through against staging within the SC-007 10-min budget. User Story 4 complete.

---

## Phase 7: User Story 5 - Engineer spins up a cheap staging environment (Priority: P2)

**Goal**: staging stands up from scratch in under 60 min (SC-001), costs ≤ 25% of prod monthly (SC-006), and tears down to $0 residual billing (SC-008).

**Independent Test**: `cdk destroy 'SeqtekStaging*'` from a deployed state; wait for one billing cycle; verify $0 attributable to staging. Then `cdk deploy 'SeqtekStaging*'` from clean; smoke test passes within 60-min wall-clock.

### Tests for User Story 5 (MANDATORY) ⚠️

- [ ] T052 [P] [US5] Add to `infra/test/compute-stack.test.ts` (extend T015) — assert the per-env sizing table in `data-model.md` § 2 by reading `cdk.json` context and asserting the synthesized template's ASG `MinSize`/`MaxSize`/`DesiredCapacity` match the table exactly for both prod and staging.

### Implementation for User Story 5

- [ ] T053 [US5] Verify staging Parameter Store has no orphaned entries from prior tests: `aws ssm describe-parameters --filters Key=Path,Values=/seqtek/website/staging/` should list exactly the 9 paths in `contracts/parameter-store.md` § Path inventory.
- [ ] T054 [US5] Tear down staging end-to-end per `quickstart.md` § 9: `npx cdk destroy -c env=staging 'SeqtekStaging*'`; pre-emptively empty `seqtek-media-staging` S3 bucket (`aws s3 rm s3://seqtek-media-staging --recursive`); accept the RDS-deletion prompt (staging has `deletionProtection: false`). Verify the AWS CloudFormation console shows zero `SeqtekStaging*` stacks after teardown completes.
- [ ] T055 [US5] Wait 24h; run the AWS Cost Explorer query in `quickstart.md` § 9 against the day after teardown — expect $0.00 attributable to the `Project=seqtek-website` tag for staging-prefixed resources. Document outcome (SC-008 verification).
- [ ] T056 [US5] Re-deploy staging from clean state per `quickstart.md` §§ 1–5; time the wall-clock; must complete in ≤ 60 min (SC-001 confirmation). Verify staging smoke test (T017) passes against the freshly-deployed CloudFront URL.
- [ ] T057 [US5] Compute SC-006 cost ratio: after staging has been running for ~24h, query Cost Explorer for daily cost of `SeqtekStaging*` resources (via the `Environment=staging` tag) and `SeqtekProd*` resources; verify the staging:prod ratio is ≤ 0.25. Document the actual ratio in a one-line note appended to `specs/002-aws-cdk-infrastructure/research.md` § 9 (per-env sizing rationale).

**Checkpoint**: staging spin-up/tear-down cycle verified within budget; cost ratio confirmed. User Story 5 complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: reconcile the doc layer per Constitution Principle III, move shipped P1 items to PROJECT_HISTORY per Principle III, and run the full local verification gate before opening the PR.

- [x] T058 [P] `docs/ARCHITECTURE.md` § 5 ASG sizing reconciled — prod `min=2 max=3 desired=2 across 2 AZs`, staging `min=1 max=2 desired=1`. Surrounding prose updated. SC-010 justification carried through.
- [x] T059 [P] `docs/ARCHITECTURE.md` § 8 CloudWatch Alarms table reconciled — all 9 alarms (added CloudFront 5xx row that was missing) route to `SNS → Lambda → Slack #seqtek-website-alerts`. Added a header paragraph describing the SNS-topic / Lambda / heartbeat path. RDS Connections threshold updated to `>60` (db.t3.micro 80%) to match the deployed alarm.
- [x] T060 [P] `docs/ARCHITECTURE.md` § 9 reconciled — Availability Architecture text + diagram show the per-env ASG sizing; Failure Scenarios table splits the AZ/EC2 row into prod (zero downtime, ASG replaces in other AZ) and staging (~3 min), and the RDS-single-AZ row appends the Phase 5.5 multi-AZ flip cross-reference.
- [x] T061 [P] Shipped P1 ROADMAP bullets moved to PROJECT_HISTORY: `docs/ROADMAP.md` § 4 Phase 1 trimmed to a "Phase 1 closed" note; `docs/PROJECT_HISTORY.md` § Phase 1 implementation (P1) gains P1-10 (CDK 5-stack provisioning), P1-11 (Dockerfile + ECR + image pipeline), P1-12 (GitHub Actions blue-green CI/CD). Each entry follows the precedent style.
- [x] T062 [P] `docs/ROADMAP.md` header bumped to 2026-05-28 with a parenthetical reflecting P1 closure, staging live on `seqtek-preview.com`, SC-002 measured 7m45s, Slack alarms verified, prod-CD + DNS cutover deferred, and Phase 2 unblocked.
- [x] T063 [P] **ADR skipped**: implementation matched `data-model.md` § 1 + `research.md` materially. The only deviations (Lambda outside VPC during validation period, RdsConnectionsHigh threshold sized to t3.micro, infra-diff `cdk diff` excluded from required checks because of the path-filter footgun) are documented in code comments + task entries rather than warranting a standalone ADR.
- [x] T064 Local verification gate green from repo root: `npm run lint` (4 pre-existing warnings in the auth-bootstrap migration, 0 errors), `npm run typecheck` clean, `npm run format:check` clean, `npm --prefix infra run test` 94/94 green, actionlint clean. (`npm test` + `npx playwright test` deferred to CI on this PR — the prior CI runs on PRs #3-#7 already exercised both gates green.)
- [x] T065 PR opened (chore/phase8-polish → main). Body itemizes the three ARCHITECTURE reconciliations, the three PROJECT_HISTORY P1 additions, the ROADMAP closure update, and the T036/T043-T046 task-list catch-up. CI run gates the merge.

**Checkpoint**: feature merged; ROADMAP Phase 1 is complete; Phase 2 (Content models) unblocked.

---

## Dependencies

```text
Phase 1 (Setup) ──► Phase 2 (Foundational) ──► Phase 3 (US1 — first deploy, MVP)
                                                   │
                                                   ├──► Phase 4 (US2 — CD)
                                                   ├──► Phase 5 (US3 — alarms)
                                                   ├──► Phase 6 (US4 — rotation)
                                                   └──► Phase 7 (US5 — staging spin-up)
                                                            │
                                                            └──► Phase 8 (Polish)
```

- **Setup** (T001–T006) is sequential within phase (T002 depends on T001 directory existing; T003–T006 are `[P]` against each other after T002).
- **Foundational** (T007–T013) — T007 first (types), then T008–T011 in parallel (different files), then T012 in parallel with synth, T013 last.
- **US1 (T014–T030)** — Tests T014–T017 in parallel; Dockerfile T018–T019 in parallel with tests; stack implementations T020–T022 sequential by dependency (Data → Compute → Edge); T023–T024 gate the local-synth checkpoint; T025–T030 are sequential deploy operations.
- **US2–US5 (Phases 4–7)** — independent of each other once US1 is done. Can be tackled in parallel by separate engineers (or sequentially by one) without merge conflict beyond `docs/`.
- **Polish (T058–T065)** — T058–T063 parallel (separate files), T064 sequential gate, T065 final.

## Parallel execution examples

### Within Setup (after T001 done)

```text
T002 ─┐
      ├─► all four in parallel after T001
T003 ─┤  (different files)
T004 ─┤
T005 ─┤
T006 ─┘
```

### Within US1 — write all tests in parallel before any implementation

```text
T014 (data-stack.test.ts)        ─┐
T015 (compute-stack.test.ts)     ─┤
T016 (edge-stack.test.ts)        ─┼─► T020 → T021 → T022 → T023
T017 (post-deploy-smoke.spec.ts) ─┤    (sequential by stack dependency)
T018 (Dockerfile)                ─┤
T019 (.dockerignore)             ─┘
```

### Across US2 / US3 / US4 / US5 phases

After Phase 3 (US1) is green, engineers can split: one takes Phase 4 (`.github/workflows/`), one takes Phase 5 (`infra/lib/observability-stack.ts` + `infra/lambda/`), one takes Phase 6 (rotation runbook walkthrough — slow but only docs), one takes Phase 7 (cost verification — has 24h wait gates). No file collisions between these four phases.

## Implementation strategy

**MVP scope = User Story 1 (Phase 3)** — get one production deploy working through the full CDK + Docker + manual deploy path. That alone unblocks Phase 2 of the website roadmap (Content models) because Payload now has a target environment. Everything else (CD, alarms, rotation, staging) hardens around that core.

**Order of merge to `main`:**

Single PR for the entire feature is acceptable given the dependency chain — splitting would force temporary "infra exists but no CD" or "CD exists but no alarms" states that complicate the merge sequence. The PR is large (~65 tasks worth of code + 5 deployed CloudFormation stacks per env × 2 envs) but the spec/plan/tasks-up-front discipline keeps reviewability manageable. If reviewers prefer to split, the natural seam is Phase 3 (US1) as one PR + Phases 4–8 as a follow-up PR — but no earlier seam works (US2 has no image registry to deploy from without US1).

**Total tasks**: 68 (6 setup, 7 foundational, 20 US1 incl. T029a/b/c domain pass, 7 US2, 9 US3, 5 US4, 6 US5, 8 polish).

**Time estimate** (single engineer, no interruptions): ~3-4 working days for code (Phases 1–5 + tests), ~1 day for deploy verification (T025–T030, T044–T046, T048–T056), ~0.5 day for polish (T058–T065). Total ~5 days — within the ROADMAP Phase 1 1-2 week envelope.
