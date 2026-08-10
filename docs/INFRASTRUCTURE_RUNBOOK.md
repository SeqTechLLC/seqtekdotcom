# Infrastructure Runbook

**Living operational doc.** Three procedures:

| §   | Procedure                                                                                 | When                                  |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | [Stand up a fresh AWS account](#1-stand-up-a-fresh-aws-account)                           | New account, nothing exists yet       |
| 2   | [Migrate an environment to another account](#2-migrate-an-environment-to-another-account) | Moving a running env to a new account |
| 3   | [Cut `seqtek.com` over to prod](#3-cut-seqtekcom-over-to-prod)                            | Launch                                |

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

### 2.1 The one exception: media

Media is **not** reproducible from scripts and must be carried across. Of the 65
originals, 27 are curated outputs (`homepage-hero.webp`, `culture-1.webp`,
`team-lake-annual-meeting.webp`, the headshots) whose source-photo choice was a
human decision. The ingest manifest is keyed by sha256, so _which_ of the 1,755
photos in `../photos` became `homepage-hero.webp` is not recorded anywhere
re-runnable.

Fetch the originals from the environment being replaced — they are served
publicly, and Payload regenerates every size variant on upload, so only the 65
originals matter (the ~473 S3 objects are mostly derived sizes):

```sh
SRC=https://seqtek-preview.com
mkdir -p /tmp/media-originals && cd /tmp/media-originals
curl -s "$SRC/api/media?limit=300&depth=0" \
  | jq -r '.docs[].filename' \
  | while read -r f; do curl -fsS -o "$f" "$SRC/media/$f" || echo "MISSING $f"; done
ls | wc -l    # expect 65
```

Keep the filenames byte-identical. `$file` resolves media by filename, so a
rename silently breaks every reference that points at it.

### 2.2 Rebuild

```sh
export IMPORT_BASE_URL=https://<new-environment-url>
export IMPORT_TOKEN=<payload-token cookie from /admin on the NEW env>

# Order matters — later specs resolve $ref against what earlier ones created.
npm run payload:seed -- docs/content-drafts/content-batch.json   # taxonomy, posts, case studies
npm run payload:seed -- docs/content-drafts/team.json
npm run payload:seed -- docs/content-drafts/workshops.json
npm run payload:seed -- docs/content-drafts/services.json
npm run payload:seed -- docs/content-drafts/about.json
npm run payload:seed -- docs/content-drafts/homepage.json
npm run payload:seed -- docs/content-drafts/homepage-layout.json
```

Run each with `--dry-run` first. Seeding is idempotent by the identity field, so
a re-run repairs rather than duplicates.

### 2.3 Verify against the old environment

Slug parity is not content parity — a page edited directly in `/admin` that
never made it back into a draft would seed as the _older_ draft copy. Diff the
rendered output before trusting the cutover:

```sh
for p in / /our-story /services /services/localshoring /workshops /team \
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
   then delete stacks, empty buckets, remove zones

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
