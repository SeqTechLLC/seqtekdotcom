# SEQTEK Website — Architecture

What the system is and why. Procedures live in [`INFRASTRUCTURE_RUNBOOK.md`](./INFRASTRUCTURE_RUNBOOK.md);
open work lives in [`ROADMAP.md`](./ROADMAP.md).

---

## 1. Tech Stack

| Component | Choice                                                           | Why                                                                                                                                        |
| --------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework | Next.js 16 (App Router, TypeScript)                              | React server rendering; Payload embeds in it                                                                                               |
| CMS       | Payload CMS v3, self-hosted, in the same process                 | TypeScript-native, Postgres-backed, generates schema, REST/GraphQL and admin from config                                                   |
| Database  | Amazon RDS PostgreSQL 18                                         | Managed backups; one instance serves both lanes ([ADR 0004](decisions/0004-postgres-18.md))                                                |
| Compute   | ECS Fargate behind an ALB and CloudFront                         | Payload is a long-lived process with a connection pool and migrations on start; no instances                                               |
| Container | Docker image in Amazon ECR                                       | One build per commit, promoted unchanged                                                                                                   |
| Styling   | Tailwind CSS v3                                                  | Tokens in `tailwind.config.mjs` ([ADR 0001](decisions/0001-tailwind-v3.md))                                                                |
| Rich text | Lexical (`@payloadcms/richtext-lexical`)                         | Payload's editor; inline blocks render through a registry                                                                                  |
| Media     | S3 via `@payloadcms/storage-s3`, served by CloudFront `/media/*` | Payload generates size derivatives; `ResponsiveImage` renders them as `<picture>` ([ADR 0008](decisions/0008-media-cloudfront-serving.md)) |
| Fonts     | Nunito Sans via `next/font/google`                               | Self-hosted at build time from this origin, so `font-src 'self'` holds; `styles.css` builds the families on `--font-nunito-sans`           |
| IaC       | AWS CDK (TypeScript), `infra/`                                   | §13                                                                                                                                        |

Payload and Next are coupled: `@payloadcms/next` declares the Next range it supports, so upgrade them
together, and if a Next minor breaks the pair, downgrade Next before Payload. Exact versions are in
`package.json`.

---

## 2. Content Model

Every page renders through one of two primitives ([ADR 0009](decisions/0009-block-first-composition.md)):
a **block-composed page**, whose body is a `layout` blocks array dispatched by `RenderBlocks`, or the
**post**, the one bespoke rich-text body. The layout library is thirteen blocks, pinned by
`tests/int/blocks/allowedBlocks.int.spec.ts` ([ADR 0013](decisions/0013-thirteen-blocks.md),
[`BLOCK_LIBRARY.md`](./BLOCK_LIBRARY.md)). Rearranging a page is a publish; only a block fix or a new
block option needs code.

| Collection     | Route                                   | Body      | Notes                                                                                                            |
| -------------- | --------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `pages`        | `/[slug]`                               | `layout`  | Generic pages, including `/industries` and `/our-story`                                                          |
| `posts`        | `/insights`, `/insights/[slug]`         | `content` | Rich text with inline blocks; author, categories, related services                                               |
| `caseStudies`  | `/case-studies`, `/case-studies/[slug]` | `layout`  | The route renders the header and `<h1>`; `client.isAnonymized` hides the client                                  |
| `services`     | `/services/[slug]`                      | `layout`  | `tier`: `leaf` (a service), `group` (orders its `items`), `axis` (a menu root). `/services` 301s to `what-we-do` |
| `industries`   | `/industries/[slug]`                    | `layout`  | Published-only route: a draft industry works as a tag while its URL 404s                                         |
| `workshops`    | `/workshops`, `/workshops/[slug]`       | `layout`  | The route renders the header                                                                                     |
| `teamMembers`  | `/team`, `/team/[slug]`                 | `layout`  | The route renders the header; also post authors                                                                  |
| `partners`     | `/partners`, `/partners/[slug]`         | `layout`  | Reference implementation of a metadata collection with a block body                                              |
| `locations`    | —                                       | —         | Market records, listed by the `cards` block                                                                      |
| `testimonials` | —                                       | —         | Quotes, drawn by the `quote` block                                                                               |
| `categories`   | —                                       | —         | Post topics                                                                                                      |
| `navigation`   | —                                       | —         | The header menu ([ADR 0010](decisions/0010-site-chrome-code-owned.md) amendment)                                 |
| `media`        | `/media/<filename>`                     | —         | Uploads; `alt` required                                                                                          |
| `users`        | —                                       | —         | Admin accounts, Google SSO only                                                                                  |

The one global, `homepage`, is a `layout` rendered at `/`. Every collection with a public route has drafts
(`_status`), live preview (`livePreviewFor()`) and an `seo` group; a future `publishedAt` forces a draft
(`enforceDraftWhenScheduled`). Because `services` holds all three tiers, every relationship to it filters
by tier.

Site chrome other than the header menu (company name, tagline, contact details, address, social links,
footer and legal navigation) is code-owned in `src/lib/site-content.ts`, which also holds the header menu
served while `navigation` is empty. `tests/int/render/organizationLd.int.spec.ts` pins the values that
feed the `Organization` JSON-LD.

---

## 3. Rendering Strategy

Public routes render per request: the layout reads the per-request CSP nonce through `headers()`, which
makes every route dynamic. Page **data** is cached. Each reader in `src/lib/payload.ts` wraps
`unstable_cache` with a one-hour `revalidate` and cache tags, and a 5-second read timeout
([ADR 0005](decisions/0005-isr-unstable-cache-tag-parity.md),
[ADR 0007](decisions/0007-read-timeout.md)). `generateStaticParams` is not used.

**Revalidation.** A publish runs `revalidateOnChange('<slug>')` in the Payload process. It calls
`revalidateTag(tag, { expire: 0 })` for the collection's list and detail tags, `revalidatePath` where a
path is affected, and a targeted CloudFront invalidation for the affected paths.
`invalidateMediaOnChange` invalidates `/media/*` paths when a file is replaced or deleted. External callers
use `POST /api/revalidate` with `Authorization: Bearer <REVALIDATION_SECRET>` and a body of
`{ tags, paths }`.

### CloudFront Cache Behaviors

| Path pattern      | Origin | Cache policy                                                     |
| ----------------- | ------ | ---------------------------------------------------------------- |
| Default (`*`)     | ALB    | `CachingDisabled` (HTML is dynamic)                              |
| `/_next/static/*` | ALB    | `CachingOptimized`, but `CachingDisabled` while the env is gated |
| `/media/*`        | S3     | `CachingOptimized`                                               |
| `/admin/*`        | ALB    | `CachingDisabled`                                                |
| `/api/*`          | ALB    | `CachingDisabled`                                                |

Both lanes share one distribution, and its cache key does not include the host. Caching the gated
behaviors would serve one visitor's login redirect to everyone, which is why `/_next/static/*` is not
cached while `cognitoAuthEnabled` is on. A CloudFront Function copies the viewer's `Host` into
`x-forwarded-host` so the ALB can route by lane. There is no deploy-time invalidation.

---

## 4. Directory Structure

```
src/
  app/(frontend)/     public routes, layout, error pages, sitemap, /api/revalidate
  app/(payload)/      Payload admin and API, /api/health, /api/csp-report, auth routes
  collections/        one config per collection (+ groups.ts, index.ts)
  globals/            Homepage.ts
  payload/            access, blocks (layout + inline), editor, fields, hooks, livePreview, seed, storage
  components/         ui, layout, sections (block renderers + registry), cards, richText, forms,
                      integrations, analytics, seo, error, admin
  lib/                cached readers, metadata, structured data, CSP, redirects, site content,
                      HubSpot submit, CloudFront invalidation, auth helpers
  migrations/         one baseline migration (2026-09-24) plus any after it
  proxy.ts            CSP nonce, maintenance mode, 410 for retired feeds
  payload.config.ts
infra/                AWS CDK (§13)
tools/                payload-seed, payload-export, payload-rest, ingest-photos, link-sweep, and other tooling
tests/                Vitest (int) and Playwright (e2e, a11y, visual)
docs/                 this doc, ROADMAP, contracts/, decisions/
```

---

## 5. Deployment Architecture

```
GitHub (public repo)
  merge to main ──► build image, push to ECR ──► cdk deploy SeqtekPreviewCompute
  publish release ─► resolve an existing image ─► cdk deploy (ww3 lane only moves)

CloudFront (ACM cert for seqtek.com + *.seqtek.com; aliases preview. and ww3.)
  │   CloudFront Function: Host ─► x-forwarded-host
  ├─► S3 media bucket (/media/*, Origin Access Control)
  └─► ALB (HTTPS 443, Cognito gate on each gated lane)
        ├─ default action ────────────► preview lane: Fargate service, database seqtek_preview
        └─ x-forwarded-host = ww3... ─► ww3 lane:     Fargate service, database seqtek_prod
                                              │
                                              ▼
                              RDS PostgreSQL (one instance, isolated subnets)
```

Both lanes live in the `SeqtekPreview*` stacks in one AWS account. Each lane is an ECS task definition,
service and target group. Tasks run in public subnets with public IPs (the VPC has no NAT) and accept
port 3000 from the ALB only. The container runs `payload migrate` and then `node server.js`; the ww3
lane's command first creates `seqtek_prod` if it is missing. Services use a rolling deployment with the
ECS circuit breaker (`rollback: true`): a task that fails the ALB health check rolls the service back to
its previous task definition.

### Container

A multi-stage `node:24-alpine` build with `output: 'standalone'`. `NEXT_PUBLIC_*` values and the build
identity (`BUILD_COMMIT`, `BUILD_VERSION`) are build args, because Next inlines them at build time. Tasks
get AWS access from their task role (S3 read/write on the bucket, CloudWatch metrics, and a
distribution-scoped `cloudfront:CreateInvalidation` granted by the Edge stack); the execution role reads
the Secrets Manager secrets and SSM parameters injected at task start. No static AWS credentials exist
anywhere.

### Media Storage — S3 + CloudFront with Origin Access Control

The bucket `seqtek-media-preview` is private (Block Public Access on, `BucketOwnerEnforced`, SSE-S3,
versioned) and read only by the distribution through Origin Access Control. Both lanes share it.

**Object key contract.** Payload stores uploads at `media/<filename>`, with size derivatives as flat
siblings under the same prefix. The `/media/*` behavior has no origin path, so the public URL path is the
object key: `https://<site>/media/<filename>` is key `media/<filename>`. `mediaFileURL()`
(`src/payload/storage/s3.ts`) builds URLs from `NEXT_PUBLIC_SITE_URL` and the stored prefix. The adapter,
the CDN behavior and this section are one contract ([`contracts/media-url.md`](./contracts/media-url.md)).
Keys are stable, so replacing a file invalidates its paths; a new upload needs no invalidation. Without
S3 env vars (local dev, CI) the adapter is disabled and uploads go to the local filesystem. A missing
object returns 403, since the 403→404 remap is not configured.

**Lifecycle.** Noncurrent versions move to Glacier Instant Retrieval after 90 days and expire after 365.
Current versions never expire. Incomplete multipart uploads abort after 7 days.

### Deployment Pipeline

`deploy.yml`, on a push to `main` (docs-only changes are skipped):

1. Build the image and push it to ECR, tagged with the commit SHA and the build version.
2. `cdk deploy SeqtekPreview*Compute` with `-c imageTag=<sha>`, holding the ww3 lane at the tag it is
   running.
3. Run the post-deploy smoke (`tests/e2e/post-deploy-smoke.e2e.spec.ts`) against the lane.
4. Post the outcome to Slack through `slack-notify.yml`.

`cdk deploy` blocks until the ECS deployment is healthy or rolled back.

### Promotion model — what deploys where

| Trigger                                | Deploys to                  | Lane      | Builds? |
| -------------------------------------- | --------------------------- | --------- | ------- |
| Push to `main`                         | preview.seqtek.com (UAT)    | primary   | yes     |
| Merge the Release-Please PR            | nothing                     | —         | no      |
| Publish a GitHub Release               | ww3.seqtek.com (production) | secondary | no      |
| Deploy workflow, `env: prod`, `target` | ww3.seqtek.com              | secondary | no      |
| Deploy workflow, `env: preview`        | preview.seqtek.com          | primary   | yes     |

**One build, promoted unchanged.** A `main` build tags its image with the commit SHA and a build version
(`MAJOR.MINOR` from the last release tag, `PATCH` = that patch plus commits since). Promotion points the
ww3 task definition at an image that already exists. Nothing is rebuilt, because a rebuild would ship
bits nobody tested.

**Resolution.** A release tag `vX.Y.Z` resolves to the image tagged `X.Y.Z` and deploys it by its commit
tag. A dispatch `target` accepts a version, a commit SHA or a branch. If no image matches, the run fails
with `No image tagged '<x>' in seqtek-website` and nothing is promoted. Rollback is promoting an older
version.

**Both lanes are stated on every deploy.** `cdk deploy` re-renders both task definitions, so the lane that
is not moving is pinned to the image tag and `RELEASE_VERSION` it is running, read back from its ECS
service. `compute-stack.ts` has no fallback for `secondaryImageTag`: a deploy that cannot say what
production runs fails the synth.

A release created by the default `GITHUB_TOKEN` raises no workflow run, so a release has to be published
by a person to promote. Merging the release PR only changes the version and CHANGELOG, and `deploy.yml`
skips that commit by its message.

`/api/health` reports what a lane runs: `version` and `commit` are baked into the image, and `release` is
set at promotion and is `null` on a lane that was never released.

Production deploys fail closed unless the `production` GitHub Environment exists with its tag and branch
policies and `PROD_ENVIRONMENT_CONFIGURED=true` ([`INFRASTRUCTURE_RUNBOOK.md`](./INFRASTRUCTURE_RUNBOOK.md)
§3). The Cognito gate is index control, not access control: it keeps search engines out until cutover.

### Environments & isolation

`infra/cdk.json` defines three CDK envs; only `preview` is deployed. Its `secondaryLane` is the ww3
production lane, so production and UAT share one VPC, ALB, RDS instance, media bucket, ECR repository,
secrets and SSM tree, and are isolated by database, task definition, target group and host rule.
Deleting `SeqtekPreviewData` would delete production's database with it: the instance has no deletion
protection outside the `prod` env.

The preview env imports an existing VPC (`existingVpc`) and adds its own subnets. Two resources are
account-wide singletons, and ownership is explicit config:

| Resource             | Owner flag                 | `preview`                          |
| -------------------- | -------------------------- | ---------------------------------- |
| ECR repository       | `ownsAccountEcrRepository` | `false` — imports `seqtek-website` |
| GitHub OIDC provider | `ownsAccountOidcProvider`  | `true`                             |

The deploy workflow reads the account from the `AWS_ACCOUNT_ID` secret on the `preview` or `production`
GitHub Environment. Local development uses Docker Compose Postgres and never touches a lane.

**Configuration.** Runtime secrets (database credentials, `PAYLOAD_SECRET`, `REVALIDATION_SECRET`, the
Google client secret) come from Secrets Manager and SSM, injected into the task at start. Plain values
the stack knows are set directly in the task environment. `NEXT_PUBLIC_*` values are Docker build args.

### DNS & TLS

CloudFront terminates TLS with an ACM certificate for `seqtek.com` and `*.seqtek.com`, validated in the
`seqtek.com` hosted zone. CDK creates Route 53 alias records only for the names in `dnsRecordNames`
(`preview.seqtek.com`, and `ww3.seqtek.com` for the secondary lane). The ALB listens on 443 from the
CloudFront prefix list only. There is no www-to-apex redirect.

### Network

RDS sits in isolated subnets and accepts 5432 from the app security group only. Payload uses the
`@payloadcms/db-postgres` pool with its default size.

### Next.js Configuration

`next.config.ts` wraps the config in `withPayload()` and sets `output: 'standalone'`,
`images.localPatterns` (`/brand/**` for the header and footer logos, the only `next/image` users, and
`/api/media/file/**`), the security headers in §6, and the redirect map from `src/lib/redirects.ts`,
which `tests/int/config/redirects.int.spec.ts` pins.

---

## 6. Security Model (Public Repo)

### Environment Variables

The one list. `.env.example` carries local defaults.

| Variable                                                                      | Scope  | Class      | Source in the lanes                        | Purpose                                              |
| ----------------------------------------------------------------------------- | ------ | ---------- | ------------------------------------------ | ---------------------------------------------------- |
| `DATABASE_URL`                                                                | Server | **Secret** | Assembled at start from `DB_*` secrets     | Postgres connection                                  |
| `PAYLOAD_SECRET`                                                              | Server | **Secret** | Secrets Manager                            | Signs admin session tokens                           |
| `REVALIDATION_SECRET`                                                         | Server | **Secret** | Secrets Manager                            | Bearer token for `/api/revalidate`                   |
| `GOOGLE_CLIENT_ID`                                                            | Server | Config     | SSM                                        | `/admin` Google sign-in                              |
| `GOOGLE_CLIENT_SECRET`                                                        | Server | **Secret** | SSM `SecureString`                         | `/admin` Google sign-in                              |
| `S3_BUCKET`, `S3_BUCKET_HOSTNAME`, `S3_REGION`                                | Server | Config     | Task environment                           | Media storage; the hostname also feeds CSP `img-src` |
| `CLOUDFRONT_DISTRIBUTION_ID`                                                  | Server | Config     | SSM (written by the Edge stack)            | Targeted invalidations                               |
| `COGNITO_LOGOUT_URL`, `COGNITO_CLIENT_ID`                                     | Server | Config     | Task environment, gated lanes only         | `/api/auth/gate-logout`                              |
| `RELEASE_VERSION`                                                             | Server | Config     | Task environment, ww3 lane                 | `release` in `/api/health`                           |
| `CSP_MODE`                                                                    | Server | Config     | Unset (defaults to `report-only`)          | `enforce` \| `report-only` \| `off`                  |
| `MAINTENANCE_MODE`                                                            | Server | Config     | Unset                                      | `true` serves the maintenance page (ERROR_PAGES §4)  |
| `PAYLOAD_DISABLE_PUSH`                                                        | Server | Config     | Local and CI only                          | Turns off Drizzle push outside production            |
| `AWS_REGION`                                                                  | Server | Config     | Set by ECS                                 | AWS SDK region                                       |
| `NEXT_PUBLIC_SITE_URL`                                                        | Both   | Public     | Task environment, from `dnsRecordNames[0]` | Canonical URLs, sitemap, media URLs                  |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID`                                               | Client | Public     | Build arg                                  | HubSpot tracking and Forms API                       |
| `NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID`, `NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID` | Client | Public     | Build arg                                  | HubSpot form GUIDs                                   |
| `NEXT_PUBLIC_GTM_ID`                                                          | Client | Public     | Build arg, empty in both lanes             | GTM loads only when set                              |
| `BUILD_COMMIT`, `BUILD_VERSION`                                               | Server | Public     | Build arg                                  | `commit` and `version` in `/api/health`              |

`.env*.local` is gitignored; `.env.example` has no secrets.

### Payload Admin Authentication

`/admin` sign-in is Google Workspace SSO through custom routes (`src/app/(payload)/api/auth/oauth/…`,
[ADR 0002](decisions/0002-auth-strategy.md), [`contracts/oauth-routes.md`](./contracts/oauth-routes.md)).
The local email/password strategy is disabled.

- The admitted domains are `seqtechllc.com` and `seqtek.com` (`src/lib/auth/allowed-domains.ts`),
  enforced server-side in a `users` `beforeChange` hook.
- The first sign-in on an empty database becomes `admin`; later sign-ins are provisioned as `editor`.
- Users are matched by Google subject ID, so an email change does not duplicate an account.
- Every sign-in attempt is logged as a JSON line to stdout.

### Access Control

| Operation                               | Public | Editor | Admin |
| --------------------------------------- | ------ | ------ | ----- |
| View published content                  | ✓      | ✓      | ✓     |
| View drafts                             | —      | ✓      | ✓     |
| Create content                          | —      | ✓      | ✓     |
| Update own content                      | —      | ✓      | ✓     |
| Update others' content                  | —      | ✓      | ✓     |
| Publish content                         | —      | ✓      | ✓     |
| Schedule publish (future `publishedAt`) | —      | ✓      | ✓     |
| Delete content                          | —      | —      | ✓     |
| Manage users                            | —      | —      | ✓     |
| Manage `categories` (taxonomy)          | —      | ✓      | ✓     |
| Read `media` / `teamMembers`            | ✓      | ✓      | ✓     |
| Read `testimonials` where `!isActive`   | —      | ✓      | ✓     |
| Access `/admin`                         | —      | ✓      | ✓     |

The helpers are `isAdmin` / `isAdminOrEditor` (`src/payload/access/byRole.ts`) and `publishedOrAuthed`,
which lets an editor or admin read drafts and everyone else read `_status = published` only.

**Per-collection overrides:**

- `categories`: editors create and update; delete is admin-only.
- `testimonials`: public reads are filtered to `isActive: true`.
- `users`: read needs a session; create is always denied (accounts come only from sign-in);
  update, delete and unlock are admin-only. `unlock` is declared because Payload's default lets any
  user clear another's lockout.

`tests/int/collections/access.int.spec.ts` checks every cell of this table, and
`tests/int/collections/draftLeak.int.spec.ts` checks that drafts never leak through REST or GraphQL.

**Scheduled publishing.** A future `publishedAt` forces a document back to draft
(`enforceDraftWhenScheduled`). Nothing publishes it automatically when the date arrives; that job is not
built.

### Content Security Policy

`src/proxy.ts` generates a nonce per request, sends it to the layout in a request header, and emits the
policy that `buildCspPolicy` (`src/lib/csp.ts`) builds. The layout applies the nonce to first-party
scripts, the GTM loader and HubSpot tracking; `'strict-dynamic'` trusts what they load.

| Directive                   | Sources                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src`               | `'self'`                                                                                                                                                              |
| `script-src`                | `'nonce-{random}'` `'strict-dynamic'` `'self'`                                                                                                                        |
| `style-src`                 | `'self'`; `'self' 'unsafe-inline'` on `/admin/*` (the Lexical editor)                                                                                                 |
| `img-src`                   | `'self'` `data:` `*.hubspot.com` `*.hsforms.net` and the media host                                                                                                   |
| `font-src`                  | `'self'`                                                                                                                                                              |
| `connect-src`               | `'self'` `*.hubspot.com` `*.hs-analytics.net` `*.hsforms.net` `*.hsforms.com` `*.hs-banner.com` `*.usemessages.com` `*.googletagmanager.com` `*.google-analytics.com` |
| `frame-src`                 | `'self'` `*.hubspot.com` `*.hsforms.net` `meetings.hubspot.com` `*.hubspotusercontent.com` `www.youtube-nocookie.com` `player.vimeo.com`                              |
| `frame-ancestors`           | `'none'`                                                                                                                                                              |
| `base-uri`                  | `'self'`                                                                                                                                                              |
| `form-action`               | `'self'` `*.hsforms.net`                                                                                                                                              |
| `object-src`                | `'none'`                                                                                                                                                              |
| `upgrade-insecure-requests` | Only in `enforce` mode                                                                                                                                                |
| reporting                   | `report-uri /api/csp-report` and `report-to csp-endpoint`                                                                                                             |

`CSP_MODE` sets the mode, and the code default is `report-only`. Neither lane sets it, so both run
report-only. Moving to `enforce` is an environment change; the criteria are in
[`INTEGRATIONS.md`](./INTEGRATIONS.md) §8. `tests/int/lib/csp.int.spec.ts` keeps this table and the code
in parity.

### HTTP Security Headers

`next.config.ts` sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` and
`Permissions-Policy: camera=(), microphone=(), geolocation=()` on every route.

### Abuse and Secrets

CloudFront includes AWS Shield Standard; no WAF is attached. `/api/revalidate` rejects requests without
the bearer token. gitleaks runs in the pre-commit hook and in CI. Nothing that identifies unrelated
infrastructure, internal addresses, or unapproved client names belongs in the repo.

---

## 7. Performance Targets

| Metric                    | Target |
| ------------------------- | ------ |
| Desktop LCP               | <500ms |
| Mobile LCP                | <2.0s  |
| FCP                       | <1.0s  |
| CLS                       | 0      |
| TBT                       | <100ms |
| Lighthouse Performance    | 95+    |
| Lighthouse Best Practices | 95+    |
| Lighthouse SEO            | 95+    |
| Lighthouse Accessibility  | 95+    |

`.lighthouserc.cjs` gates accessibility, best practices and SEO at 0.95 as errors. Performance, LCP, TBT
and CLS are warnings until the numbers are re-measured behind CloudFront on a lane (ROADMAP P3). The
means: server rendering with cached data, `<picture>` media from Payload's size derivatives, third-party
scripts loaded after interaction or consent, Tailwind shipping only the classes used.

---

## 8. Monitoring & Health

`GET /api/health` counts `users` through Payload's pool and returns 200 with `status`, `db`, `version`,
`commit`, `release`, `uptime`, `timestamp` and `responseTimeMs`, or 503 when the database is unreachable.
It bypasses the Cognito gate on both lanes. The ALB target group checks it every 30 s (unhealthy after 2
failures, healthy after 3).

Nine CloudWatch alarms publish to one SNS topic; a Lambda posts them to Slack, with a synthetic heartbeat
every 6 hours so a silent channel means a broken path:

| Alarm                    | Threshold                                             |
| ------------------------ | ----------------------------------------------------- |
| `AlbFiveXx`              | Target 5xx > 5 in 5 min                               |
| `AlbUnhealthyHost`       | Unhealthy hosts > 0 for 2 min (missing data breaches) |
| `EcsCpuHigh`             | CPU > 80% for 10 min                                  |
| `EcsMemoryHigh`          | Memory > 85% for 10 min                               |
| `EcsRunningTaskCountLow` | Running tasks < desired for 2 min                     |
| `RdsCpuHigh`             | CPU > 80% for 10 min                                  |
| `RdsFreeStorageLow`      | Free storage < 2 GiB                                  |
| `RdsConnectionsHigh`     | Connections > 60 for 3 min                            |
| `CloudFrontErrorRate`    | 5xx rate > 1% in 5 min                                |

The ECS alarms watch the primary (preview) service; the ww3 lane has no service-level alarm. Containers
log to CloudWatch Logs through the `awslogs` driver (`/seqtek/website/preview/app` and
`/seqtek/website/preview/prod/app`, 14-day retention).

---

## 9. Backups & Availability

| Resource | Backup                                                           | Recovery                                                                           |
| -------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| RDS      | Automated daily backups, 7-day retention, window 06:00–07:00 UTC | Point-in-time restore; manual snapshots before destructive migrations (runbook §2) |
| S3 media | Versioning; noncurrent versions kept 365 days                    | Restore a previous object version                                                  |
| Images   | ECR keeps tagged images (no CDK lifecycle on the imported repo)  | Promote or deploy an older tag                                                     |
| Tasks    | None; disposable                                                 | Task definition + image + secrets reconstruct them                                 |
| Content  | The content JSON in the private content repo                     | Rebuild a lane's database and reload (runbook §1)                                  |

Each lane runs one task. ECS replaces a task that fails its health check, and a deployment that never
becomes healthy rolls back. RDS is single-AZ, and one instance serves both lanes, so a database failure
takes down UAT and production together; the multi-AZ flip is on the ROADMAP (P3).

---

## 10. Local Development

Docker Compose runs Postgres on port 5433; the app runs with `next dev` on port 3100. Without S3 env vars,
media goes to the local filesystem, and no AWS credentials are needed. See
[`LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md).

---

## 11. Dependency Security Gates

The production audit gate is `npm audit --omit=dev --audit-level=high`, applied twice:

| Where                                     | Mode             | Question                                                  | On failure                     |
| ----------------------------------------- | ---------------- | --------------------------------------------------------- | ------------------------------ |
| `ci.yml` → `quality` (per PR)             | **differential** | does this diff introduce a high+ advisory the base lacks? | blocks the PR                  |
| `deps-hygiene.yml` → `audit-main` (daily) | **absolute**     | is `main`'s production tree clean?                        | opens a `security-audit` issue |

An absolute per-PR gate fails unrelated PRs whenever an advisory is published overnight, so the PR gate
(`tools/audit-diff`) fails only on introduced advisories, and falls back to the absolute gate if the base
can't be established. The daily job is what stops `main` rotting; the two are a pair. Dependabot opens
security and weekly version PRs; it cannot edit `package.json#overrides`, which
`tools/check-stale-overrides` tracks.

---

## 12. Testing Strategy

| Tool                                      | Covers                                                                                        | Runs                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------- |
| Vitest (`npm run test:int`)               | Access control, hooks, readers, blocks, metadata, structured data, config                     | Every PR                |
| Playwright + axe (`npm run test:e2e`)     | Public routes, admin flows, forms, consent, redirects; axe fails on any WCAG 2.2 AA violation | Every PR                |
| Lighthouse CI (`npm run test:lhci`)       | §7 budgets against `npm run start`                                                            | Every PR                |
| CDK assertions (`infra/test`)             | Infrastructure invariants (§13)                                                               | PRs that touch `infra/` |
| Visual capture (`npm run visual:capture`) | Screenshots of pages and blocks for a person to review; not committed, no diffing             | On demand               |

Integration tests run against a real Postgres per suite through `@testcontainers/postgresql`. Playwright
runs against `npm run dev` with a disposable database provisioned by `payload migrate`. Tests never depend
on the private content; fixtures are committed (`npm run seed:showcase`,
`tests/e2e/helpers/seedInScopeRoutes.ts`). Pre-commit runs gitleaks, eslint and prettier only.

---

## 13. Infrastructure as Code

Every AWS resource is declared in CDK (TypeScript) under `infra/`, deployed by CI through an OIDC deploy
role.

```
infra/
  bin/app.ts                 CDK app; resolves the env from -c env=
  lib/network-stack.ts       VPC subnets, security groups, GitHub OIDC provider
  lib/data-stack.ts          RDS, media bucket, secrets, SSM parameters, ACM cert
  lib/compute-stack.ts       ECR, ALB, Fargate services and task definitions, IAM, Cognito gate
  lib/cognito-auth.ts        the Cognito gate construct
  lib/edge-stack.ts          CloudFront, the host-forwarding function, Route 53 records
  lib/observability-stack.ts alarms, SNS, the Slack Lambda, heartbeat
  lib/deploy-role.ts         the OIDC deploy role
  lib/construct-utils.ts     env config types, validation, naming
  test/                      assertion tests
  cdk.json                   per-env config; app runs `npx tsx bin/app.ts`
```

Stacks split by rate of change: network and data rarely change, compute changes on every deploy, edge
and observability sit in between. A synth of the `preview` env needs `-c secondaryImageTag`, with no
fallback, because every deploy states what production runs.

| Trigger                         | CDK step                                                       |
| ------------------------------- | -------------------------------------------------------------- |
| PR touching `infra/`            | `cdk synth` for `staging` and `prod`, plus the assertion tests |
| Push to `main`                  | `cdk deploy SeqtekPreview*Compute`                             |
| Publish a release               | `cdk deploy SeqtekPreview*Compute`, ww3 lane moves             |
| Deploy workflow, `stack-filter` | Any `SeqtekPreview*` stack, e.g. `*Edge` or `*`                |

The assertion tests cover the security groups, bucket settings, the OAC origin, IAM scoping, the
listener and gate rules, the cache behaviors in §3, and the rule that no image tag is a bare `:latest`.
