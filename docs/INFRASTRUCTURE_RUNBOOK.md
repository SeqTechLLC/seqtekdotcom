# Infrastructure Runbook

**Living operational doc.** Three procedures:

| §   | Procedure                                                                                 | When                                |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | [Stand up a fresh AWS account](#1-stand-up-a-fresh-aws-account)                           | New account, nothing exists yet     |
| 2   | [Migrate an environment to another account](#2-migrate-an-environment-to-another-account) | Moving a running env, data included |
| 3   | [Cut `seqtek.com` over to prod](#3-cut-seqtekcom-over-to-prod)                            | Launch                              |

Design rationale lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md) (§ Promotion model,
§ Environments & isolation). `specs/002-aws-cdk-infrastructure/quickstart.md` was
the original first-deploy walkthrough and is **superseded by this file** — it
predates the promotion model and describes merges to `main` deploying prod.

---

## Facts this runbook assumes

Nothing in the CDK hardcodes an AWS account. `stackEnv()` reads
`CDK_DEFAULT_ACCOUNT`, the OIDC deploy role derives from `stack.account`, and
`deploy.yml` resolves `vars.AWS_ACCOUNT_ID`. **Retargeting an account is a
variable change plus a bootstrap, not a code change.**

Two ordering traps, both of which fail _after_ a successful-looking deploy:

1. **`SeqtekProdNetwork` must be the first stack in any new account.** The
   GitHub OIDC provider is account-wide and may exist exactly once; prod's
   NetworkStack **creates** it and staging **imports** it at a deterministic
   ARN. Deploy staging first into an empty account and CloudFormation happily
   creates a role trusting a provider that does not exist — every deploy then
   fails at assume-role. (This is why `SeqtekProdNetwork` is the one prod stack
   deployed in the current account.)
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

Settings → Environments → create **`staging`** and **`production`**.

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

### 1.4 Domain (optional per env)

Prod intentionally runs on the CloudFront default URL until launch —
`cdk.json` has `domainName: null` for prod, and that is correct pre-cutover.
For a vanity domain, register or transfer it (see §2.4), then set both
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

The site's **content lives in Postgres and S3, not in the repo** — a deploy
ships code, never content. So a migration is: stand up the new account (§1),
move the data, move the domain, cut over.

### 2.1 What actually has to move

Snapshot of the source account `600881993295` (`seqtek-kenn`) at 2026-08-10:

| Resource      | Identifier                                                                                             | How it moves                                      |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| RDS           | `seqtekstagingdata-databaseb269d8bb-a32opdorbpno` — Postgres 18.3, db.t3.micro, 20 GB, **unencrypted** | snapshot share (no KMS grant needed) or `pg_dump` |
| S3 media      | `seqtek-media-staging` — **473 objects, 78 MB**                                                        | `aws s3 sync`                                     |
| SSM           | 8 params under `/seqtek/website/staging/`                                                              | recreate (2 are SecureString)                     |
| Secrets Mgr   | `payload-secret`, `db-master`, `revalidation-secret`                                                   | recreate; new values are fine                     |
| ECR           | `seqtek-website`                                                                                       | **nothing** — the pipeline rebuilds               |
| CloudFront    | `E353O1IA36B0IY` (`seqtek-preview.com`)                                                                | recreated by CDK                                  |
| Route53 zones | `seqtek-preview.com`, `seqtek-assessments.com`                                                         | see §2.4                                          |
| ACM           | `seqtek-preview.com`                                                                                   | recreated free by DNS validation                  |

Being unencrypted makes the RDS move markedly easier — encrypted snapshots
additionally require sharing the KMS key and re-encrypting on copy.

### 2.2 Move the database

Option A — snapshot share (fewer moving parts, keeps exact state):

```sh
SRC=600881993295 ; DST=<target account id>
SNAP=seqtek-migration-$(date +%Y%m%d%H%M)

# In the SOURCE account
aws rds create-db-snapshot --profile seqtek-kenn \
  --db-instance-identifier seqtekstagingdata-databaseb269d8bb-a32opdorbpno \
  --db-snapshot-identifier "$SNAP"
aws rds wait db-snapshot-available --profile seqtek-kenn --db-snapshot-identifier "$SNAP"
aws rds modify-db-snapshot-attribute --profile seqtek-kenn \
  --db-snapshot-identifier "$SNAP" \
  --attribute-name restore --values-to-add "$DST"

# In the TARGET account — copy locally, then restore
aws rds copy-db-snapshot --profile <target> \
  --source-db-snapshot-identifier "arn:aws:rds:us-east-1:${SRC}:snapshot:${SNAP}" \
  --target-db-snapshot-identifier "$SNAP"
```

Restoring a snapshot creates a **new instance outside CDK's control**. Prefer
Option B unless you need a byte-exact copy, because a CDK-managed instance that
CloudFormation created is the thing the rest of the stack expects.

Option B — logical dump into the CDK-created instance (**recommended**):

```sh
# Source URL from Secrets Manager; RDS is private, so run from a host in the VPC
# (SSM Session Manager to an ASG instance) or via an SSM port-forward tunnel.
pg_dump --no-owner --no-acl -Fc "$SOURCE_DATABASE_URL" -f site.dump
pg_restore --no-owner --no-acl -d "$TARGET_DATABASE_URL" site.dump
```

Payload runs migrations on container start; the schema will already match the
image being deployed. Verify content survived before cutting over:

```sh
curl -s "$TARGET_URL/api/pages?limit=0"        | jq .totalDocs
curl -s "$TARGET_URL/api/caseStudies?limit=0"  | jq .totalDocs
# Compare against the source. As of 2026-08-10: 6 pages, 5 posts,
# 5 case studies, 3 workshops, 10 team members — all published.
```

### 2.3 Move the media

```sh
aws s3 sync s3://seqtek-media-staging s3://<new-bucket> \
  --source-region us-east-1 --region us-east-1
aws s3 ls s3://<new-bucket> --recursive --summarize | tail -2   # expect 473 objects
```

Media is served through CloudFront `/media/*` (ADR 0008), so the bucket is
private and reached by OAC — object URLs do not change as long as filenames
don't. Filenames are the seeder's identity key, so **do not let anything rename
them** during the copy.

### 2.4 Move the domain

`seqtek-preview.com` is registered in Route 53 **in the source account**, so it
moves account-to-account without a registrar transfer — no auth code, no 60-day
lock:

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
exists), then point the domain's nameservers at the new zone:

```sh
aws route53domains update-domain-nameservers --domain-name seqtek-preview.com \
  --nameservers Name=ns-1.awsdns-xx.com Name=... # the 4 from the NEW zone
```

Cutover is that nameserver update. Keep the old zone alive until propagation
completes — it is the rollback.

### 2.5 Google OAuth

`/admin` sign-in breaks if the redirect URI isn't registered. Before cutover add
the new environment's URLs to the OAuth client:

```
https://<new-cloudfront-domain>/api/auth/oauth/callback/google
https://seqtek-preview.com/api/auth/oauth/callback/google   (already present)
```

### 2.6 Order of operations

1. §1 in the target account, through a green smoke test on the CloudFront URL
2. Point GitHub's `staging` / `production` environment `AWS_ACCOUNT_ID` at the
   new account
3. Migrate DB (§2.2) + media (§2.3); re-verify content counts
4. Transfer the domain (§2.4); update nameservers
5. Watch both accounts for 24 h
6. Only then decommission the source: delete stacks, **snapshot RDS before
   deleting it**, empty and remove buckets, close out Route 53 zones

### 2.7 Rollback

Before the nameserver switch, rollback is free — the old account is still
serving. After it, revert the nameservers; DNS TTL is the exposure window.
**Do not delete anything in the source account until step 6.**

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
6. Confirm the 301 map serves (`/about` → `/our-story`, `/our-services` →
   `/services`) — those preserve the Wix-era URLs
7. Make `seqtek-preview.com` `noindex` so preview never competes with prod in
   search

---

## 4. Post-change verification

```sh
URL=https://<site>
curl -s "$URL/api/health" | jq
for p in / /our-story /services /workshops /team /case-studies /insights /contact; do
  printf '%-20s %s\n' "$p" "$(curl -so /dev/null -w '%{http_code}' "$URL$p")"
done
curl -s "$URL/sitemap.xml" | grep -c '<loc>'
```

Then sign in to `/admin` (proves OAuth + DB + secrets), load a media-bearing
page (proves S3 + CloudFront OAC), and submit the contact form (proves the
HubSpot build args survived).
