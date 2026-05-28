# Phase 0: Research — AWS CDK Infrastructure & Blue-Green CI/CD

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

All Technical-Context unknowns resolved here. Nine decisions follow, each with rationale + alternatives considered.

---

## 1. AWS region

**Decision**: `us-east-1` for everything.

**Rationale**:

- CloudFront's ACM certificate **must** be issued in `us-east-1` regardless of where the origin lives — that's a non-negotiable AWS constraint.
- Co-locating ALB/ASG/RDS/ECR in `us-east-1` removes a class of cross-region IAM and networking complexity for zero operational benefit at our scale.
- SEQTEK's market is Tulsa / OKC / NW Arkansas / KC — mid-US. `us-east-1` and `us-east-2` are roughly equivalent for those visitors via CloudFront. CloudFront's edge cache serves the rendered HTML; the origin region barely matters for end-user latency.
- `us-east-1` has the best AWS service availability (every new service ships here first), so any future add-on (Bedrock, WAF rules, etc.) works without a region check.

**Alternatives considered**:

- `us-east-2` (Ohio) — fractionally closer to SEQTEK's market. Rejected: requires a second-region ACM dance and gains nothing user-visible.
- `us-west-2` — irrelevant; would add latency without benefit.

---

## 2. ALB target-group deregistration delay

**Decision**: **120 seconds**.

**Rationale**:

- Default is 300s. Aggressive for our workload — Next.js requests complete in tens of ms, Payload admin requests in a few seconds at most, `next/image` worst case is bounded by Sharp's processing time (typically under 30s for hostile inputs).
- 120s gives generous headroom for in-flight requests while keeping the deploy window short enough that SC-002 (20-min merge-to-prod) is comfortable.
- ALB returns 5xx on in-flight requests if the target is force-terminated before drain completes — that would violate FR-015 (zero customer 5xx caused by deploy).

**Alternatives considered**:

- 30s — too aggressive; would cut some long-tail requests during deploy.
- 300s (default) — safer but slows every deploy by 3 extra minutes for no benefit at our request profile.

---

## 3. ASG MinHealthyPercentage with prod (desired=2 max=3) vs staging (desired=1 max=2)

**Decision**: `MinHealthyPercentage: 100` on both environments' instance refresh.

**Rationale**:

- With `MinHealthyPercentage: 100`, ASG launches a **new** instance before terminating any old one — guaranteeing standing capacity stays at the desired-count throughout the refresh. This is the core zero-downtime guarantee in FR-014.
- Prod desired=2 max=3: refresh scales to 3, terminates 1 old (drain), then refreshes the second slot. Standing capacity never drops below 2 during the refresh window.
- Staging desired=1 max=2: refresh scales to 2, terminates the 1 old. Standing capacity never drops below 1. Staging has no SLA so this is acceptable.
- Reconciliation: ARCHITECTURE.md §5 currently specifies `min=1 max=2 desired=1` for prod. That delivers zero-downtime on updates but leaves AZ-failure-mode at 3-minute outage. With SC-010 99.9% SLA in scope, prod needs `min=2 max=3 desired=2 across 2 AZs`. ARCHITECTURE.md §5 + §9 update in the same PR per Principle III. Staging stays at desired=1.

**Alternatives considered**:

- `MinHealthyPercentage: 50` — only ever has 1 healthy at a time on staging during refresh; would briefly drop to zero serving capacity. Rejected on staging-parity with prod (instance refresh test should behave the same way) and on the principle that the zero-downtime mechanism should be uniform across environments.
- Two parallel ASGs with weighted target groups — Option B from the spec clarifications, rejected there as overengineering.

---

## 4. Slack notifier — inline Lambda vs `@slack/webhook` dep

**Decision**: Inline `NodejsFunction` (~40 LOC of TypeScript bundled by CDK via esbuild). No `@slack/webhook` dep.

**Rationale**:

- The Slack incoming-webhook contract is one HTTP POST with a JSON body. The official SDK adds an unhelpful layer of abstraction for what is literally `await fetch(url, { method: 'POST', body: JSON.stringify({ text, blocks }) })`.
- Constitution IV's dependency-trust principle leans toward "prefer a custom integration against well-known primitives over adopting a low-trust dep on the security path." The Slack webhook URL IS a load-bearing alerting secret; the path that handles it should have a minimal dep surface.
- esbuild-bundling via `NodejsFunction` produces a tiny Lambda artifact, no `node_modules` shipped at runtime, faster cold start.
- One unit test (`infra/test/slack-lambda.test.ts`) covers the payload formatter as a pure function — no AWS calls, no network calls.

**Alternatives considered**:

- `@slack/webhook` — actively maintained, but adds a dep + a CVE follow-along surface for ~3 lines of saved code. Same calculus that walked us off `payload-auth-plugin` in spec 001.
- AWS Chatbot — managed, but configured per-channel through console + AWS Chatbot's IAM trust dance. Adds a third service. Reconsider only if alarm volume grows past what a single Lambda can format cleanly.
- Direct SNS subscription via Slack's `Email` integration — Slack doesn't have a built-in SNS HTTPS subscription with the right auth model. Rejected as a half-baked path.

---

## 5. GitHub OIDC trust + deploy role split

**Decision**: **One** OIDC identity provider in the AWS account (`token.actions.githubusercontent.com`); **two** deploy roles (`SeqtekProdDeploy`, `SeqtekStagingDeploy`); each role's trust policy scopes to specific GitHub workflow + branch + environment patterns.

**Rationale**:

- AWS only allows one OIDC provider per issuer URL. The "one provider, many roles" pattern is the documented best practice.
- Per-env roles keep blast radius small. A misconfigured staging workflow can't deploy to prod even if it assumes its own role — the role's policy is scoped to staging stack ARNs.
- Role trust policies pin `repo:SeqTechLLC/seqtekdotcom:ref:refs/heads/main` for the prod role; staging role allows any branch's workflows (so an engineer's feature branch can `cdk diff` staging during development).
- Policies are scoped per stack ARN (CloudFormation stack-level) plus per ECR repo + per Parameter Store path prefix — no `*` on `cloudformation:*` or `iam:*`.

**Alternatives considered**:

- Single deploy role used by both environments — simpler but violates least-privilege. A staging-targeting workflow with an account-wide role could deploy to prod accidentally.
- Per-stack roles (one per CloudFormation stack) — over-fragmented; would force the deploy workflow to assume multiple roles in one run.
- Long-lived IAM user with static credentials in GitHub Actions secrets — explicitly forbidden by Constitution IV and ARCHITECTURE.md §6 ("Static AWS credential variables are not used anywhere in this codebase").

---

## 6. RDS storage configuration

**Decision**: **gp3, 50 GB allocated, 3000 IOPS baseline, 125 MB/s baseline**.

**Rationale**:

- gp3 separates IOPS and throughput from allocated storage. gp2 ties them to size (3 IOPS/GB), so to get 1000 IOPS on gp2 you'd need ~333 GB allocated.
- Postgres workload for a marketing site is read-heavy with small writes (page reads from `pages`/`posts` tables, occasional media-metadata inserts on uploads). 3000 IOPS at gp3's flat baseline is comfortable headroom.
- 50 GB is well above the projected workload (Wix audit shows the entire content corpus is <1 GB; Payload's versioning + revision history adds maybe 5x; 50 GB gives 5+ years of growth headroom).
- gp3 baseline price is lower than gp2 at this size, even before factoring in the separately-billed IOPS.

**Alternatives considered**:

- gp2, 100 GB — older, more expensive at this footprint.
- io1 / io2 — provisioned IOPS, vastly overkill for our throughput needs.

---

## 7. ECR lifecycle policy

**Decision**: **Keep the last 10 tagged images; expire untagged images after 7 days.**

**Rationale**:

- ARCHITECTURE.md §9 already commits to "keep last 10 tagged images" — this just makes it concrete.
- 10 tagged images = ~3 months of merges at our cadence; plenty of rollback runway.
- Untagged images accumulate from failed pushes and intermediate layers — 7-day expiry keeps the repo tidy without risking deletion of an image that's still referenced.
- Lifecycle policy lives in CDK (`Repository.lifecycleRules`), so it's reviewable and never hand-configured.

**Alternatives considered**:

- Keep last 50 — overkill; rolling back 50 deploys is not a meaningful scenario.
- Time-based retention (keep images from last 30 days) — risky if no deploys happen for a month.

---

## 8. Parameter Store namespace

**Decision**: **`/seqtek/website/{env}/`** prefix, with these paths:

| Path                                         | Type         | Written by                            | Read by                            |
| -------------------------------------------- | ------------ | ------------------------------------- | ---------------------------------- |
| `/seqtek/website/{env}/database_url`         | SecureString | CDK (data-stack)                      | App (Payload DB adapter)           |
| `/seqtek/website/{env}/payload_secret`       | SecureString | CDK (data-stack)                      | App (Payload)                      |
| `/seqtek/website/{env}/google_client_id`     | String       | Manual (per spec 001 env table)       | App (OAuth)                        |
| `/seqtek/website/{env}/google_client_secret` | SecureString | Manual                                | App (OAuth)                        |
| `/seqtek/website/{env}/revalidation_secret`  | SecureString | CDK (data-stack)                      | App (`/api/revalidate`)            |
| `/seqtek/website/{env}/slack_webhook_url`    | SecureString | Manual (Kenn, after channel creation) | Slack notifier Lambda              |
| `/seqtek/website/{env}/s3_bucket`            | String       | CDK (data-stack)                      | App (Payload S3 adapter)           |
| `/seqtek/website/{env}/s3_bucket_hostname`   | String       | CDK (data-stack)                      | App (next.config `remotePatterns`) |
| `/seqtek/website/{env}/next_public_site_url` | String       | CDK (edge-stack)                      | App (next.config)                  |

**Rationale**:

- Matches the existing OAuth-era convention from ARCHITECTURE.md §6 ("Parameter Store at `/seqtek/website/{env}/google_client_{id,secret}`"). Extending the same prefix keeps the per-env namespace contiguous — one IAM policy scope covers all.
- "CDK writes" paths are populated as part of the deploy (auto-generated values like `payload_secret` use CDK's `Secret.fromGenerator` pattern + `StringParameter` mirror).
- "Manual" paths are populated out-of-band before first deploy — these are values that exist only in human heads (OAuth client secret from Google Cloud Console; Slack webhook URL from Slack). The first-deploy checklist in `quickstart.md` enumerates these.

**Alternatives considered**:

- AWS Secrets Manager instead of Parameter Store SecureString — Secrets Manager costs ~$0.40/secret/month vs Parameter Store SecureString being free for non-advanced. For 6 secrets that's ~$30/year of unnecessary cost. Reconsider if a secret needs automatic rotation triggers, which we don't.
- Single mega-secret (one Parameter Store entry with JSON-blob value) — harder to rotate individual values without touching unrelated ones.

---

## 9. CDK app context schema (`cdk.json` `context` block)

**Decision**: One nested block per env:

```jsonc
{
  "context": {
    "envs": {
      "prod": {
        "account": "REDACTED_IN_REPO_VIA_PARAMETER_STORE",
        "region": "us-east-1",
        "domainName": "seqtek.com",
        "hostedZoneId": "TBD_AT_FIRST_DEPLOY",
        "certificateArn": "TBD_AT_FIRST_DEPLOY",
        "instanceClass": "t3",
        "instanceSize": "small",
        "rdsInstanceClass": "t3.small",
        "rdsAllocatedStorageGb": 50,
        "rdsMultiAz": false,
        "asgMinCapacity": 2,
        "asgDesiredCapacity": 2,
        "asgMaxCapacity": 3,
        "ecrRetainCount": 10,
        "logRetentionDays": 90,
      },
      "staging": {
        "account": "SAME_AS_PROD",
        "region": "us-east-1",
        "domainName": null,
        "hostedZoneId": null,
        "certificateArn": null,
        "instanceClass": "t3",
        "instanceSize": "small",
        "rdsInstanceClass": "t3.small",
        "rdsAllocatedStorageGb": 50,
        "rdsMultiAz": false,
        "asgMinCapacity": 1,
        "asgDesiredCapacity": 1,
        "asgMaxCapacity": 2,
        "ecrRetainCount": 10,
        "logRetentionDays": 14,
      },
    },
  },
}
```

**Rationale**:

- Single source of truth for everything that varies between envs. Adding a new env (preview, demo, etc.) is one new block — no code changes.
- Account ID is read from the actual deploy env (`process.env.CDK_DEFAULT_ACCOUNT` populated by `aws sts get-caller-identity` during synth), not hardcoded in committed JSON — keeps the account ID out of git history (Constitution IV).
- `multiAz: false` for both envs is the launch decision; flipping prod to `true` at Phase 5.5 is a one-line `cdk.json` change + re-deploy.
- `null` fields for staging domain/zone/cert mean "use the auto-generated ALB DNS" — pre-launch staging doesn't need a vanity URL.
- Schema is validated by a small TypeScript type in `infra/lib/construct-utils.ts` (`EnvConfig` interface); CDK app entry asserts the shape on synth.

**Alternatives considered**:

- Per-env CDK app files (`bin/prod.ts`, `bin/staging.ts`) — more code duplication, harder to keep in sync.
- Environment variables instead of context — works but loses the in-repo audit trail. Context entries are reviewable in PRs.

---

## Loose ends not requiring research

These were considered and judged trivial; recording so the decision trail is complete:

- **VPC CIDR**: `10.0.0.0/16` per env, no peering required (single-account, separate VPCs per env via stack-name prefix).
- **NAT count**: 1 NAT gateway per env (single-AZ NAT is a known tradeoff — if the NAT's AZ fails, outbound from private subnets fails. Acceptable at this cost tier; revisit at multi-AZ-RDS flip time).
- **CloudWatch log retention**: 90 days prod, 14 days staging — matches ARCHITECTURE.md §8.
- **Tag strategy**: `Project=seqtek-website`, `Environment={env}`, `ManagedBy=cdk`, `Repo=SeqTechLLC/seqtekdotcom` applied via `Tags.of(app).add(...)`.

---

**Output**: All 9 Technical-Context unknowns resolved. Proceed to Phase 1 design (data-model.md, contracts/, quickstart.md).
