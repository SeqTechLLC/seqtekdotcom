# Infrastructure Runbook

**Living operational doc.**

| §   | Procedure                                                                                   | When                                  |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | [Stand up a fresh AWS account](#1-stand-up-a-fresh-aws-account)                             | New account, nothing exists yet       |
| 2   | [Migrate an environment to another account](#2-migrate-an-environment-to-another-account)   | Moving a running env to a new account |
| 2.9 | [Rebuild a lane's database](#rebuilding-a-lanes-database-for-the-2026-09-24-baseline)       | A lane's first deploy of the baseline |
| 3   | [Cut `seqtek.com` over to prod](#3-cut-seqtekcom-over-to-prod)                              | Launch                                |
| 4   | [Post-change verification](#4-post-change-verification)                                     | After any of the above                |
| 5   | [Hand-off when you don't own the account](#5-hand-off-when-you-dont-own-the-target-account) | Someone else holds AWS admin          |

> **Status, 2026-09-28.** Only §2.9 has been checked against what is deployed: the one
> `preview` env (`SeqtekPreview*` stacks serving preview.seqtek.com and ww3.seqtek.com), in
> an AWS account shared with unrelated infrastructure. §1–§3 and §5 still describe the
> retired `staging`/`prod` layout and the destroyed seqtek-preview.com, and running them
> against this account would collide with or delete live resources. Do not use them until
> they are rewritten (`ROADMAP.md` P3, Infrastructure).

Design rationale lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md) (§ Promotion model,
§ Environments & isolation). [`INFRASTRUCTURE_QUICKSTART.md`](./INFRASTRUCTURE_QUICKSTART.md) was
the original first-deploy walkthrough; it is **superseded by this file for the
first deploy** (it predates the promotion model and describes merges to `main`
deploying prod), but remains the reference for secret rotation, tear-down, alarm
verification and troubleshooting, though it still describes the retired EC2 stack.

---

## Facts this runbook assumes

Nothing in the CDK hardcodes an AWS account. `stackEnv()` reads
`CDK_DEFAULT_ACCOUNT`, the OIDC deploy role derives from `stack.account`, and
`deploy.yml` resolves `vars.AWS_ACCOUNT_ID`. **Retargeting an account is a
variable change plus a bootstrap, not a code change.**

Two ordering traps, both of which fail _after_ a successful-looking deploy:

1. **Whichever environment owns the OIDC provider must be deployed first.** The
   GitHub OIDC provider is account-wide and IAM permits exactly one per issuer
   URL per account, so ownership is explicit config — `ownsAccountOidcProvider`
   in `infra/cdk.json`. Deploy an importer into an empty account and
   CloudFormation happily creates a role trusting a provider that does not
   exist; every deploy then fails at assume-role.
   - **Both envs in one account** (`prod: true`, `staging: false` — the layout
     today): deploy `SeqtekProdNetwork` before `SeqtekStagingNetwork`. This is
     why `SeqtekProdNetwork` is the one prod stack deployed in the current
     account.
   - **Envs in separate accounts**: set it `true` on **both** — each account
     needs its own — and this ordering constraint disappears entirely.

   ECR needs no such care: each environment creates its own
   `seqtek-website-<env>`, so both topologies work with no configuration.

2. **The prod OIDC trust pins the `production` GitHub Environment, not a git
   ref.** So the `production` Environment must exist in GitHub _before_ the
   first prod deploy, or the claim can't match. See `infra/lib/deploy-role.ts`.

---

## 1. Stand up a fresh AWS account

### 1.0 Prerequisites

- Admin credentials for the target account (`aws sts get-caller-identity` works)
- AWS CLI v2, Node ≥ 22, Docker
- Google Cloud Console access to the Workspace project (for `/admin` SSO)
- Slack admin (to mint an incoming webhook)

Set the profile once so every command below targets the right account:

```sh
export AWS_PROFILE=<target-profile>
export AWS_REGION=us-east-1
aws sts get-caller-identity     # CONFIRM the account id before continuing
```

### 1.1 Bootstrap + the OIDC provider

```sh
npm --prefix infra ci

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
npx --prefix infra cdk bootstrap "aws://${ACCOUNT}/us-east-1"

# FIRST — creates the account-wide GitHub OIDC provider (see trap 1 above).
npm --prefix infra run deploy -- -c env=prod SeqtekProdNetwork
```

### 1.2 GitHub setup (before any deploy that uses OIDC)

Settings → Environments → create **`staging`** and **`production`**. Creating an
environment requires repo **admin**; running a deploy only requires **write**.

As of 2026-08-10 only `staging` exists — `production` has to be created before
the first prod deploy, because the prod OIDC trust pins that environment name.

```sh
REPO=SeqTechLLC/seqtekdotcom

# -F (not -f) so the booleans are sent as JSON true/false rather than strings.
gh api -X PUT "repos/$REPO/environments/production" \
  -F 'deployment_branch_policy[protected_branches]=false' \
  -F 'deployment_branch_policy[custom_branch_policies]=true'

# Who may deploy to production. This is what replaces the git-ref pin that used
# to live in the OIDC trust policy:
#   v*    the release tags — the normal production path
#   main  the workflow_dispatch escape hatch, needed for the FIRST deploy into a
#         new account, where no release exists yet to replay
gh api -X POST "repos/$REPO/environments/production/deployment-branch-policies" \
  -f name='v*' -f type=tag
gh api -X POST "repos/$REPO/environments/production/deployment-branch-policies" \
  -f name='main' -f type=branch
```

Then mark the environment configured, which `deploy.yml` checks before any prod
deploy and **fails closed** without:

```sh
gh api -X PATCH "repos/$REPO/environments/production/variables/PROD_ENVIRONMENT_CONFIGURED" \
  -f name=PROD_ENVIRONMENT_CONFIGURED -f value=true 2>/dev/null \
  || gh api -X POST "repos/$REPO/environments/production/variables" \
       -f name=PROD_ENVIRONMENT_CONFIGURED -f value=true
```

This exists because GitHub **auto-creates** an environment a workflow references
but that does not exist — with no protection rules at all. Without the flag, the
first prod deploy would silently self-provision an ungated environment that the
OIDC trust then happily matches.

Consider adding required reviewers on `production` too — without them, anyone
with `write` can dispatch a production deploy.

- On **each** environment add a variable `AWS_ACCOUNT_ID` = that environment's
  account id. Environment-scoped, so staging and prod can live in different
  accounts. An environment without it inherits the repo-level variable.
- On `production`, set deployment branch/tag restrictions (this is what replaces
  the old git-ref pin in the OIDC trust) and any required reviewers.

No secrets are needed — OIDC trust is established by the stack in §1.1.

### 1.3 Seed the manual SSM parameters

Three values CDK cannot generate. Everything else is created by the data stack.

```sh
ENV=staging   # repeat for prod

# Google OAuth client (Google Cloud Console → Workspace project → OAuth 2.0).
# Redirect URI: https://<site-domain>/api/auth/oauth/callback/google
# Add BOTH the CloudFront default domain and the vanity domain — the default
# URL is how you reach /admin before DNS and ACM settle.
aws ssm put-parameter --name "/seqtek/website/${ENV}/google_client_id" \
  --type String --value '<client id>'
aws ssm put-parameter --name "/seqtek/website/${ENV}/google_client_secret" \
  --type SecureString --value '<client secret>'
aws ssm put-parameter --name "/seqtek/website/${ENV}/slack_webhook_url" \
  --type SecureString --value 'https://hooks.slack.com/services/...'
```

#### 1.3a Cognito perimeter gate (`cognitoAuthEnabled: true` envs only)

A SEPARATE Google OAuth client from 1.3 above — that one is the app's own
Payload-admin login; this one gates the whole ALB listener (added
2026-08-12, see `infra/lib/cognito-auth.ts`) via a Cognito User Pool
federated to Google Workspace. Create it under the SAME Google Cloud
project so it inherits the same "Internal" (`@seqtechllc.com`-only)
consent-screen restriction — Cognito itself does not filter by hosted
domain.

Redirect URI is fixed by the Cognito domain prefix
(`seqtek-${ENV}-gate`), NOT the site's own domain:
`https://seqtek-${ENV}-gate.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`

Client ID is a plain SSM parameter, same as everywhere else in this file.
The SECRET is NOT — `AWS::Cognito::UserPoolIdentityProvider`'s
`ProviderDetails` map only resolves `{{resolve:secretsmanager:...}}`
dynamic references, not `{{resolve:ssm-secure:...}}` (confirmed by a real
deploy failure 2026-08-12: "SSM Secure reference is not supported in:
[...ProviderDetails/client_secret]"). It goes in Secrets Manager instead,
matching every OTHER sensitive value data-stack.ts already creates:

```sh
aws ssm put-parameter --name "/seqtek/website/${ENV}/cognito_google_client_id" \
  --type String --value '<client id>'
aws secretsmanager create-secret \
  --name "seqtek-website/${ENV}/cognito-google-client-secret" \
  --secret-string '<client secret>'
```

### 1.4 Domain (optional per env)

Prod intentionally runs on the CloudFront default URL until launch —
`cdk.json` has `domainName: null` for prod, and that is correct pre-cutover.
For a vanity domain, register or transfer it (see §2.6), then set both
`domainName` and `hostedZoneId` in `infra/cdk.json` — `validateEnvConfig()`
rejects one without the other. Leave `certificateArn: null`; CDK provisions ACM
by DNS validation.

### 1.5 Deploy the rest

```sh
npm --prefix infra run deploy -- -c env=staging 'SeqtekStaging*'
npm --prefix infra run deploy -- -c env=prod    'SeqtekProd*'
```

~25 min per environment from cold; RDS is the long pole (~15 min).

### 1.6 Build and ship an image

The stacks are empty until an image exists. Easiest path is the pipeline:
Actions → **Deploy** → Run workflow → env = `staging` (or `prod`),
stack-filter = `*` for the first run.

`NEXT_PUBLIC_*` values are **build-time inlined** and ride as Docker build args
in `deploy.yml` — runtime SSM cannot deliver them. A new environment that needs
different HubSpot/GTM IDs needs them changed there.

### 1.7 Smoke

```sh
URL=https://<cloudfront-domain>
curl -s "$URL/api/health" | jq          # {"status":"ok","db":"ok",...}
curl -so /dev/null -w '%{http_code}\n' "$URL/"        # 200
curl -so /dev/null -w '%{http_code}\n' "$URL/admin"   # 200
```

`/api/health` 503 → container up, DB unreachable (check
`/seqtek/website/<env>/app` logs). `/admin` 502/504 → no healthy ALB targets,
usually a missing SSM path or a failed image pull.

---

## 2. Migrate an environment to another account

**Do not migrate the database.** Rebuild the environment from the committed
seeders and the gitignored content drafts — that is what they are for, and it is
both simpler and safer than moving state:

- no `pg_dump`, no cross-account snapshot share, no KMS grant
- no restored RDS instance sitting outside CloudFormation's control
- the new database is created by the app's own migrations, in a known-good state
- it **proves** the seed corpus is genuinely the source of truth, which is the
  standing convention (`CLAUDE.md` § Content loading & deploys)

Verified 2026-08-10: the drafts reproduce the live site's content **exactly** —
41 documents, no gaps.

| Collection       | Live | From drafts |
| ---------------- | ---- | ----------- |
| `pages`          | 6    | 6           |
| `posts`          | 5    | 5           |
| `caseStudies`    | 5    | 5           |
| `workshops`      | 3    | 3           |
| `teamMembers`    | 10   | 10          |
| `services`       | 9    | 9           |
| `servicePillars` | 3    | 3           |

### 2.1 Media

Media ships in the content repo and loads by `$file` with the content (§2.2). There
is nothing to prime.

### 2.2 Rebuild the content

Once per lane, as in §2.9 steps 6–7: the website owner signs in to the lane's
`/admin` first, then loads the content JSON in the content repo's `LOAD-ORDER.md`
order.

### 2.3 Verify against the old environment

Slug parity is not content parity — a page edited directly in `/admin` that
never made it back into a draft would seed as the _older_ draft copy. Diff the
rendered output before trusting the cutover:

```sh
# NOTE: no /services or /services/<slug> probe. /services is a 301 onto
# /services/what-we-do, and curl does not follow it, so both sides would return
# the same near-empty redirect body and pass vacuously; the axis and leaf slugs
# are content and are not seeded yet, so those would 404 on both sides for the
# same reason. Add a probe once a service is published on the lane you are
# comparing.
for p in / /our-story /workshops /team \
         /case-studies /insights /contact /localshoring /privacy-policy; do
  a=$(curl -s "https://seqtek-preview.com$p" | sed 's/<[^>]*>//g' | tr -s '[:space:]' ' ')
  b=$(curl -s "https://<new-env>$p"          | sed 's/<[^>]*>//g' | tr -s '[:space:]' ' ')
  [ "$a" = "$b" ] && echo "same  $p" || echo "DIFF  $p"
done
```

Investigate every `DIFF`. Either the draft is stale (fix the draft — it is the
source of truth) or the new environment is genuinely wrong.

### 2.4 Everything else that has to move

| Thing            | How                                                             |
| ---------------- | --------------------------------------------------------------- |
| SSM parameters   | recreate per §1.3 (2 of 8 are SecureString)                     |
| Secrets Manager  | created by the data stack; new values are fine                  |
| ECR image        | nothing — the pipeline rebuilds it                              |
| Google OAuth     | add the new callback URL, or `/admin` sign-in breaks (see §2.5) |
| Domain           | §2.6                                                            |
| RDS / CloudFront | nothing — CDK creates both                                      |

### 2.5 Google OAuth

Add the new environment's callback to the OAuth client before cutover:

```
https://<new-cloudfront-domain>/api/auth/oauth/callback/google
https://seqtek-preview.com/api/auth/oauth/callback/google   (already present)
```

### 2.6 Move the domain

`seqtek-preview.com` is registered in Route 53 in the source account, so it moves
account-to-account without a registrar transfer — no auth code, no 60-day lock:

```sh
# Source account
aws route53domains transfer-domain-to-another-aws-account \
  --domain-name seqtek-preview.com --account-id "$DST"
# Returns OperationId + Password — hand both to the target account.

# Target account (within 3 days, or the request expires)
aws route53domains accept-domain-transfer-from-another-aws-account \
  --domain-name seqtek-preview.com --password '<password>'
```

The **hosted zone does not travel with the domain.** Let CDK create the zone in
the target account (set `domainName` + `hostedZoneId` in `cdk.json` once it
exists), then repoint the registered domain's nameservers at the new zone:

```sh
aws route53domains update-domain-nameservers --domain-name seqtek-preview.com \
  --nameservers Name=ns-1.awsdns-xx.com Name=...   # the 4 from the NEW zone
```

### 2.7 Order of operations

1. §1 in the target account, through a green smoke test on the CloudFront URL
2. Fetch media (§2.1), rebuild content (§2.2), verify (§2.3) — all against the
   CloudFront URL, before any DNS changes
3. Point the GitHub `staging` / `production` environment `AWS_ACCOUNT_ID` at the
   new account
4. Transfer the domain and repoint nameservers (§2.6)
5. Watch both accounts for 24 h
6. Only then decommission the source: **take a final RDS snapshot and keep it**,
   then delete stacks, empty buckets, remove zones. **Not in the account that runs
   the lanes today:** it also holds the live seqtek.com zone, a shared VPC and
   unrelated infrastructure.

Rollback before step 4 is free — the old environment is still serving. After it,
revert the nameservers; DNS TTL is the exposure window. Delete nothing in the
source account until step 6.

### 2.8 If you ever do need the database itself

Only reason: recovering something that exists **only** in the old database and
never made it into a draft — Payload version history, or a doc hand-edited in
`/admin`. RDS here is unencrypted, so a cross-account snapshot share needs no KMS
grant:

```sh
aws rds create-db-snapshot --db-instance-identifier <id> --db-snapshot-identifier <snap>
aws rds modify-db-snapshot-attribute --db-snapshot-identifier <snap> \
  --attribute-name restore --values-to-add "$DST"
```

Restore it beside the CDK instance and copy out what you need. Do not make a
restored snapshot the environment's database — CloudFormation would no longer
own it.

---

## 2.9 Before a destructive migration: snapshot first

### Rebuilding a lane's database for the 2026-09-24 baseline

The migration history was squashed into one baseline (`src/migrations/*_baseline.ts`)
that creates every type and table, so it cannot run against a lane's existing
database. Deployed to a lane that has not been rebuilt (preview at merge, ww3 at
release publish), `payload migrate` fails and ECS rolls back to the previous image,
which keeps serving. The rebuild works before that deploy or after it has failed.
Do each lane just before its own deploy: the lane serves nothing in between.

Both lanes run in the `SeqtekPreview*` stacks in `us-east-1` and share one RDS
instance; preview's database is `seqtek_preview` and ww3's is `seqtek_prod`. The
account also runs unrelated infrastructure, another RDS instance included, so
every command below resolves its target from the stack outputs.

The work splits the way §5 does: the AWS steps need the account admin, the rest
needs the website owner. The lane stays at zero tasks from the drop until the new
image deploys, because an old-image task started in between would migrate the old
schema into the empty database.

**Account admin** (AWS CLI in the account; AWS CloudShell in `us-east-1` works).

1. Pick the lane and snapshot the RDS instance. The snapshot holds both lanes'
   databases.

```sh
export AWS_REGION=us-east-1
LANE=ServiceName   # preview. For ww3: LANE=SecondaryLaneServiceName
out() { aws cloudformation describe-stacks --stack-name "$1" \
  --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue | [0]" --output text; }
CLUSTER=$(out SeqtekPreviewCompute ClusterName)
SERVICE=$(out SeqtekPreviewCompute "$LANE")
DBHOST=$(out SeqtekPreviewData DbEndpointHostname)
INSTANCE=$(aws rds describe-db-instances --output text \
  --query "DBInstances[?Endpoint.Address=='$DBHOST'].DBInstanceIdentifier | [0]")
SNAP=pre-baseline-$(date +%Y%m%d%H%M)
aws rds create-db-snapshot --db-instance-identifier "$INSTANCE" \
  --db-snapshot-identifier "$SNAP" >/dev/null
aws rds wait db-snapshot-completed --db-snapshot-identifier "$SNAP"
```

2. Note the lane's task count (1 today), then scale it to zero.

```sh
aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].desiredCount'
aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" \
  --desired-count 0 >/dev/null
aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"
```

3. Drop and recreate the lane's database with a one-off task from the lane's own
   task definition, which carries the credentials. Its `DB_NAME` is that lane's
   database, so the other lane's is untouched.

```sh
TASKDEF=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].taskDefinition' --output text)
aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].networkConfiguration' --output json > net.json
cat > recreate-db.json <<'EOF'
{"containerOverrides": [{"name": "AppContainer", "command": ["node", "-e",
  "const { Client } = require('pg'); const e = process.env; const c = new Client({ connectionString: `postgresql://${e.DB_USER}:${e.DB_PASS}@${e.DB_HOST}:${e.DB_PORT}/postgres?sslmode=require` }); (async () => { await c.connect(); await c.query(`DROP DATABASE IF EXISTS ${e.DB_NAME} WITH (FORCE)`); await c.query(`CREATE DATABASE ${e.DB_NAME}`); await c.end(); })().catch((err) => { console.error(err); process.exit(1); });"]}]}
EOF
TASK=$(aws ecs run-task --cluster "$CLUSTER" --launch-type FARGATE \
  --task-definition "$TASKDEF" --network-configuration file://net.json \
  --overrides file://recreate-db.json --query 'tasks[0].taskArn' --output text)
aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$TASK"
aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$TASK" \
  --query 'tasks[0].[containers[0].exitCode, stoppedReason]'   # exit code must be 0
```

Then report the snapshot name and the task count from step 2, and stop. **Do not
sign in to `/admin`**: on an empty database the first account to sign in becomes
the admin (`src/lib/auth/apply-bootstrap-role.ts`).

**Website owner.**

4. Deploy: merge to `main` (preview) or publish the release (ww3), or re-run the
   failed Deploy run if one already tried. The new image's `payload migrate`
   applies the baseline to the empty database.
5. If the deploy's smoke job fails because the lane has no running task, ask the
   account admin to restore the step 2 count with
   `aws ecs update-service --desired-count`, then re-run the smoke job.
6. Sign in to the lane's `/admin` with Google, first. Its `payload-token` cookie is
   `IMPORT_TOKEN`. The ALB gate's session cookies are `IMPORT_COOKIE`
   (`tools/payload-seed/README.md`, "Getting `IMPORT_COOKIE`").
7. Load the content JSON with `npm run payload:seed` in the empty-database order in
   the content repo's `LOAD-ORDER.md`. Every file must end `errors=0`.

### Snapshotting before a destructive migration

A migration that drops columns or tables is not recoverable by re-running
anything.

**Merging IS deploying, and deploying IS migrating.** A push to `main` deploys the
preview lane and publishing a release deploys ww3 (`deploy.yml`, `IS_RELEASE`).
Each lane's container command runs `npx payload migrate` before `node server.js`
(`infra/lib/compute-stack.ts`), and the `preview` GitHub Environment has no
approval rule. There is no manual step between the merge button and the
migration, and there is no separate staging lane to rehearse in — that account
was retired 2026-08-14.

So the one safety step happens **before the merge**, and the account admin takes
it, since the website owner has no AWS access (§5). Resolve `$INSTANCE` as in step 1
of the rebuild above:

```sh
aws rds create-db-snapshot \
  --db-instance-identifier "$INSTANCE" \
  --db-snapshot-identifier pre-<migration-name>
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier pre-<migration-name>
```

That is the whole procedure. Two things make it sufficient rather than thin:

- **The content is reproducible.** `docs/content-drafts/*.json` is the source of
  truth for every published document (`CLAUDE.md` § Content loading & deploys);
  a lane can be rebuilt from it with `npm run payload:seed`. The snapshot covers
  the one thing the drafts do not: edits made directly in the admin since the
  last seed.
- **Nothing here is public.** `preview.seqtek.com` and `ww3.seqtek.com` are both
  Cognito-gated; `seqtek.com` still serves Wix.

> **Do not run a Payload script against a remote lane to "check" it first.**
> `payload.config.ts` enables Drizzle push whenever `NODE_ENV !== 'production'`,
> so a script run from a laptop with `DATABASE_URL` pointed at a deployed lane
> will **push the local config's schema to it** — applying the drops immediately,
> outside the migration, with no record. Spec 011 shipped a
> `tools/legacy-equivalence` gate that fell into exactly this trap and was
> deleted; the snapshot is the control that actually works.

---

## 3. Cut `seqtek.com` over to prod

Prod runs on its CloudFront URL until this happens, which is deliberate: prod
can be fully built and smoke-tested before DNS is involved at all.

**Blocked on access we do not currently have.** As of 2026-08-10 the
`seqtek.com` hosted zone is in **none** of the five AWS accounts available to
us, and the live chain is:

```
seqtek.com → redirect.pizza → www.seqtek.com → Cloudflare (client.gushwork.net) → Wix
```

So the cutover requires whoever operates that chain. Establish that ownership
early — it is the long pole, and it is not an engineering task.

Once DNS is in hand:

1. Set prod `domainName: "seqtek.com"` + `hostedZoneId` together in
   `infra/cdk.json` (validation rejects one without the other)
2. Deploy `SeqtekProdEdge` — CDK provisions the ACM cert by DNS validation
3. Add `https://seqtek.com/api/auth/oauth/callback/google` to the OAuth client
4. Set `/seqtek/website/prod/next_public_site_url` to `https://seqtek.com`,
   otherwise `sitemap.xml` and canonical URLs emit the preview domain
5. **Lower DNS TTL 24 h beforehand**, then repoint
6. Confirm the redirect map serves. `/our-services` → `/services/what-we-do` is
   the Wix-era URL; `/about` → `/our-story` and `/services` →
   `/services/what-we-do` are internal route→route 301s preserving our own
   older URLs. All three emit 308 (`permanent: true`), not 301
7. Make `seqtek-preview.com` `noindex` so preview never competes with prod in
   search
8. ~~Seed the office address into the `siteSettings` global~~ — **retired by
   spec 011 (FR-005a).** `organizationLd` now reads the same hardcoded
   `src/lib/site-content.ts` constant the footer uses, so the address ships
   with the code and cannot go dormant by being left unseeded. The step is
   gone rather than left as a no-op: a cutover instruction that silently does
   nothing is worse than none. Still worth verifying after cutover:
   `curl -s https://seqtek.com | grep -o '"address":{[^}]*}'`

---

## 4. Post-change verification

```sh
URL=https://<site>
curl -s "$URL/api/health" | jq
for p in / /our-story /workshops /team /case-studies /insights /contact; do
  printf '%-20s %s\n' "$p" "$(curl -so /dev/null -w '%{http_code}' "$URL$p")"
done
# /services redirects to /services/what-we-do. `permanent: true` in redirects.ts
# means Next emits 308, NOT 301 — expect 308 here, not 200 and not 301.
printf '%-20s %s\n' /services "$(curl -so /dev/null -w '%{http_code}' "$URL/services")"
curl -s "$URL/sitemap.xml" | grep -c '<loc>'
```

Then sign in to `/admin` (proves OAuth + DB + secrets), load a media-bearing
page (proves S3 + CloudFront OAC), and submit the contact form (proves the
HubSpot build args survived).

---

## 5. Hand-off when you don't own the target account

The AWS account belongs to SEQTEK's account admin, and the website owner has no
credentials in it.

**The current hand-off is §2.9**, rebuilding a lane's database: account admin
steps 1–3, website owner steps 4–7. The rest of this section is a fresh-account
standup in the retired layout; see the status note at the top.

That splits cleanly, because **the entire content half needs no AWS access at
all.** The seeders write over the REST API with an `/admin` session JWT — which
is exactly why they were built that way (nothing outside AWS reaches the lanes'
database or bucket). So the account admin never has to learn this codebase, and the
website owner never needs an IAM user.

This repo is public: send the account admin a link to this file rather than a
copy of it.

### Lane A — the account admin (AWS only)

Everything is under `infra/`; no application knowledge needed. Needs from the
website owner first: a Google OAuth client id/secret for `@seqtechllc.com` and a
Slack incoming webhook URL (§1.3).

1. §1.1 — `cdk bootstrap`, then **`SeqtekProdNetwork` first**. It creates the
   account-wide GitHub OIDC provider; deploying staging first leaves every later
   deploy failing at assume-role.
2. §1.3 — put the three manual SSM parameters in place
3. §1.5 — deploy the remaining stacks
4. §2.6 — accept the Route 53 domain transfer **within 3 days** of it being
   initiated from the old account, then apply the new zone's nameservers

Then report back three things and **stop**:

- the **account ID** — for the GitHub environment variable
- the **CloudFront distribution domain** (`SeqtekProdEdge` / `SeqtekStagingEdge`
  output `SiteUrl`) — the site is reachable there before any DNS exists
- confirmation that **nobody has signed in to `/admin` yet**

> **Do not sign in to `/admin`.** The first person to sign in becomes the sole
> admin; everyone after is provisioned as `editor`, and an editor cannot delete
> records or manage accounts. Leave the first sign-in to whoever runs Lane B, or
> expect to promote them afterwards.

### If the account admin also has GitHub access

It removes a round-trip but does **not** move the boundary, because
`docs/content-drafts/` is **gitignored**. Repo access at any level carries no
content — the drafts live only on the website owner's machine. Media is
different: the originals are fetched from the old environment's public URLs, so
anyone can pull those.

What each GitHub permission actually buys:

| Permission | Can do                                                              |
| ---------- | ------------------------------------------------------------------- |
| `read`     | read the code and this runbook. **Cannot** deploy or set variables. |
| `write`    | run the **Deploy** workflow (Lane B step 2)                         |
| `admin`    | set `AWS_ACCOUNT_ID` on the environments (Lane B step 1)            |

So the useful grant is **`write`**: the account admin can then finish the infra
lane himself — set up the account, deploy the app, and confirm the site answers
on its CloudFront URL — without waiting on anyone. The environment variables are
set-and-forget and can be done once by any repo admin; full admin for the
account admin is not required.

The content load (Lane B steps 3-5) stays with whoever holds the drafts, and
that person must still take the **first** `/admin` sign-in.

### Lane B — the website owner (no AWS access)

1. GitHub → Settings → Environments → set `AWS_ACCOUNT_ID` on `staging` and
   `production` to the new account (§1.2), plus deployment branch/tag
   restrictions on `production`
2. Deploy the app: Actions → **Deploy** → choose env, stack-filter `*` (§1.6)
3. Sign in to `/admin` on the new site **first** — this provisions the bootstrap
   admin
4. Prime media (§2.1), seed content (§2.2), verify against the old environment
   (§2.3) — all over REST with the token from step 3
5. Add the new callback URL to the Google OAuth client (§2.5)

### What still needs the old account

Only the source side of the domain move:
`transfer-domain-to-another-aws-account` must run from the account holding
`seqtek-preview.com` today (§2.6). Keep that account alive until §2.7 step 6 —
it is the rollback, and it is still the source of the 65 media originals.
