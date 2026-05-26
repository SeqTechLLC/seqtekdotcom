# Feature Specification: AWS CDK Infrastructure & Blue-Green CI/CD

**Feature Branch**: `002-aws-cdk-infrastructure`

**Created**: 2026-05-24

**Status**: Draft

**Input**: User description: "Phase 1 AWS infrastructure for SEQTEK company website, provisioned via AWS CDK (TypeScript). VPC, ALB, ASG, RDS Postgres, S3, ECR, CloudFront, Parameter Store, IAM, CloudWatch alarms; multi-stage Dockerfile + ECR push pipeline; GitHub Actions blue-green CI/CD. Non-goals: DNS cutover (Phase 6), CSP enforce flip (Phase 5), application-level features."

## Clarifications

### Session 2026-05-24

- Q: Deploy mechanism for "blue-green" → A: Single ASG with instance refresh, `MinHealthyPercentage: 100`, ALB health-check gate, deregistration delay. Zero downtime on the happy path; rollback is "trigger another instance refresh with the previous image tag" (~10 min). Two-ASG and CodeDeploy options rejected as overengineering for current scale; revisit if canary deploys or instant rollback become a requirement.
- Q: RDS multi-AZ for production → A: Single-AZ for the pre-launch and early-launch period to keep cost down; flip to multi-AZ before public launch (added as a Phase 5.5 launch-readiness item). Flip is a small CDK property change. The 99.9% SLA target (SC-010) is scoped to post-launch and implicitly requires the multi-AZ flip — AWS only SLAs single-AZ RDS at 99.5%.
- Q: Alarm notification destination → A: SNS topic → Slack incoming webhook. A dedicated `#seqtek-website-alerts` (or similarly named) Slack channel will be created by Kenn; the webhook secret lands in Parameter Store. SNS → Lambda → Slack is ~30 LOC; format includes alarm name, dimension, breached value, link to dashboard.

### Session 2026-05-25

- Q: Should staging get a vanity URL (vs running on the CloudFront-generated default domain) pre-launch? → A: **Yes** — leadership engagement on content production (BR-4 values, BR-5 stats, C-3 bios, etc.) is gated on having a tangible visible-to-them preview site (per `project_internal_dynamics.md`: "leadership historically resistant to internal investment; content is the real bottleneck"). Until they can compare-and-contrast against the current Wix site at a real URL, content won't flow. So staging gets a dedicated leadership-preview URL.
- Q: Which domain for the staging preview? → A: **`seqtek-preview.com`** (new registration, ~$13/yr). Registered in AWS Route 53 — the registration auto-creates a public hosted zone, which CDK then uses for ACM DNS validation and the A-record alias to CloudFront. Rejected alternatives: `preview.seqtechllc.com` (subdomain on existing Workspace domain) — Kenn does not have Workspace admin access at seqtechllc.com (admin lives at the managing-partner level), so subdomain-delegation required cross-org coordination we can avoid; `seqtek-rebuild.com` / `seqtek-staging.com` — viable but `-preview` is the clearest name for "this is the leadership-preview site, not the public one." Prod (`seqtek.com`) keeps `domainName: null` in CDK until Phase 6 DNS cutover — it serves on its CloudFront default URL pre-cutover and gets its own ACM cert provisioned then.

### Session 2026-05-26

- Q: For the pre-launch validation period, where do the EC2 application instances live in the VPC — private subnets with a NAT Gateway, private subnets with VPC endpoints, or public subnets with strictly-scoped Security Groups? → A: **Public subnets with strictly-scoped Security Groups**. App-instance SG accepts inbound only from the ALB's SG on port 3000; CloudFront managed prefix list is the only inbound source for the ALB. End-user-observable inbound exposure is identical to the private-subnet design (only the ALB reaches EC2). What changes: outbound traffic goes directly to the Internet Gateway instead of through a NAT Gateway, saving ~$32/mo per env. Trade-off accepted: defense-in-depth degrades from two layers (subnet + SG) to one (SG) — a single SG misconfiguration could expose the instance, whereas private-subnet placement would still keep it unreachable. Mitigation: SG changes flow through PR review with CDK assertion tests in `infra/test/iam-invariants.test.ts` and `network-stack.test.ts`. RDS stays in isolated subnets (no internet route) — non-negotiable. **This is the validation-period posture only**; flip back to private-subnets-with-NAT (or VPC endpoints) at Phase 5.5 launch readiness review, alongside the multi-AZ RDS flip. Both flips together: one CFN deploy, one operational change window.
- Q: Should staging be downsized to free-tier-eligible sizes during the validation period? → A: **Yes**. Staging is the leadership-preview environment; spec-shape sizing (t3.small × 1 + db.t3.small + 50GB) costs ~$63/mo pre-launch with no operational benefit during content production. Downsize to t3.micro (free tier covers 750hr/mo) + db.t3.micro single-AZ + 20GB storage (all free tier). Combined with the public-subnet decision above, validation-period staging runs at ~$20/mo (ALB + public IPv4 + Route 53 + small data transfer). Restore the spec-shape sizing in the same Phase 5.5 readiness change window. Prod stays undeployed until Phase 6 — `seqtek-preview.com` is the only customer-visible URL during pre-launch.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Engineer deploys the app to production for the first time (Priority: P1)

A SEQTEK engineer with AWS access checks out `main`, runs the project's deploy command, and ends up with the full production environment standing in their AWS account: networking, load balancer, app instances running the latest container image, managed Postgres, media bucket, content delivery in front of the load balancer, and an HTTPS endpoint that serves the live Next.js + Payload application. They never click in the AWS console to make this happen. The login URL for `/admin` works end-to-end through the same path real users will take.

**Why this priority**: This is the single deliverable that turns Phase 1 from "scaffold runs locally" into "scaffold runs in our cloud." Without it, every later phase (content models, core pages, polish) has no production target to ship to. Per ROADMAP §4 Phase 1, this is the last open item.

**Independent Test**: From a fresh AWS account (or after `cdk destroy` of a prior stack), run the documented deploy command. Within the published deploy budget, the script returns success and the published HTTPS URL serves the running application; `/admin` reaches the SSO entry screen; the health probe returns 200 with a successful DB ping.

**Acceptance Scenarios**:

1. **Given** an empty target AWS account with the documented prerequisites in place (CLI credentials, hosted-zone access where required), **When** the engineer runs the deploy command, **Then** the stack provisions successfully and the published URL serves the application over HTTPS within the deploy time budget.
2. **Given** a successful first deploy, **When** the engineer visits `/admin`, **Then** they reach the Google SSO entry screen (per spec 001) and can complete sign-in.
3. **Given** a successful first deploy, **When** the ALB health probe runs against `/api/health`, **Then** it returns 200 with `status: ok` and a successful DB ping.
4. **Given** a successful first deploy, **When** the engineer destroys the stack via the documented command, **Then** all billable resources tear down cleanly with no orphaned ENIs, EBS volumes, or unmanaged secrets.

---

### User Story 2 — Continuous delivery: merge to `main` deploys automatically (Priority: P1)

An engineer opens a PR that contains both app code and an infrastructure change. CI runs the test suite (already covered by P1-9) and additionally posts a clear summary of every infrastructure change the merge will cause, before any human approves. After review and merge, the same pipeline deploys to production without further human action, and the new container image is in service within a published time budget. If the new image fails its health checks, the previous image keeps serving traffic and the deploy is reported as failed.

**Why this priority**: Without automated delivery, every deploy becomes a person typing commands, which loses the trust and traceability the project's pre-launch readiness review (Phase 5.5) needs. Posting the infra diff on every PR is the safety mechanism that lets us trust the pipeline. This is also a constitutional check — "Spec Before Code" extends to "show me what's changing before I approve the change."

**Independent Test**: Open a PR that bumps the app's container image and adds one trivial infrastructure change (e.g., a new CloudWatch alarm threshold). Confirm the PR conversation receives a diff comment showing both. Merge the PR. Confirm the pipeline runs to completion, the new image is serving traffic within the time budget, and the previous image's instances are drained — without any console clicks. Then push a deliberately broken image. Confirm the deploy is rolled back, the previous image continues to serve, and the pipeline reports failure.

**Acceptance Scenarios**:

1. **Given** a PR that touches infrastructure code, **When** CI runs against the PR, **Then** a comment appears on the PR enumerating every resource that will be created, modified, replaced, or destroyed by the change.
2. **Given** a PR with no infrastructure changes, **When** CI runs, **Then** the diff comment either does not appear or explicitly says "no infrastructure changes," so reviewers can tell the difference between "no changes" and "the check did not run."
3. **Given** an approved PR is merged to `main`, **When** the deploy pipeline runs, **Then** the new container image becomes the in-service image with zero successful customer requests served a 5xx caused by the deploy itself.
4. **Given** a deploy whose new image fails its health checks, **When** the pipeline detects the failure, **Then** the previous image continues to serve traffic, the pipeline reports failure to the PR/commit, and no further automated rollback steps are needed by an engineer.
5. **Given** a deploy in flight, **When** an engineer needs to know the in-service image version, **Then** that information is observable from a single place (AWS console, dashboard, or pipeline output — chosen during planning), not stitched together from multiple sources.

---

### User Story 3 — On-call engineer is paged when something is wrong (Priority: P1)

An on-call engineer is not actively watching the system. Production starts returning 5xx errors at a meaningful rate (or RDS storage fills up, or the ASG can't keep instances healthy, or CloudFront's error rate spikes). The engineer receives a notification on the channel SEQTEK actually uses for ops alerts, with enough context in the alert to know which dimension of the system is unhealthy. The alert links to the relevant dashboard or log group.

**Why this priority**: Without alarms wired to a notification path, the alarms are silent CloudWatch metric watchers that nobody sees. Phase 5 launch readiness requires a working incident path. Wiring this in Phase 1 means we burn in the runbook against staging traffic before launch, not against real visitors after.

**Independent Test**: Simulate each alarm condition against staging (introduce a route that returns 500, fill a small test bucket, terminate an ASG instance without scale-in protection, etc.). Confirm each alarm fires within its evaluation window, the notification reaches the configured channel, and the alert text identifies the dimension and links to the relevant dashboard.

**Acceptance Scenarios**:

1. **Given** the load balancer is returning 5xx at a rate above the configured threshold, **When** the threshold is breached for the configured evaluation window, **Then** an alarm transitions to ALARM state and a notification is dispatched to the configured channel within the published latency budget.
2. **Given** RDS storage utilization crosses the warning threshold, **When** the alarm evaluates, **Then** an alarm fires before storage is exhausted (warning fires with enough lead time to add storage or shed data).
3. **Given** the ASG cannot maintain its desired count for the configured window, **When** the alarm evaluates, **Then** an alarm fires and identifies that the ASG (not the ALB or RDS) is the unhealthy dimension.
4. **Given** CloudFront's edge error rate spikes, **When** the alarm evaluates, **Then** an alarm fires and the alert text distinguishes a CloudFront-origin issue from an ALB-origin issue.
5. **Given** an alarm fires, **When** the on-call engineer opens the notification, **Then** the alert links to a dashboard or log group where they can start triaging, not just a metric graph in isolation.

---

### User Story 4 — Engineer rotates a runtime secret without redeploying code (Priority: P2)

An engineer needs to rotate a runtime secret (database password, Payload secret, OAuth client secret, or any future secret added in this same shape). They update the value in the configured secrets store, signal the application to pick up the new value (restart, re-pull, or the documented mechanism), and the application uses the new secret without a code change, without a CDK redeploy of infrastructure, and without the old value lingering in environment files or version control.

**Why this priority**: Secret rotation is a launch-readiness requirement. Doing it before Phase 5.5 means the rotation path is tested in low-stakes conditions. Lower than P1 because launch is not the same week and the OAuth-era admin path (spec 001) limits the blast radius if a non-secret-rotation deploy is needed urgently.

**Independent Test**: Update one secret in the configured store, signal the application, hit an endpoint that exercises the secret (a sign-in for the OAuth client secret; a DB-backed read for the database password), confirm the new value is in use and the old value no longer is. Repeat for each rotatable secret category.

**Acceptance Scenarios**:

1. **Given** a runtime secret has been updated in the configured store, **When** the application is signaled per the documented procedure, **Then** subsequent requests use the new value and a code search confirms the old value never appears in the repository or container image.
2. **Given** a rotation is in progress (old value still active on some instances, new value on others), **When** the rollout completes, **Then** all instances are using the new value within a published cutover window.
3. **Given** a secret is rotated incorrectly (e.g., DB password updated in the store but not in the database), **When** the application tries to use it, **Then** the failure is visible in logs and triggers the relevant alarm (no silent failure).

---

### User Story 5 — Engineer spins up a staging environment that is cheap to leave running (Priority: P2)

An engineer needs a staging environment to validate a content migration, a CSP change, or a Payload version bump before promoting to production. They run the documented command targeting the staging environment and end up with a working facsimile of production — same components, smaller instances, no multi-AZ, no auto-scaling beyond minimum, and a published per-month cost ceiling. They can tear it down with a single command when finished.

**Why this priority**: Staging exists primarily to de-risk Phase 5.5 launch readiness review. Cost-controlling it matters because nobody wants to ratchet up monthly AWS spend before the marketing site even ships. Lower than P1 because the cdk path itself is the gating P1 item; staging is a parameterization of that path.

**Independent Test**: Deploy the staging environment from a clean state, confirm the published monthly cost projection is within the budget, run an end-to-end smoke test of `/admin` SSO + a public page render, then tear down the staging environment with a single command and confirm zero residual billable resources.

**Acceptance Scenarios**:

1. **Given** the documented prerequisites, **When** the engineer runs the deploy command targeting the staging environment, **Then** the stack provisions with the documented smaller-instance profile and the published monthly cost ceiling is honored.
2. **Given** a deployed staging environment, **When** the engineer runs the smoke tests, **Then** OAuth SSO works, a public page renders, the health probe is 200, and uploaded media is reachable through the CDN.
3. **Given** a staging environment is no longer needed, **When** the engineer destroys it, **Then** all billable resources tear down (instances, RDS, snapshots if configured, load balancer, CDN distribution) and the AWS account returns to the pre-staging billing baseline within one billing cycle.

---

### Edge Cases

- The first `cdk deploy` runs but the ALB never goes healthy because the new container image fails to start — the deploy reports failure with a pointer to the application logs, and no orphaned half-built stack is left billing.
- A `cdk deploy` runs against an account where the SSL certificate has not yet been validated (DNS validation pending) — deploy waits for validation or fails cleanly with a message naming the cert as the blocker, not a generic timeout.
- An engineer pushes a container image tag that already exists in ECR — the registry's immutability behavior is consistent (either reject or overwrite) and documented, with no silent "the deploy used the old image" failure mode.
- The deploy pipeline runs concurrently with a manual `cdk deploy` from an engineer's laptop — the state lock prevents one from corrupting the other, and the loser sees a clear "deploy in progress by X" message.
- An alarm's notification channel is itself misconfigured or unreachable — there is a way to detect that alarms are firing but notifications are not being delivered (otherwise a silent notification failure looks identical to no alarms firing).
- The CloudFront distribution serves a stale error response from cache after the underlying origin has recovered — the runbook covers cache invalidation; the alarm thresholds account for cache TTL so we don't page on a self-healing condition.
- The team needs to deploy a hotfix while a normal deploy is rolling — the pipeline either queues the hotfix or cancels the in-flight deploy cleanly; the chosen behavior is documented.
- An engineer destroys staging and re-deploys it within the same hour — DNS, certs, and parameter store values are not orphaned in a way that breaks the second deploy.
- The `cdk diff` PR comment exceeds GitHub's comment size limit on a large refactor — the comment truncates with a link to the full diff in the workflow run, rather than failing the check.

## Requirements _(mandatory)_

### Functional Requirements

**Infrastructure provisioning**

- **FR-001**: The system MUST provision the production environment from a single declarative source of truth, with no manual console steps required between an empty AWS account and a serving application.
- **FR-002**: The system MUST provide a separately-targetable staging environment that uses the same declarative source as production but parameterized for cost (smaller instances, no high-availability features unless explicitly enabled).
- **FR-003**: The database (RDS) MUST live in isolated subnets with no route to the internet — non-negotiable. Application instances MUST NOT accept inbound traffic from outside the VPC except through the ALB, enforced by Security Group rules (App SG accepts ingress only from ALB SG on port 3000). Private-subnet placement of application instances is the production-launch posture (Phase 5.5 onward); during the pre-launch validation period, application instances may run in public subnets with the SG enforcement above to avoid NAT Gateway cost. See Clarifications Session 2026-05-26 for the trade-off, and ROADMAP §4 Phase 5.5 for the flip-back item.
- **FR-004**: The application MUST be reachable over HTTPS only, with a certificate sourced from AWS Certificate Manager. HTTP requests MUST be redirected to HTTPS, not silently served.
- **FR-005**: The application MUST be served behind a content delivery network with edge caching configured per ARCHITECTURE.md §5, with cache behavior differentiated between admin paths (no cache), API paths (no cache or short TTL), public HTML (revalidate per Next.js ISR), and static assets (long TTL).
- **FR-006**: Application instances MUST run the container image produced from the repository's Dockerfile, sourced from a project-owned container registry — not built on the instance, not pulled from a public registry at boot.
- **FR-007**: The database MUST be a managed Postgres service with automated backups enabled and a documented restore procedure.
- **FR-008**: Media uploads and static assets MUST live in object storage fronted by the CDN per ARCHITECTURE.md §5, with the storage bucket itself not publicly readable (origin access enforced).
- **FR-009**: All cross-resource permissions MUST be expressed as least-privilege IAM roles attached to specific resources — no wildcard policies and no shared "deploy" or "app" roles that span unrelated resources.

**Container image pipeline**

- **FR-010**: The container image MUST be built via the existing repository Dockerfile (validated and productionized as needed during planning), not a re-derived Dockerfile, and the image MUST not include the source `.env.local`, the repository's `.git` directory, or any developer-only tooling.
- **FR-011**: The image MUST be pushed to the project's container registry with a tag that uniquely identifies the source commit, so the in-service image is traceable to a specific commit at all times.
- **FR-012**: The registry MUST retain the last N images (N to be set during planning) and prune older images automatically to bound storage cost.

**Continuous delivery pipeline**

- **FR-013**: On every PR that touches infrastructure code, the CI pipeline MUST post a comment on the PR enumerating every resource that will be created, modified, replaced, or destroyed by the change. On PRs that do not touch infrastructure code, the comment MUST either explicitly say so or not appear, never silently miss the run.
- **FR-014**: On merge to `main`, the pipeline MUST deploy the new container image to production without further human action, while the previous image continues serving traffic until the new image passes its health checks. The rollout MUST be zero-downtime: ASG instance refresh with `MinHealthyPercentage: 100`, ALB health-check gate before any new instance receives traffic, target-group deregistration delay long enough for in-flight requests to drain, and minimum capacity ≥ 2 across ≥ 2 AZs.
- **FR-015**: A failed deploy (new image fails health checks) MUST leave the previous image in service and report failure to the merging commit. No half-cut state where some traffic hits the new image and some hits the previous one indefinitely.
- **FR-016**: The pipeline MUST prevent concurrent deploys to the same environment from corrupting state — a second deploy started while the first is in flight either queues or fails fast with a clear message.

**Secrets and configuration**

- **FR-017**: All runtime secrets (database password, Payload secret, OAuth client secret, future secrets) MUST be sourced from AWS Parameter Store (or an equivalent project-chosen secrets service). They MUST NOT live in the container image, the repository, environment files committed to the repository, or hard-coded in IaC.
- **FR-018**: Secret rotation MUST be possible without a code deploy and without a CDK deploy of unrelated infrastructure. The runbook for rotating each secret category MUST be documented.
- **FR-019**: The CI pipeline's own credentials (the AWS principal it uses to deploy) MUST be scoped to only the actions the deploy needs — no `*` policies, no long-lived IAM user credentials when an OIDC-federated role is feasible.

**Observability and alarms**

- **FR-020**: The system MUST emit the following 9 CloudWatch alarms (thresholds and evaluation windows are set during planning per ARCHITECTURE.md §8 and recorded in `data-model.md` §1):
  1. Load balancer 5xx rate above threshold (`AlbFiveXx`)
  2. Load balancer healthy-host count below threshold (`AlbUnhealthyHost`)
  3. EC2 CPU utilization above threshold sustained (`Ec2CpuHigh`)
  4. EC2 memory utilization above threshold sustained (`Ec2MemoryHigh`, via CloudWatch Agent)
  5. EC2 disk utilization above threshold (`Ec2DiskHigh`, via CloudWatch Agent)
  6. RDS CPU above threshold sustained (`RdsCpuHigh`)
  7. RDS free storage below threshold (`RdsFreeStorageLow`)
  8. RDS connection count above threshold (`RdsConnectionsHigh`)
  9. CloudFront edge error rate above threshold (`CloudFrontErrorRate`)
- **FR-021**: Every alarm MUST dispatch a notification to the configured Slack channel (via SNS → Lambda → incoming webhook), with alert text that identifies the dimension (ALB / ASG / RDS / CloudFront), the breached threshold, and a link to the relevant dashboard or log group. The webhook URL is sourced from Parameter Store, not hard-coded.
- **FR-022**: The pipeline MUST include a way to verify the notification path itself is working (a periodic synthetic alarm or documented manual test), so a silent notification failure is detectable.
- **FR-023**: Container instance logs and application logs MUST flow to CloudWatch Logs with retention configured per environment (longer for prod, shorter for staging).

**Operational hygiene**

- **FR-024**: The published HTTPS URL of each environment MUST be observable from a single source (CDK output, dashboard, or documented location) so engineers do not have to spelunk in the console to find it.
- **FR-025**: Tear-down (`cdk destroy`) MUST complete cleanly with no orphaned ENIs, EBS volumes, RDS snapshots-retained-by-policy that the engineer didn't expect, or unmanaged Parameter Store entries that survive the stack.
- **FR-026**: The deploy procedure MUST work from a fresh clone of the repository plus AWS credentials — no undocumented local state, no "first you have to manually create the ECR repo" steps.

### Key Entities

- **Environment**: One deployable target (`prod`, `staging`). Carries its own VPC, ALB, ASG, RDS instance, S3 bucket, CloudFront distribution, ECR repository (may be shared across environments), parameter-store namespace, IAM role set, and alarm set. Each environment has a published cost ceiling.
- **Container Image**: A built artifact identified by a commit-derived tag, stored in the project's ECR repository. The unit of deployment for the application.
- **Deployment**: One end-to-end run of the CI pipeline against an environment. Comprises (a) infrastructure-diff posting, (b) image push, (c) ASG rollout, (d) health-check verification, (e) success or rollback. Recorded with timestamp, image tag, and resulting in-service version.
- **Alarm**: One CloudWatch threshold over a metric in a specific dimension (ALB, ASG, RDS, CloudFront), with an evaluation window, a notification target, and alert text.
- **Notification Channel**: The configured destination for alarm notifications (decided in clarifications below).
- **Runtime Secret**: A named runtime configuration value stored in Parameter Store, bound to one application config key, rotatable independently of code or infrastructure deploys.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An engineer with no prior knowledge of the project can deploy the production environment from a fresh clone in under 60 minutes (excluding the initial AWS account setup), following only the project's deploy documentation.
- **SC-002**: A merge to `main` reaches the in-service production image within 20 minutes of the merge, end-to-end (CI test run, image build, image push, infra apply, ASG rollout, health check).
- **SC-003**: A deploy that introduces a failing container image leaves the previous image in service for 100% of customer requests during and after the failed rollout (zero customer-facing 5xx caused by the deploy itself).
- **SC-004**: Every PR that touches infrastructure code has a diff comment posted on it within 5 minutes of CI starting, on 100% of such PRs over the rolling window.
- **SC-005**: When any production alarm transitions to ALARM state, the on-call engineer receives a notification on the configured channel within 5 minutes of the alarm firing, on 100% of fired alarms over the rolling window.
- **SC-006**: The staging environment's published monthly cost projection (computed by AWS Cost Explorer or equivalent) is at most 25% of the production environment's projection, sustained.
- **SC-007**: Secret rotation for each rotatable category (database password, Payload secret, OAuth client secret) completes end-to-end (new value in use on every instance, no use of the old value) within 10 minutes of the engineer signalling the rollout.
- **SC-008**: A complete tear-down of an environment (`cdk destroy`) leaves zero billable resources in the target AWS account that were created by this stack, verified by the next billing cycle showing $0 attributable to that environment.
- **SC-009**: The deploy pipeline runs to completion on a representative PR (test job + infra diff + image push + dry-run deploy of staging) within 30 minutes, so it does not become a bottleneck for the small-team workflow.
- **SC-010**: Post-launch production uptime measured by ALB target-group availability is ≥ 99.9% over rolling 30-day windows, excluding pre-announced maintenance. Pre-launch (and during the early single-AZ-RDS period) this is an internal target informing design decisions; it becomes a measured criterion at public launch, which is also when the multi-AZ RDS flip lands per the Phase 5.5 checklist.

## Assumptions

- The target AWS account already exists and is bootstrapped for CDK use (`cdk bootstrap` is treated as a one-time per-account operation, not a per-deploy step).
- AWS access for engineers is governed by SEQTEK's existing IAM/SSO setup; this feature does not introduce or modify the engineer-side access path.
- A hosted zone for the production domain (`seqtek.com`) is **not** required in Route 53 for this feature — prod runs on the CloudFront-generated default URL until Phase 6 DNS cutover. Staging gets its own registered domain (`seqtek-preview.com`, per Clarifications Session 2026-05-25) registered in Route 53, with the auto-created public hosted zone driving ACM DNS validation and the A-record alias to CloudFront.
- The repository's existing Dockerfile (from D-13 spike) is the starting point. Planning will validate it for production (multi-stage, slim base, no dev tooling, correct entrypoint) and harden it; building a new Dockerfile from scratch is out of scope.
- ARCHITECTURE.md §5 (Media Storage), §8 (CloudWatch alarms table), and §13 (Infrastructure as Code) are authoritative for the resource topology. Any divergence in this spec is intentional and will be noted; otherwise defer to those docs.
- The project's CI provider is GitHub Actions (per existing `.github/workflows/`). Switching CI providers is out of scope.
- The CI principal will deploy via OIDC-federated short-lived credentials, not a long-lived IAM user with static keys. If the org's GitHub-AWS OIDC trust is not yet in place, setting it up is in scope for this feature.
- The application's runtime environment variables and their sourcing are documented in `docs/LOCAL_DEVELOPMENT.md` and existing app code; this feature does not introduce new env vars beyond what infrastructure requires (e.g., `DATABASE_URL` pointing at RDS).
- "Blue-green" in the user's description is treated as shorthand for "deploys that do not break the current in-service image if the new image fails health checks." The specific mechanism (ASG instance refresh vs. CodeDeploy blue-green vs. dual ASG with weighted target groups) is a planning decision — see clarifications.
- Phase 5 (CSP enforce flip) and Phase 6 (DNS cutover from Wix) are out of scope. This feature must leave a clean handoff to both: CSP report-only continues to work, and the DNS cutover should be a small Route 53 change, not a re-architecture.
- The seed script (D-8 / Phase 2 dependency) runs as a one-shot job, not as part of every deploy. The deploy mechanism for one-shot jobs (`payload migrate`, content seed) will be designed during planning as a small subset of the same pipeline.
- Per the project constitution v1.1.0 Principle IV: any new runtime dep added on the secrets / auth / public-render path during implementation gets a dependency-trust review and CI `npm audit --audit-level=high` continues to gate. CDK and AWS SDK are first-party Amazon packages, so the trust bar for those is "verify version pinning and audit-clean," not full review.
- Zero-downtime updates depend on four configuration points being in place together (ASG `MinHealthyPercentage: 100`, ALB health-check gate before traffic, target-group deregistration delay long enough for in-flight requests, ASG min capacity ≥ 2 across ≥ 2 AZs). Any one of those missing breaks the zero-downtime property. Planning will treat these as one atomic configuration set, not four independent toggles.
- The Slack incoming-webhook secret (FR-021 / Clarifications Q3) is provisioned by Kenn outside this feature's automation: create the Slack channel, generate the incoming webhook, store the webhook URL in Parameter Store at the documented path. This is the one human-in-the-loop bootstrap step that's not fully automated by CDK.
- The multi-AZ RDS flip is a small CDK property change but is intentionally deferred to Phase 5.5 launch readiness rather than landed in this feature. Reason: pre-launch cost matters more than pre-launch availability; the launch-readiness review owns the gate.
