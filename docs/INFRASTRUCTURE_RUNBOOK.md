# Infrastructure Runbook

**Living operational doc.** Five procedures:

| §   | Procedure                                                                                   | When                                  |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | [Stand up a fresh AWS account](#1-stand-up-a-fresh-aws-account)                             | New account, nothing exists yet       |
| 2   | [Migrate an environment to another account](#2-migrate-an-environment-to-another-account)   | Moving a running env to a new account |
| 3   | [Cut `seqtek.com` over to prod](#3-cut-seqtekcom-over-to-prod)                              | Launch                                |
| 4   | [Post-change verification](#4-post-change-verification)                                     | After any of the above                |
| 5   | [Hand-off when you don't own the account](#5-hand-off-when-you-dont-own-the-target-account) | Someone else holds AWS admin          |

Design rationale lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md) (§ Promotion model,
§ Environments & isolation). `specs/002-aws-cdk-infrastructure/quickstart.md` was
the original first-deploy walkthrough; it is **superseded by this file for the
first deploy** (it predates the promotion model and describes merges to `main`
deploying prod), but remains the reference for secret rotation, tear-down, alarm
verification and troubleshooting.

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

### 2.1 Media must be primed FIRST

**Order is not optional.** The drafts reference media 61 times by `$ref`
(resolve an existing media doc by filename) and only 10 times by `$file`
(upload-or-reuse). Seed content into an empty media collection and those 61
references resolve to nothing — you get the whole site with almost no images.
Prime media, then seed content.

Media is also the one thing genuinely **not** reproducible from scripts. Of the
65 originals, 27 are curated outputs (`homepage-hero.webp`, `culture-1.webp`,
`team-lake-annual-meeting.webp`, the headshots) whose source-photo choice was a
human decision, and `tools/ingest-photos` keys its manifest by sha256 — so
_which_ of the ~900 photos in `../photos` became `homepage-hero.webp` is
recorded nowhere re-runnable. Re-running the ingest will not reproduce them.

So carry the originals across from the environment being replaced. They are
served publicly, and Payload regenerates every size variant on upload — which is
why only the 65 originals matter, not the ~473 S3 objects.

```sh
SRC=https://seqtek-preview.com
DIR=/tmp/media-originals && mkdir -p "$DIR"

# Fetch every original, and build the manifest push-to-payload expects,
# carrying the ORIGINAL alt text across (alt is required on upload).
curl -s "$SRC/api/media?limit=300&depth=0" > "$DIR/media.json"
python3 - "$DIR" "$SRC" <<'PY'
import json, os, sys, urllib.request
d, src = sys.argv[1], sys.argv[2]
docs = json.load(open(os.path.join(d, "media.json")))["docs"]
man = []
for m in docs:
    fn = m.get("filename")
    if not fn:
        continue
    urllib.request.urlretrieve(f"{src}/media/{fn}", os.path.join(d, fn))
    # push-to-payload reads `curated` (the filename in --dir) and `alt`.
    man.append({"curated": fn, "source": fn, "kind": "photo", "slot": "",
                "people": [], "alt": m.get("alt") or fn})
json.dump(man, open(os.path.join(d, "manifest.json"), "w"), indent=2)
print(f"{len(man)} originals + manifest.json")
PY

# Push them into the NEW environment (idempotent — skips filenames already there)
IMPORT_BASE_URL=https://<new-env> IMPORT_TOKEN=<token> \
  npx tsx tools/ingest-photos/push-to-payload.ts --dir "$DIR" --dry-run
```

**If the target is gated** (`cognitoAuthEnabled: true`, per §1.3a — the prod
configuration), the ALB 302s every path including `/api/*`, so `IMPORT_TOKEN`
alone never reaches Payload. Export the proxy's session cookie as well, or the
push fails with `likely behind an auth proxy`:

```sh
export IMPORT_COOKIE='AWSELBAuthSessionCookie-0=<value>; AWSELBAuthSessionCookie-1=<value>'
```

`tools/payload-seed/README.md` §"Getting `IMPORT_COOKIE`" has the DevTools
steps. Every REST tool here reads it: `push-to-payload`, `rekey-staging`,
`push-staging` and `payload:seed`.

Drop `--dry-run` to write. Keep filenames byte-identical — `$ref` and `$file`
both key on filename, so a rename silently orphans every reference to it.

### 2.2 Then rebuild the content

```sh
export IMPORT_BASE_URL=https://<new-environment-url>
export IMPORT_TOKEN=<payload-token cookie from /admin on the NEW env>
# Gated target (cognitoAuthEnabled, §1.3a)? Also export the proxy cookie —
# see §2.1. Without it the globals at the end of this list are the ones most
# likely to report success while writing nothing.
export IMPORT_COOKIE='AWSELBAuthSessionCookie-0=<value>; AWSELBAuthSessionCookie-1=<value>'

# Order matters — later specs resolve $ref against what earlier ones created.
# `global-site-settings` and `global-navigation` are deliberately absent: both
# globals were withdrawn in spec 011 (site chrome is code-owned, ADR 0010), and
# payload-seed accepts any string as a global slug, so listing them here would
# PATCH a route that no longer exists and report success.
for f in categories industries testimonials team service-pillars services \
         case-studies posts workshops pages partners global-homepage; do
  npm run payload:seed -- docs/content-drafts/$f.json
done
```

> **Reconciled 2026-08-11.** This list previously named `content-batch.json`,
> `about.json`, and `homepage.json`. Those predate the spec-010 block migration —
> they carry the legacy discrete body fields but **no `layout` array**, so seeding
> them into a fresh environment loads content that renders as an **empty body**,
> and reports success while doing it. They now live in
> `docs/content-drafts/_archive/`. The files above are a verified-portable mirror
> of staging (58 docs, 84 `$ref`s, 0 unresolved) carrying both the legacy fields
> and the real `layout`. See `docs/content-drafts/README.md`.
>
> Load `industries.json` before `case-studies.json`: the five industry records are
> missing on staging today, which is why every case study there has a dangling
> `industry` reference. Seeding in this order repairs it.

Run each with `--dry-run` first. Seeding is idempotent by the identity field, so
a re-run repairs rather than duplicates. A `$ref` that cannot resolve is
reported — if you see those, media priming (§2.1) did not complete.

### 2.3 Verify against the old environment

Slug parity is not content parity — a page edited directly in `/admin` that
never made it back into a draft would seed as the _older_ draft copy. Diff the
rendered output before trusting the cutover:

```sh
# NOTE: no /services/<slug> probe. SVC-2 made those content slugs, and none is
# seeded yet, so a probe there would 404 on BOTH sides and pass vacuously. Add
# one once a service is published on the lane you are comparing.
for p in / /our-story /services /workshops /team \
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

## 2.9 Before a destructive migration: snapshot first

Some migrations drop columns and tables — spec 011's expand/contract close is the
first, shipped as `20260824_201317_spec011_drop_inert_fields` plus
`20260824_214311_spec011_drop_stats_bar_source`. Those are not recoverable by
re-running anything.

**Merging IS deploying, and deploying IS migrating.** A push to `main` promotes
the ww3 lane (`deploy.yml`, `IS_RELEASE`), the container's `CMD` is
`npx payload migrate && node server.js` (`Dockerfile:134`), and the `preview`
GitHub Environment has no approval rule. There is no manual step between the
merge button and the migration, and there is no separate staging lane to
rehearse in — that account was retired 2026-08-14.

So the one safety step happens **before you press merge**:

```sh
aws rds create-db-snapshot \
  --db-instance-identifier <instance> \
  --db-snapshot-identifier pre-spec011-drop-inert-fields
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier pre-spec011-drop-inert-fields
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
6. Confirm the 301 map serves (`/about` → `/our-story`, `/our-services` →
   `/services`) — those preserve the Wix-era URLs
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
for p in / /our-story /services /workshops /team /case-studies /insights /contact; do
  printf '%-20s %s\n' "$p" "$(curl -so /dev/null -w '%{http_code}' "$URL$p")"
done
curl -s "$URL/sitemap.xml" | grep -c '<loc>'
```

Then sign in to `/admin` (proves OAuth + DB + secrets), load a media-bearing
page (proves S3 + CloudFront OAC), and submit the contact form (proves the
HubSpot build args survived).

---

## 5. Hand-off when you don't own the target account

The common case here: the AWS account belongs to someone else (SEQTEK's infra
admin is **domanick@seqtechllc.com**), and the person who knows the website has
no credentials in it.

That splits cleanly, because **the entire content half needs no AWS access at
all.** The seeders write over the REST API with an `/admin` session JWT — which
is exactly why they were built that way (staging and prod have no direct DB or
S3 access). So the account admin never has to learn this codebase, and the
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
> admin; everyone after is provisioned as `editor`. `Categories` is admin-only
> for create/update and the content load writes 3 categories, so an editor
> cannot finish it. Leave the first sign-in to whoever runs Lane B, or expect to
> promote them afterwards.

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
