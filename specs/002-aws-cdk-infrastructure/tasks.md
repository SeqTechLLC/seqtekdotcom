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

- [ ] T014 [P] [US1] Write `infra/test/data-stack.test.ts` — assert: RDS Postgres in IsolatedSubnet (no internet route), `backupRetention >= 7d`, `deletionProtection: true` on prod / `false` on staging, `storageType: gp3`, `allocatedStorage >= 20`; S3 media bucket has `BlockPublicAccess: ALL`, `Versioning: ENABLED`, `ObjectOwnership: BUCKET_OWNER_ENFORCED`, encryption enabled; every SecureString Parameter under `/seqtek/website/{env}/` listed in `contracts/parameter-store.md` exists in the synthesized template.
- [ ] T015 [P] [US1] Write `infra/test/compute-stack.test.ts` — assert: ECR repo has lifecycle rule "keep 10 tagged + 7d untagged"; ALB Listener:443 has TLS 1.2+ policy; ALB Listener:80 redirects to 443; ApplicationTargetGroup `DeregistrationDelay: 120s`, `HealthCheck: /api/health, interval 30s, healthyThreshold 3, unhealthyThreshold 2`; ASG `MinHealthyPercentage: 100`, `InstanceWarmup: 180s`; prod stack has `MinCapacity: 2, DesiredCapacity: 2, MaxCapacity: 3`; staging has `MinCapacity: 1, DesiredCapacity: 1, MaxCapacity: 2`; LaunchTemplate `MetadataOptions.HttpPutResponseHopLimit: 2` and `HttpTokens: required`; CloudWatch LogGroups for app + ALB access have `RetentionInDays` matching `cfg.logRetentionDays` (90 prod / 14 staging) per FR-023.
- [ ] T016 [P] [US1] Write `infra/test/edge-stack.test.ts` — assert: ACM cert in `us-east-1`; CloudFront `PriceClass: PRICE_CLASS_100`; `OriginAccessControl` attached to the S3 media origin; default behavior `ViewerProtocolPolicy: REDIRECT_TO_HTTPS`; additional behaviors exist for `/admin/*` (no cache), `/api/*` (no cache), `/_next/static/*` (CachingOptimized), `/media/*` (MediaOrigin); error response `403 → 404` for missing media; S3 bucket policy contains `AWS:SourceArn` condition pinned to this distribution's ARN.
- [ ] T017 [P] [US1] Write `tests/e2e/post-deploy-smoke.e2e.spec.ts` (Playwright; env-driven base URL `POST_DEPLOY_URL`) — assert: `GET /api/health` returns 200 with `{ status: "ok", db: "ok" }`; `GET /admin` returns 200 and the page contains the spec-001 "Sign in with Google" CTA; `GET /` returns 200. Test is skipped locally unless `POST_DEPLOY_URL` is set.

### Implementation for User Story 1

- [ ] T018 [P] [US1] Productionize `Dockerfile` at repo root: remove the `yarn.lock` / `pnpm-lock.yaml` branches in the `deps` and `builder` stages (npm-only); add `HEALTHCHECK CMD wget -q -O- http://localhost:3000/api/health || exit 1`; verify the existing `output: 'standalone'` flow + non-root `nextjs` user still applies; do **not** copy `.git`, `.env*`, `specs/`, `docs/`, `infra/`, or `tests/` into the image. Rebuild locally with `docker build .` and verify image size ≤ 350 MB (D-13 spike baseline was 327 MB).
- [ ] T019 [P] [US1] Create `.dockerignore` at repo root listing: `node_modules`, `.next`, `.git`, `.github`, `.specify`, `.husky`, `specs/`, `docs/`, `infra/`, `tests/`, `playwright-report/`, `playwright/.cache`, `test-results/`, `coverage/`, `*.md`, `.env*` (gitignored already but belt-and-suspenders). Verify by rebuilding with `docker build .` and checking the image filesystem contains none of these.
- [ ] T020 [US1] Implement `infra/lib/data-stack.ts` — `DatabaseInstance` (Postgres 16, `db.t3.small`, `multiAz: cfg.rdsMultiAz`, gp3 50GB / 3000 IOPS, 7d backups, `deletionProtection` per env, master password via `Credentials.fromGeneratedSecret` mirrored to Parameter Store SecureString); `Bucket` `seqtek-media-{env}` with the OAC-ready policy stubbed (final policy attached in `EdgeStack` to avoid circular ref); Parameter Store entries for `database_url` (built from RDS endpoint + generated secret), `payload_secret` (generated random), `revalidation_secret` (generated random), `s3_bucket`, `s3_bucket_hostname`. Outputs: DB endpoint, bucket name, bucket regional domain.
- [ ] T021 [US1] Implement `infra/lib/compute-stack.ts` — `Repository: seqtek-website` with lifecycle (keep 10 tagged + 7d untagged); `ApplicationLoadBalancer` in public subnets with `AlbSg`; `ApplicationListener` 443 (TLS 1.2+, requires cert from edge — handle via deferred attach pattern), `ApplicationListener` 80 (redirect to 443); `ApplicationTargetGroup` (port 3000, health check `/api/health`, dereg delay 120s); `LaunchTemplate` (Amazon Linux 2023 latest via `MachineImage.latestAmazonLinux2023()`, instance type derived from `cfg.instanceClass`+`cfg.instanceSize`, user data installs Docker + CW Agent + pulls ECR image + reads Parameter Store via instance profile + `docker run --restart=unless-stopped`). **Validation-period topology**: `AutoScalingGroup` placed in **public** subnets with `associatePublicIpAddress: true` (per Clarifications Session 2026-05-26); App SG ingress 3000 from AlbSG only is the sole inbound path — same end-user exposure as the private-subnet design. Phase 5.5 flips subnet placement to `PRIVATE_WITH_EGRESS`. `MinHealthyPercentage: 100`, instance warmup 180s, per-env capacities from `cfg`. IAM `AppInstanceRole` with the ARN-scoped policies in `data-model.md` § 3. Outputs: ECR URI, ASG name, ALB DNS, ALB hosted-zone ID.
- [ ] T022 [US1] Implement `infra/lib/edge-stack.ts` — `Certificate` in us-east-1 with DNS validation when `cfg.hostedZoneId` is set, else accept `cfg.certificateArn` import; `OriginAccessControl` (SigV4, S3); `Distribution` per `data-model.md` § 1 (ALB origin + Media S3 origin + per-path behaviors + error response 403→404); when `cfg.hostedZoneId` is set, add `ARecord` (apex + www) as `AliasTarget` to the distribution; **after** distribution creation, update the data-stack's bucket policy with the `AWS:SourceArn` condition pinned to this distribution's ARN (use `Bucket.addToResourcePolicy` from a cross-stack ref); attach the cert to the compute stack's HTTPS listener (cross-stack ref). Output: CloudFront distribution domain, distribution ID.
- [ ] T023 [US1] Wire cross-stack refs in `infra/bin/app.ts`: `NetworkStack` → exports VPC/SGs → consumed by `Data`/`Compute`/`Edge`/`Observability`; `DataStack` → exports DB endpoint, bucket, Parameter Store paths → consumed by `Compute`/`Edge`; `ComputeStack` → exports ALB → consumed by `Edge`. All cross-stack refs use `Fn.importValue` / CDK's automatic export wiring (not `valueFromLookup`). Run `npm --prefix infra run synth -c env=staging --quiet` — must complete with zero warnings.
- [ ] T024 [US1] Run all CDK assertion tests in `infra/test/`: `npm --prefix infra run test`. All of T010, T012, T014, T015, T016 must be green. Iterate on stack implementations until clean.
- [ ] T025 [US1] One-time AWS account bootstrap (per `quickstart.md` § 1): authenticate AWS CLI; `npx cdk bootstrap aws://<account>/us-east-1`; `npx cdk deploy -c env=prod SeqtekProdNetwork`; verify the `OpenIdConnectProvider` ARN in IAM console; record OIDC provider ARN + deploy role ARNs in a private note (account-specific; not committed).
- [ ] T026 [US1] Seed staging Parameter Store manual paths per `quickstart.md` § 2: create OAuth client in Google Cloud Console (separate from prod's; redirect URI uses staging CloudFront default until DNS exists); `aws ssm put-parameter` for `google_client_id`, `google_client_secret`, `slack_webhook_url` under `/seqtek/website/staging/...`. Verify with `aws ssm get-parameters-by-path`.
- [ ] T027 [US1] Deploy the full staging stack set: `npx cdk deploy -c env=staging 'SeqtekStaging*'`. Expected wall-clock ~25 min (RDS provisioning dominant). Capture and address any synth-time warnings; capture deploy outputs (CloudFront domain, ECR URI, ALB DNS) in the run log.
- [ ] T028 [US1] Build and push the first container image: `docker build -t <ecr-uri>:bootstrap-$(git rev-parse --short HEAD) .`; `aws ecr get-login-password | docker login ...`; `docker push <ecr-uri>:bootstrap-...`; tag also as `:latest`. Then trigger an ASG instance refresh manually so new instances pick up the image: `aws autoscaling start-instance-refresh --auto-scaling-group-name <staging-asg-name> --preferences MinHealthyPercentage=100,InstanceWarmup=180`. Wait for completion (poll `describe-instance-refreshes`).
- [ ] T029 [US1] Run the post-deploy smoke from T017 against the staging CloudFront URL: `POST_DEPLOY_URL=https://<cf-domain> npx playwright test tests/e2e/post-deploy-smoke.e2e.spec.ts`. All three assertions (`/api/health`, `/admin`, `/`) must pass. If `/admin` fails because the staging Google OAuth client redirect URI isn't set, update the OAuth client in Google Cloud Console with the now-known staging URL and retry — document this as a known one-time bootstrap step in quickstart §2.
- [ ] T029a [US1] **Register `seqtek-preview.com` in Route 53** (per Clarifications Session 2026-05-25): use `aws route53domains register-domain --domain-name seqtek-preview.com --duration-in-years 1 --auto-renew --admin-contact ... --registrant-contact ... --tech-contact ...` (contact details captured out-of-band; .com TLD takes 5-15 min to propagate). Route 53 auto-creates a public hosted zone on registration — capture the hosted zone ID via `aws route53 list-hosted-zones-by-name --dns-name seqtek-preview.com`. Verify the registration with `aws route53domains get-domain-detail --domain-name seqtek-preview.com` returning `Status: ok`.
- [ ] T029b [US1] **Wire the staging domain into CDK**: update `infra/cdk.json` staging env config — set `domainName: "seqtek-preview.com"`, `hostedZoneId: "<Z... from T029a>"`, leave `certificateArn: null` (CDK provisions via DNS validation in the now-imported hosted zone). Commit the cdk.json change. Re-synth: `npm --prefix infra run synth -c env=staging`. Re-deploy only the edge stack: `npx cdk deploy -c env=staging SeqtekStagingEdge`. ACM cert provisions via DNS validation (~5-15 min — CDK creates the TXT records in the hosted zone automatically). CloudFront distribution adds the `seqtek-preview.com` alias; Route 53 A-record alias points apex + www to the distribution.
- [ ] T029c [US1] **Verify staging on the vanity URL**: `curl -I https://seqtek-preview.com/api/health` returns 200; SSL cert is the new ACM-issued one for `seqtek-preview.com` (not the CloudFront default cert); `/admin` reaches the SSO entry. **Update the staging Google OAuth client** in Google Cloud Console: add `https://seqtek-preview.com/api/auth/oauth/callback/google` to the authorized redirect URIs (keep the CloudFront-default URI temporarily as backup; remove once the vanity URL is verified end-to-end). Re-run the Playwright smoke (T017) with `POST_DEPLOY_URL=https://seqtek-preview.com` — all three assertions green.
- [ ] T030 [US1] Repeat T025–T029 for production: `cdk deploy -c env=prod SeqtekProdNetwork` (if not done) → `cdk deploy -c env=prod 'SeqtekProd*'` → seed prod Parameter Store paths → push image → instance refresh → run post-deploy smoke against the prod CloudFront URL. **Prod stays on the CloudFront-generated default URL until Phase 6 DNS cutover** — no domain task analog to T029a/b/c in this feature; `cfg.domainName` stays `null` for prod. **This is the gate for SC-001 (≤60 min wall-clock for first deploy, excluding the optional T029a-c domain pass)** — time the procedure.

**Checkpoint**: SeqtekStaging* and SeqtekProd* both deployed. Staging serves on `https://seqtek-preview.com` (leadership-preview URL, per Clarifications Session 2026-05-25); prod serves on its CloudFront-default URL pending Phase 6 DNS cutover. `/admin` reaches the spec-001 SSO entry on both. T017 smoke test green against both environments. User Story 1 complete.

---

## Phase 4: User Story 2 - Continuous delivery (Priority: P1)

**Goal**: a merge to `main` deploys the new container image to production within 20 min (SC-002), without human action, with zero customer-facing 5xx caused by the deploy itself (SC-003), and infra-touching PRs receive a `cdk diff` comment within 5 min of CI starting (SC-004).

**Independent Test**: open a PR with a trivial infra change (comment in cdk.json) — verify the diff comment appears. Push a deliberately broken image to staging — verify the deploy fails and the previous image keeps serving.

### Tests for User Story 2 (MANDATORY) ⚠️

- [ ] T031 [P] [US2] Add `actionlint` as a `pip install` step (or use `rhysd/actionlint@v1` Action) in a new `lint-workflows` job in `.github/workflows/ci.yml`, running on every PR. The job lints all `.github/workflows/*.yml` and fails CI on syntax errors. Gates merge.

### Implementation for User Story 2

- [ ] T032 [US2] Extend `.github/workflows/ci.yml` `quality` job: add `npm --prefix infra ci && npm --prefix infra run synth -c env=staging --quiet && npm --prefix infra run synth -c env=prod --quiet && npm --prefix infra run test`. Confirms CDK code synthesizes and assertions pass on every PR. No `id-token: write` permission — synth runs from committed code only.
- [ ] T033 [P] [US2] Create `.github/workflows/infra-diff.yml` per `contracts/github-workflows.md` § `infra-diff.yml`: trigger on PR with `paths:` filter for `infra/**`, `Dockerfile`, `.dockerignore`, `.github/workflows/deploy.yml`, `.github/workflows/infra-diff.yml`; permissions `id-token: write` + `pull-requests: write`; assume `SeqtekStagingDeploy` via `aws-actions/configure-aws-credentials@v4`; run `cdk diff -c env=prod 'SeqtekProd*'` and `cdk diff -c env=staging 'SeqtekStaging*'`; post combined diff as a single PR comment via `actions/github-script`, updated in-place on subsequent pushes; truncate with workflow-run link if >60k chars.
- [ ] T034 [P] [US2] Create `.github/workflows/deploy.yml` per `contracts/github-workflows.md` § `deploy.yml`: trigger on `push` to `main` + `workflow_dispatch` with `stack-filter` input; permissions `id-token: write`; concurrency group `deploy-prod` with `cancel-in-progress: false`; steps = checkout → assume `SeqtekProdDeploy` → ECR login → `docker buildx build --platform linux/amd64 --tag <ecr>:<sha> --tag <ecr>:latest .` → `docker push --all-tags` → `cdk deploy -c env=prod 'SeqtekProd*Compute' --require-approval never` → poll `describe-instance-refreshes` until terminal → run smoke (`POST_DEPLOY_URL=https://seqtek.com npx playwright test tests/e2e/post-deploy-smoke.e2e.spec.ts`).
- [ ] T035 [US2] Configure GitHub Environments per `quickstart.md` § 3: create `production` environment with required reviewers (initial: Kenn); create `staging` environment without required reviewers; bind `deploy.yml`'s `workflow_dispatch` path for non-`*Compute` stack filters to the `production` environment (use `environment: production` on the deploy job conditioned on `inputs.stack-filter != 'SeqtekProd*Compute'`).
- [ ] T036 [US2] End-to-end CD test (real PR): on a branch, make a trivial infra change (add a comment line in `infra/cdk.json`) + push + open PR. Verify within 5 min: `infra-diff` workflow runs, posts a comment listing "no changes" (cdk diff is whitespace-insensitive in CDK 2.x — if it falsely reports changes, document). Verify within 30 min that CI gates green per SC-009. Then merge the PR and trigger a follow-up `workflow_dispatch` run of `deploy.yml` against prod (so the full image-rebuild path is exercised, since the comment-only change doesn't naturally rebuild the image); record wall-clock from `workflow_dispatch` trigger to "instance refresh complete + smoke green" — must be ≤ 20 min per SC-002.
- [ ] T037 [US2] End-to-end rollback test (real PR on staging): on a branch, push a deliberately broken Dockerfile change (e.g., `CMD ["false"]` as the entrypoint); merge to `main`. Observe the `deploy.yml` run: ECR push succeeds → ASG instance refresh starts → new instance fails health check → instance refresh aborts → previous image continues serving. Verify staging `/api/health` returns 200 throughout (no customer-facing 5xx). Revert the broken change in a follow-up PR.

**Checkpoint**: routine merges to `main` deploy automatically; infra-touching PRs get a diff comment; failed deploys roll back cleanly. User Story 2 complete.

---

## Phase 5: User Story 3 - On-call engineer is paged when something is wrong (Priority: P1)

**Goal**: when production produces a 5xx surge, an unhealthy host, RDS storage pressure, or a CloudFront error spike, the on-call engineer gets a Slack message within 5 min (SC-005) with enough context to triage.

**Independent Test**: deploy SeqtekStagingObservability; trigger manual EventBridge heartbeat → Slack message visible. Simulate one ALB 5xx alarm in staging → 🚨 message in #seqtek-website-alerts within 5 min.

### Tests for User Story 3 (MANDATORY) ⚠️

- [ ] T038 [P] [US3] Write `infra/test/slack-lambda.test.ts` per `contracts/alarm-payload.md` § 6: import `formatAlarmBlocks` from `infra/lambda/slack-notifier/index.ts`; assert correct Block Kit output for fixtures `alarm-fired.json`, `alarm-recovered.json`, `alarm-insufficient-data.json`, `heartbeat.json`. Fixtures live in `infra/lambda/slack-notifier/__fixtures__/`. Test uses Vitest only — no AWS SDK calls, no network.
- [ ] T039 [P] [US3] Write `infra/test/observability-stack.test.ts` — assert exactly 8 alarms exist per `data-model.md` § 1 (AlbFiveXx, AlbUnhealthyHost, Ec2CpuHigh, Ec2MemoryHigh, Ec2DiskHigh, RdsCpuHigh, RdsFreeStorageLow, RdsConnectionsHigh, CloudFrontErrorRate — 9 actually; correct any drift); SNS topic has encryption enabled; the SlackNotifier Lambda is in private subnet with `LambdaSg`; EventBridge heartbeat rule fires every 6h.

### Implementation for User Story 3

- [ ] T040 [P] [US3] Implement `infra/lambda/slack-notifier/index.ts` per `contracts/alarm-payload.md` § 3: `handler(event: SNSEvent)`; pure-function `formatAlarmBlocks(alarm)` returning Block Kit blocks for ALARM/OK/INSUFFICIENT_DATA/HEARTBEAT states; cached webhook URL via `SSMClient.GetParameterCommand` (per-warm-instance cache); `await fetch(webhookUrl, …)` POST; throw on Slack non-2xx response.
- [ ] T041 [P] [US3] Create `infra/lambda/slack-notifier/package.json` (peer dep `@aws-sdk/client-ssm`, `aws-lambda` types as devDep) + `infra/lambda/slack-notifier/tsconfig.json` (target node20). esbuild bundling is handled by CDK's `NodejsFunction` construct, no separate build step.
- [ ] T042 [US3] Implement `infra/lib/observability-stack.ts` — `Topic: AlarmTopic` (encryption-at-rest enabled); `NodejsFunction: SlackNotifier` (in private subnet, `LambdaSg`, env var `WEBHOOK_PARAMETER_PATH=/seqtek/website/{env}/slack_webhook_url`, IAM role per `data-model.md` § 3 — SSM GetParameter scoped to the webhook path + VPC ENI managed policy); SNS subscription `AlarmTopic → SlackNotifier`; 9 `Alarm` constructs per ARCHITECTURE.md §8 with the thresholds in `data-model.md` § 1, each `.addAlarmAction(new SnsAction(topic))`; `EventBridge.Rule` schedule every 6h → puts events to `AlarmTopic` with the HEARTBEAT shape per `contracts/alarm-payload.md` § 5.
- [ ] T043 [US3] Slack channel provisioning (out-of-band, Kenn): create `#seqtek-website-alerts` Slack channel; create an incoming webhook via Slack workspace settings; copy the webhook URL into `aws ssm put-parameter --name /seqtek/website/{prod,staging}/slack_webhook_url --type SecureString --value '...'` for both envs. Verify with `aws ssm get-parameter --name … --with-decryption`.
- [ ] T044 [US3] Deploy `SeqtekStagingObservability` and `SeqtekProdObservability` (the latter via `workflow_dispatch` against `deploy.yml` with stack-filter `SeqtekProd*Observability`, gated by the `production` GitHub Environment approval).
- [ ] T045 [US3] Heartbeat smoke test: `aws events put-events --entries 'Source=manual-test,DetailType=Heartbeat,Detail={}'` (or wait up to 6h for the scheduled rule). Verify the gray ⚙️ heartbeat message arrives in `#seqtek-website-alerts` within ~30 seconds. If it doesn't: check `/aws/lambda/SeqtekStagingObservability-SlackNotifier*` log group for errors.
- [ ] T046 [US3] Alarm simulation per `quickstart.md` § 7 (staging only): temporarily deploy a route that returns 500 (`src/app/(frontend)/__alarm-test/route.ts`); hit it 10 times in 5 min; verify the 🚨 AlbFiveXx Slack message arrives within 5 min; revert the alarm-test route immediately in a follow-up commit. Document outcomes in a comment on the SC-005 verification log (or `docs/RUNBOOK.md` if it exists by then).

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

- [ ] T058 [P] Reconcile `docs/ARCHITECTURE.md` § 5 ASG sizing: change "min=1, max=2, desired=1" to "min=2, max=3, desired=2 across 2 AZs (production); min=1, max=2, desired=1 (staging)" and update the surrounding prose. Justification: SC-010 99.9% SLA requires AZ-fault tolerance — see `specs/002-aws-cdk-infrastructure/research.md` § 3.
- [ ] T059 [P] Reconcile `docs/ARCHITECTURE.md` § 8 CloudWatch Alarms table: replace every "SNS → email notification" / "SNS → evaluate ..." action with "SNS → Lambda → Slack `#seqtek-website-alerts`". Update prose if it references email.
- [ ] T060 [P] Reconcile `docs/ARCHITECTURE.md` § 9 Failure Scenarios table: AZ-failure row change to "ASG replaces instance automatically; prod's desired=2 across 2 AZs keeps one instance serving throughout (~3 min recovery to capacity)"; RDS-single-AZ row keep the ~15-30 min note + append "Phase 5.5 launch-readiness review flips RDS to multi-AZ per spec 002 Clarifications Q2".
- [ ] T061 [P] Move shipped P1 ROADMAP bullets to PROJECT_HISTORY: from `docs/ROADMAP.md` § 4 Phase 1, **remove** the three bullets (CDK app; Dockerfile + ECR; GitHub Actions CI/CD blue-green) and **add** three new rows to `docs/PROJECT_HISTORY.md` § Phase 1 implementation (P1) as `P1-10` (CDK provisioning), `P1-11` (Dockerfile + ECR + image pipeline), `P1-12` (GitHub Actions blue-green CI/CD). Each entry follows the precedent style of P1-1 through P1-9.
- [ ] T062 [P] Update `docs/ROADMAP.md` header: bump "Last updated" date; rewrite the parenthetical to reflect P1 closure (all Phase 1 items now in PROJECT_HISTORY; next phase is Phase 2 — Content models).
- [ ] T063 [P] Optional ADR `docs/decisions/0004-cdk-stack-split.md` — only create if an implementation-time decision diverged materially from `data-model.md` § 1 (e.g., the ECR-shared-across-envs pattern, the inline-Slack-Lambda choice, the OIDC role split). Skip if the implementation matched the plan exactly. Follow `docs/decisions/README.md` for the ADR template.
- [ ] T064 Run the full local verification gate from repo root: `npm run lint && npm run typecheck && npm run format:check && npm --prefix infra run test && npm test && npx playwright test --grep-invert post-deploy-smoke`. All green. Then `npx playwright test tests/e2e/post-deploy-smoke.e2e.spec.ts` against prod (`POST_DEPLOY_URL=https://seqtek.com` if DNS is cut, else the prod CloudFront default domain) — green.
- [ ] T065 Open PR `002-aws-cdk-infrastructure` → `main`. PR body cross-references spec/plan/tasks links and itemizes the three ARCHITECTURE.md reconciliations + three PROJECT_HISTORY additions. Confirm all CI jobs green (`quality` + `tests` + `infra-diff` + `gitleaks` + `lint-workflows`); confirm `cdk diff` PR comment shows the expected resource set.

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
