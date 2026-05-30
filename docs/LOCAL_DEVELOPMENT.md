# Local Development Guide

How to get the SEQTEK website running on your machine.

---

## Prerequisites

| Tool               | Version                           | Check                    |
| ------------------ | --------------------------------- | ------------------------ |
| **Node.js**        | 24.x (active LTS)                 | `node --version`         |
| **npm**            | Bundled with Node 24              | `npm --version`          |
| **Docker**         | Any recent version                | `docker --version`       |
| **Docker Compose** | V2 (included with Docker Desktop) | `docker compose version` |
| **Git**            | Any recent version                | `git --version`          |

No AWS credentials, VPN access, or cloud accounts are needed for local development.

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd company-website
npm install

# 2. Set up environment
cp .env.example .env.local

# 3. Start Postgres
docker compose up -d

# 4. Start the dev server
npm run dev
```

The site is at `http://localhost:3100`. The Payload admin panel is at `http://localhost:3100/admin`.

`/admin` is gated by Google Workspace SSO (`@seqtechllc.com` only). Before the first sign-in works locally you need a Google OAuth client — see [Google OAuth Client (D-14)](#google-oauth-client-d-14) below. On a fresh database the first signer is bootstrapped to the Admin role; later signers default to Editor.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values below. Only two are required for a working local environment:

### Required

| Variable               | Local Value                                            | Notes                                                                     |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `DATABASE_URL`         | `postgresql://seqtek:seqtek@localhost:5433/seqtek_dev` | Matches the Docker Compose Postgres config                                |
| `PAYLOAD_SECRET`       | Any random string (32+ chars)                          | Used for JWT signing. Generate with `openssl rand -hex 32`                |
| `GOOGLE_CLIENT_ID`     | From Google Cloud Console                              | OAuth 2.0 client ID. See [Google OAuth Client](#google-oauth-client-d-14) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console                              | OAuth 2.0 client secret. Same source as above                             |

### Optional (leave blank for local dev)

| Variable                        | Local Value             | Notes                                                                                                              |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `PREVIEW_SECRET`                | Any 32+ char string     | Phase 2 (spec 003) — required to mint preview cookies for `pages`/`posts`/`caseStudies`/`services` drafts (FR-019) |
| `REVALIDATION_SECRET`           | Any 32+ char string     | Phase 2 — Bearer secret for `POST /api/revalidate` (FR-026)                                                        |
| `CLOUDFRONT_DISTRIBUTION_ID`    | _(empty)_               | Phase 2 — unset locally by design (R-03); set per-environment in staging/prod via Parameter Store (FR-027)         |
| `S3_BUCKET`                     | _(empty)_               | Not needed. See [Media Storage](#media-storage-no-s3-needed) below                                                 |
| `S3_REGION`                     | _(empty)_               | Required when `S3_BUCKET` is set                                                                                   |
| `S3_BUCKET_HOSTNAME`            | _(empty)_               |                                                                                                                    |
| `AUDIT_DIR`                     | _(empty)_               | Phase 2 — path to the private Wix audit (defaults to `~/projects/seqtek-internal/audit/`). Read by the seed script |
| `NEXT_PUBLIC_SITE_URL`          | `http://localhost:3100` | Used for canonical URLs and OG meta tags                                                                           |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | _(empty)_               | HubSpot forms won't render without this, which is fine for dev                                                     |
| `NEXT_PUBLIC_GTM_ID`            | _(empty)_               | GTM won't load without this, which is fine for dev                                                                 |
| `NEXT_PUBLIC_SCOREAPP_URL`      | _(empty)_               | Assessment link won't work, which is fine for dev                                                                  |

### What's NOT in .env.local

There are no `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` variables anywhere. Production and staging use IAM instance profiles on EC2 — the AWS SDK discovers credentials automatically from the instance metadata service. Locally, AWS credentials are not needed because S3 is not used (see below).

---

## Docker Compose (Postgres Only)

Docker Compose runs a single service: Postgres. The application itself runs directly via `next dev` for fast HMR — you are not running the app in Docker locally.

```bash
# Start Postgres in the background
docker compose up -d

# Check it's running
docker compose ps

# View Postgres logs
docker compose logs postgres

# Stop (preserves data)
docker compose stop

# Stop and destroy data volume (full reset)
docker compose down -v
```

The Postgres container:

- Runs on `localhost:5433` (host port; container is `5432` internally — see `docker-compose.yml`)
- Creates a database `seqtek_dev` with user `seqtek` / password `seqtek`
- Data persists in a Docker volume between restarts
- Matches the same Postgres major version as production RDS

Payload runs database migrations automatically on startup. When you run `npm run dev`, Payload connects to Postgres and creates/migrates all tables based on the collection configs. No manual migration step needed.

---

## Google OAuth Client (D-14)

`/admin` uses Google Workspace SSO restricted to `@seqtechllc.com` accounts (ROADMAP D-14, ADR 0002, spec 001). You need an OAuth client to sign in locally.

### One-time setup

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Confirm you're in the **seqtek-website** project.
3. **Create Credentials → OAuth client ID** → application type **Web application**.
4. Name: `seqtek-website-local-dev`.
5. Authorized JavaScript origins: `http://localhost:3100`.
6. Authorized redirect URIs: `http://localhost:3100/api/auth/oauth/callback/google`.
7. **Create** — copy the Client ID and Client Secret.

### Put the values in `.env.local`

```bash
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
```

Never commit `.env.local`. `.env.example` lists the names with empty values.

### First sign-in

Drop the Postgres volume if you want a clean cutover (`docker compose down -v`), restart, then visit `/admin` and click **Sign in with Google**. The first `@seqtechllc.com` signer becomes Admin; subsequent signers default to Editor. Promote them in `/admin/collections/users/<id>`.

Non-`@seqtechllc.com` accounts are rejected at the OAuth callback — no row is created.

### Tests (no real Google needed)

Vitest integration tests cover the Users `beforeChange` hook directly (`payload.create({ collection: 'users', ... })`) — same code path the plugin's OAuth callback invokes, no Google round-trip. Playwright E2E tests for the post-auth experience mint a session cookie via `payload.login()` and navigate `/admin` with that cookie set — no OAuth round-trip either. See spec 001 `tasks.md` for the FR-012 note on why we test the integration surface only.

### Staging and prod

Production and staging read `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from AWS Parameter Store at `/seqtek/website/{env}/google_client_{id,secret}` via the EC2 instance profile. See `specs/001-google-oauth-sso/contracts/env-vars.md` for the exact path map.

---

## Media Storage (No S3 Needed)

Production and staging store media uploads in S3 (authenticated via IAM role on EC2). Locally, none of this applies.

When the S3 environment variables are absent, Payload falls back to local filesystem storage. Uploaded images, documents, and other media are written to disk inside the project directory. This is gitignored and works transparently — the admin panel upload UI, image rendering, and `next/image` optimization all function identically.

You do not need to:

- Create an S3 bucket
- Configure AWS credentials
- Set up a mock S3 service (like MinIO or LocalStack)

If you need to test S3 uploads specifically (e.g., working on the storage adapter config), you can set the S3 env vars in `.env.local` and provide credentials via `~/.aws/credentials` or environment variables. This is an edge case — most development does not require it.

---

## Seeding Content

### Starting Empty

The default setup starts with an empty database. Payload creates the schema on first startup. Visit `/admin` to create your admin user and start adding content manually. This is the simplest path for working on UI components or layout changes.

### Seeding from Audit Data

The `src/payload/seed/migrateFromAudit.ts` script imports extracted content from a private audit directory (Playwright crawl of the current Wix site). The directory is **kept outside this repo** and is only available to SEQTEK team members. By convention it lives at `~/projects/seqtek-internal/audit/` (a sibling of the repo); set the `AUDIT_DIR` env var if you keep it elsewhere.

If you have the audit directory:

```bash
AUDIT_DIR=/path/to/audit npx tsx src/payload/seed/migrateFromAudit.ts
```

This populates all collections with real content: case studies, services, team members, blog posts, etc. Useful for testing the full site experience with realistic data.

If you don't have the audit directory, you can still develop against the full site — you'll just need to create sample content manually in the admin panel.

---

## Git Hooks (gitleaks)

Husky installs automatically during `npm install` (via the `prepare` script). A pre-commit hook runs `gitleaks` to scan staged changes for secrets before every commit.

If gitleaks is not installed on your system, the hook will warn you. Install it:

```bash
# macOS
brew install gitleaks

# Linux (from GitHub releases)
# See https://github.com/gitleaks/gitleaks#installing

# Verify
gitleaks version
```

The hook is non-negotiable for this repo — it's public, and a leaked credential is permanently in the git history. If the hook blocks your commit, it found something that looks like a secret. Check the output, fix the issue, and re-commit. Do not bypass it with `--no-verify`.

---

## Common Tasks

### Reset the Database

```bash
# Drop and recreate (Payload re-runs migrations on next startup)
docker compose down -v
docker compose up -d
npm run dev
```

### Change a Payload Collection

Edit the collection config in `src/payload/collections/`. Payload auto-generates migrations when the schema changes. On the next `npm run dev`, the migration runs and the database schema updates. The admin panel and API reflect the changes immediately.

Two artefacts do **not** regenerate on their own — both need a manual step after any schema change. See the next two subsections.

### Regenerating Payload types

`src/payload-types.ts` is the generated TypeScript surface that every render path consumes. Phase 3 page templates import `Page['layout']`, `CaseStudy`, etc. from this file and pass the result straight to `<RenderBlocks>` with no `as any` casts (FR-038, spec 003 US3).

Regenerate after any field/collection/global add, rename, or required-flag flip:

```bash
npm run generate:types
```

Commit the regenerated `src/payload-types.ts` in the same PR as the schema change. CI typechecks against it.

### Regenerating the Payload importMap

`src/app/(payload)/admin/importMap.js` is the static manifest Payload uses to resolve client-side components (richText editors, custom fields, inline blocks). When you add a `richText` field or any client-component-bearing field, the admin panel will fail to load that field's editor until you regenerate the map (FR-039, ADR `project_payload_importmap_gotcha`).

```bash
npm run generate:importmap
```

The symptom of a stale importMap is an editor that mounts blank or a `Cannot find module` console error in the admin. If you add an inline block to `src/payload/blocks/inline/`, also run this — the inline-blocks set widens the Lexical config and the admin reloads it from the map.

Commit the regenerated `importMap.js` in the same PR as the schema change.

### Test the Health Endpoint

```bash
curl http://localhost:3100/api/health
```

Returns JSON with status, uptime, and database connectivity. Same endpoint the ALB uses in production.

### Test On-Demand Revalidation

```bash
curl -X POST http://localhost:3100/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret": "<your REVALIDATION_SECRET>", "paths": ["/case-studies"]}'
```

---

## How Local Dev Differs from Production

| Aspect               | Local                                    | Production                                    |
| -------------------- | ---------------------------------------- | --------------------------------------------- |
| **App server**       | `next dev` (HMR, no optimization)        | `node server.js` (standalone build in Docker) |
| **Database**         | Docker Compose Postgres on localhost     | RDS PostgreSQL (private subnet)               |
| **Media storage**    | Local filesystem (gitignored)            | S3 bucket via IAM role                        |
| **AWS credentials**  | None needed                              | IAM instance profile via IMDS                 |
| **CDN**              | None                                     | CloudFront                                    |
| **SSL**              | None (HTTP on port 3100)                 | ACM cert on CloudFront                        |
| **ISR**              | Dev mode — pages render on every request | Static generation + on-demand revalidation    |
| **CSP**              | Enforced (same proxy)                    | Enforced (same proxy)                         |
| **Secret detection** | Pre-commit hook (gitleaks)               | Pre-commit hook + CI check                    |

The CSP proxy (Next 16's rename of middleware) runs in both environments, so you'll catch CSP violations during development. If a third-party script or resource is blocked in dev, it will also be blocked in production.

---

## Troubleshooting

### "Connection refused" on startup

Postgres isn't running. Start it:

```bash
docker compose up -d
```

Then check with `docker compose ps` — the postgres service should show `running`.

### "relation does not exist" errors

Payload migrations haven't run. This usually means the dev server was started before Postgres was ready. Restart the dev server:

```bash
# Ctrl+C to stop, then:
npm run dev
```

Payload runs migrations on startup. If the database existed but the schema is stale, Payload will generate and apply the missing migrations.

### Port 3100 already in use

Another process is using the port. Find and kill it:

```bash
lsof -ti:3100 | xargs kill
```

Or start on a different port:

```bash
PORT=3001 npm run dev
```

### gitleaks blocks my commit

The pre-commit hook found something that looks like a secret in your staged changes. Read the output — it tells you which file and line triggered the match. Common false positives:

- Test fixtures with high-entropy strings — add a `[gitleaks:allow]` inline comment
- Example URLs with tokens — use obviously fake values (`sk_test_FAKE_KEY_HERE`)

Do not bypass with `--no-verify`. If you believe it's a false positive, update `.gitleaks.toml` with an allowlist rule and commit that config change first.

### HubSpot forms don't render

Expected. HubSpot forms require `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` to be set. For most local development this isn't needed. If you're working on the form integration, use the real portal ID from the team.

### Images look broken after switching branches

The local media directory may have files from a different branch's seed data. Reset:

```bash
# Clear local uploads (gitignored, safe to delete)
rm -rf media/
npm run dev
```

Then re-seed or re-upload as needed.
