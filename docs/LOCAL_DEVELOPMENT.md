# Local Development Guide

How to run the SEQTEK website on your machine. No AWS credentials are needed.

## Prerequisites

Node.js `>=22` (24.x LTS recommended), npm, Docker with Compose V2, Git.

## Quick start

```bash
npm install
cp .env.example .env.local          # then fill in the required values below
docker compose up -d                # Postgres on localhost:5433
PAYLOAD_DISABLE_PUSH=true npm run payload migrate
PAYLOAD_DISABLE_PUSH=true npm run dev
```

The site is at `http://localhost:3100` and the admin at `http://localhost:3100/admin`. The database starts empty;
[Build the local database](#build-the-local-database) loads the content.

Always run with `PAYLOAD_DISABLE_PUSH=true`. The schema comes from the migrations (one baseline since 2026-09-24),
not from Drizzle's dev push, which also leaves the dev server hanging at boot.

## Environment variables

**Required**

| Variable               | Local value                                            |
| ---------------------- | ------------------------------------------------------ |
| `DATABASE_URL`         | `postgresql://seqtek:seqtek@localhost:5433/seqtek_dev` |
| `PAYLOAD_SECRET`       | Any 32+ char string (`openssl rand -hex 32`)           |
| `GOOGLE_CLIENT_ID`     | See [Google OAuth client](#google-oauth-client-d-14)   |
| `GOOGLE_CLIENT_SECRET` | Same                                                   |

**Optional** (leave blank locally)

| Variable                                                                                                       | Notes                                                                            |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                                                                         | Payload's `serverURL`; defaults to `http://localhost:3100`                       |
| `REVALIDATION_SECRET`                                                                                          | Bearer secret for `POST /api/revalidate`                                         |
| `CSP_MODE`                                                                                                     | `enforce`, `report-only` (default) or `off`                                      |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID`, `NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID`, `NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID` | Blank leaves the forms half-wired: they run their full lifecycle without posting |
| `NEXT_PUBLIC_GTM_ID`                                                                                           | GTM loads only when set                                                          |
| `S3_BUCKET`, `S3_REGION`, `S3_BUCKET_HOSTNAME`                                                                 | Unset means local filesystem media                                               |
| `CLOUDFRONT_DISTRIBUTION_ID`                                                                                   | Unset locally; invalidations are skipped                                         |

## Postgres

Docker Compose runs Postgres only (`postgres:18`, matching RDS). The app runs through `next dev`. The container
listens on `localhost:5433`, with database `seqtek_dev` and user and password `seqtek`. Data persists in a Docker
volume; `docker compose down -v` destroys it.

## Build the local database

All site content, media included, lives in the content JSON (`docs/content-drafts/`, a symlink to the private
content repo). A local database is built the same way as a lane's:

1. Move `media/` aside if it holds earlier uploads, or re-uploaded files get renamed.
2. Recreate the database and apply the migrations:

   ```bash
   docker compose exec postgres psql -U seqtek -d postgres \
     -c "DROP DATABASE IF EXISTS seqtek_dev WITH (FORCE)" -c "CREATE DATABASE seqtek_dev OWNER seqtek"
   PAYLOAD_DISABLE_PUSH=true npm run payload migrate
   ```

3. Start the dev server, sign in to `/admin` with Google (on an empty database the first account becomes the
   admin), and copy the `payload-token` cookie.
4. Load the files in the order in the content repo's `LOAD-ORDER.md`. Every file must end `errors=0`.

   ```bash
   IMPORT_TOKEN=<payload-token> npm run payload:seed -- docs/content-drafts/<file>.json
   ```

`--dry-run` previews a file. `--base-url` or `IMPORT_BASE_URL` points the same command at a lane; a gated lane also
needs `IMPORT_COOKIE` (`tools/payload-seed/README.md`). Test fixtures are separate: `npm run seed:showcase` seeds
one page per block for the visual capture.

## Google OAuth client (D-14)

`/admin` signs in through Google Workspace; `@seqtechllc.com` and `@seqtek.com` accounts are admitted (ADR 0002). To
sign in locally, create a client in Google Cloud Console → APIs & Services → Credentials, in the `seqtek-website`
project:

- type **Web application**;
- JavaScript origin `http://localhost:3100`;
- redirect URI `http://localhost:3100/api/auth/oauth/callback/google`.

Put the ID and secret in `.env.local`, and never commit that file. Other domains are rejected at the callback
without creating a user. Later accounts are provisioned as editors; promote them in `/admin/collections/users`.

Tests need no Google: integration tests call the Users hooks directly, and E2E tests mint a session cookie with
`payload.login()`.

### Running a second dev server on another port

`next dev` refuses a second instance from the same directory, so a second server runs from another checkout, and
it must set `NEXT_PUBLIC_SITE_URL` to its own origin:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3111 npx next dev --port 3111
```

Without it, the admin looks signed in but every server action fails. Payload adds `serverURL` to `config.csrf`, and
`extractJWT` drops the session cookie when the request's `Origin` is not on that list.

## Media

With no `S3_BUCKET`, Payload stores uploads in `media/` (gitignored), and the admin, rendering and image
optimisation behave the same as with S3.

## Git hooks

`npm install` installs Husky; the pre-commit hook runs `gitleaks` on staged changes and lint-staged. Install
gitleaks (`brew install gitleaks`, or a release from GitHub). The repo is public: never bypass the hook with
`--no-verify`. For a false positive, add a `[gitleaks:allow]` comment or an allowlist rule in `.gitleaks.toml`.

## Common tasks

### Change a collection or block

Edit the config, then:

```bash
npm run payload migrate:create <name>   # audit the generated SQL
PAYLOAD_DISABLE_PUSH=true npm run payload migrate
npm run generate:types                  # commit src/payload-types.ts with the change
```

A block change touches every collection that uses `layout`. `migrate:create` can stop at drizzle-kit's "created or
renamed?" prompt; answer it deliberately. See `PAYLOAD_DEVELOPMENT.md` for the migration rules.

### Regenerating the Payload importMap

`src/app/(payload)/admin/importMap.js` tells the admin how to load client components. After adding a `richText`
field, a custom field component or an inline block, run `npm run generate:importmap` and commit the result. A stale
map shows as a blank editor or a `Cannot find module` error in the admin.

### Health and revalidation

```bash
curl http://localhost:3100/api/health
curl -X POST http://localhost:3100/api/revalidate \
  -H "Authorization: Bearer $REVALIDATION_SECRET" -H "Content-Type: application/json" \
  -d '{"paths": ["/case-studies"]}'
```

### Sweep for broken links, images and placeholder copy

```bash
npm run sweep -- --exclude=showcase-                     # localhost:3100, skipping the test fixtures
npm run sweep -- --base-url=https://preview.seqtek.com   # a lane
```

A gated lane needs both halves of the ALB session cookie from your browser, or every route "returns 200" as the
sign-in page:
`SWEEP_COOKIE='AWSELBAuthSessionCookie-0=…; AWSELBAuthSessionCookie-1=…'`. Run it after every content load.
`--fail-on` turns a category into a failure; the reference is `tools/link-sweep/README.md`.

## Local versus the lanes

|             | Local                              | Lanes (preview, ww3)                        |
| ----------- | ---------------------------------- | ------------------------------------------- |
| App server  | `next dev`                         | `node server.js` in a Fargate task          |
| Database    | Docker Postgres on `:5433`         | RDS PostgreSQL, one instance for both lanes |
| Media       | `media/` on disk                   | S3, served by CloudFront at `/media/*`      |
| Credentials | None                               | The ECS task role                           |
| Rendering   | Dynamic, reads cached per request  | The same, plus on-demand revalidation       |
| CSP         | `CSP_MODE` (default `report-only`) | The same default                            |

## Troubleshooting

- **Connection refused:** Postgres isn't running. `docker compose up -d`.
- **"relation does not exist":** the database has no schema. Run `PAYLOAD_DISABLE_PUSH=true npm run payload migrate`.
- **The dev server hangs at boot:** start it with `PAYLOAD_DISABLE_PUSH=true`.
- **Port 3100 in use:** an earlier dev server is still running; `lsof -ti:3100 | xargs kill`. The dev script always
  uses 3100.
- **HubSpot forms don't post:** expected without the portal ID and form GUIDs.
- **Images broken after switching branches:** clear `media/` and reload the content.
