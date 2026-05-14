# Local Development Guide

How to get the SEQTEK website running on your machine.

---

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| **Node.js** | 24.x (active LTS) | `node --version` |
| **npm** | Bundled with Node 24 | `npm --version` |
| **Docker** | Any recent version | `docker --version` |
| **Docker Compose** | V2 (included with Docker Desktop) | `docker compose version` |
| **Git** | Any recent version | `git --version` |

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

The site is at `http://localhost:3000`. The Payload admin panel is at `http://localhost:3000/admin`.

On first visit to `/admin`, Payload will prompt you to create the initial admin user. No accounts are pre-seeded.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values below. Only two are required for a working local environment:

### Required

| Variable | Local Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://seqtek:seqtek@localhost:5432/seqtek_dev` | Matches the Docker Compose Postgres config |
| `PAYLOAD_SECRET` | Any random string (32+ chars) | Used for JWT signing. Generate with `openssl rand -hex 32` |

### Optional (leave blank for local dev)

| Variable | Local Value | Notes |
|---|---|---|
| `S3_BUCKET` | *(empty)* | Not needed. See [Media Storage](#media-storage-no-s3-needed) below |
| `S3_REGION` | *(empty)* | |
| `S3_BUCKET_HOSTNAME` | *(empty)* | |
| `REVALIDATION_SECRET` | Any string | Only needed if testing the `/api/revalidate` webhook endpoint |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Used for canonical URLs and OG meta tags |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | *(empty)* | HubSpot forms won't render without this, which is fine for dev |
| `NEXT_PUBLIC_GTM_ID` | *(empty)* | GTM won't load without this, which is fine for dev |
| `NEXT_PUBLIC_SCOREAPP_URL` | *(empty)* | Assessment link won't work, which is fine for dev |

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
- Runs on `localhost:5432`
- Creates a database `seqtek_dev` with user `seqtek` / password `seqtek`
- Data persists in a Docker volume between restarts
- Matches the same Postgres major version as production RDS

Payload runs database migrations automatically on startup. When you run `npm run dev`, Payload connects to Postgres and creates/migrates all tables based on the collection configs. No manual migration step needed.

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

The `src/payload/seed/migrateFromAudit.ts` script imports extracted content from the `audit/` directory (crawled data from the current Wix site). This directory is gitignored — it contains internal content and is only available to team members who ran the original site audit.

If you have the `audit/` directory:

```bash
npx tsx src/payload/seed/migrateFromAudit.ts
```

This populates all collections with real content: case studies, services, team members, blog posts, etc. Useful for testing the full site experience with realistic data.

If you don't have the `audit/` directory, you can still develop against the full site — you'll just need to create sample content manually in the admin panel.

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

### Test the Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Returns JSON with status, uptime, and database connectivity. Same endpoint the ALB uses in production.

### Test On-Demand Revalidation

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret": "<your REVALIDATION_SECRET>", "paths": ["/case-studies"]}'
```

---

## How Local Dev Differs from Production

| Aspect | Local | Production |
|---|---|---|
| **App server** | `next dev` (HMR, no optimization) | `node server.js` (standalone build in Docker) |
| **Database** | Docker Compose Postgres on localhost | RDS PostgreSQL (private subnet) |
| **Media storage** | Local filesystem (gitignored) | S3 bucket via IAM role |
| **AWS credentials** | None needed | IAM instance profile via IMDS |
| **CDN** | None | CloudFront |
| **SSL** | None (HTTP on port 3000) | ACM cert on CloudFront |
| **ISR** | Dev mode — pages render on every request | Static generation + on-demand revalidation |
| **CSP** | Enforced (same middleware) | Enforced (same middleware) |
| **Secret detection** | Pre-commit hook (gitleaks) | Pre-commit hook + CI check |

The CSP middleware runs in both environments, so you'll catch CSP violations during development. If a third-party script or resource is blocked in dev, it will also be blocked in production.

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

### Port 3000 already in use

Another process is using the port. Find and kill it:

```bash
lsof -ti:3000 | xargs kill
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
