# Quickstart — Phase 2 Content Models

**Audience**: a developer who just cloned the repo and wants to verify the Phase 2 build works end-to-end. This is the path SC-012 measures: clone → admin → SSO → compose a 3-block page → preview → publish, in under 30 minutes.

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

> Updates to this guide also belong in `docs/LOCAL_DEVELOPMENT.md`. Per Constitution III, the docs reconcile in the same commit.

---

## 1. Prerequisites

- Node ≥ 22.0.0.
- Postgres reachable on `localhost:5433` (the project DB per `project_local_dev_ports` memory; the shared dev Postgres on `:5432` is for ad-hoc tools).
- An `.env.local` at the repo root with at minimum:
  ```env
  DATABASE_URL=postgres://postgres:postgres@localhost:5433/seqtek
  PAYLOAD_SECRET=<any 32+ char string>
  NEXT_PUBLIC_SITE_URL=http://localhost:3100
  PREVIEW_SECRET=<any 32+ char string>
  REVALIDATION_SECRET=<any 32+ char string>
  # Google SSO for /admin per spec 001
  GOOGLE_OAUTH_CLIENT_ID=<...>
  GOOGLE_OAUTH_CLIENT_SECRET=<...>
  GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3100/api/auth/callback/google
  # Optional — S3 for media. Absent → local filesystem fallback (FR-022)
  # S3_BUCKET=seqtek-media-dev
  # S3_REGION=us-east-1
  ```

## 2. Install + boot

```bash
npm install
npm run dev
```

Visit `http://localhost:3100/admin` and sign in with your `@seqtechllc.com` Google account. The first SSO sign-in against an empty `users` table auto-provisions you as `admin` (FR-036). Subsequent users become `editor`.

## 3. Compose a 3-block page

This is the SC-001 / SC-012 path — no engineer hand-holding, no DB access.

1. In the admin sidebar → **Pages** → **Create new**.
2. Title: `Test Drive`.
3. The `slug` field auto-fills (`test-drive`).
4. Click **Add block** on `Layout` → choose `hero`.
5. Set `variant` = `text-only`, fill `headline` ("Test drive the block library").
6. Click **Add block** again → choose `content`.
7. In the rich text body, type a paragraph, then click the block-insertion menu → choose `callout` (an inline block) → fill it in.
8. Click **Add block** again → choose `cta-section`. Pick `variant: centered`, fill `headline` ("Looks good").
9. Click **Save Draft**.
10. Click **Preview** in the top-right. A new tab opens at `/preview/pages/test-drive` and you see the page rendered with a `PREVIEW MODE` banner (FR-020).
11. Back in the admin tab: flip `status` to `Published`. Click **Save**.
12. Visit `http://localhost:3100/test-drive` in a private/incognito window (unauthenticated) → the page renders without the banner. (No drafts leak per FR-016.)

If any step fails, see Troubleshooting below.

## 4. Run the seed script

```bash
AUDIT_DIR=~/projects/seqtek-internal/audit \
  npx tsx src/payload/seed/migrateFromAudit.ts --dry-run
```

`--dry-run` prints planned upserts without writing. Drop the flag to actually seed. Re-run (without `--dry-run`) and verify row counts are equal — that's SC-004 in 30 seconds (FR-030).

Useful variants:

- `--collection=caseStudies` — iterate on one collection only.
- `--recrawl-images` — opt-in image download path (off by default per R-10).

The `migration-errors.log` file at the repo root captures every content gap (FR-032 + SC-011). It's gitignored.

## 5. Regenerate Payload TypeScript types

After any collection or block schema change (FR-038):

```bash
npm run generate:types
```

Updates `src/payload-types.ts`. Commit the result in the same PR.

## 6. Regenerate the admin importMap

After adding a `richText` field, a new inline block, or any other client-side admin component (FR-039 + `project_payload_importmap_gotcha`):

```bash
npm run generate:importmap
```

Updates `src/app/(payload)/admin/importMap.js`. Commit it. **If you skip this step, the admin will fail to mount the new component on next dev-start** — that's the gotcha.

## 7. Tests

```bash
npm run typecheck            # tsc --noEmit
npm run lint                 # ESLint
npm run format:check         # Prettier (writes via npm run format)
npm run test:int             # Vitest against testcontainer Postgres
npm run test:e2e             # Playwright; needs `npm run dev` in another shell
npm run test:lhci            # Lighthouse CI gate (a11y/SEO/best-practices ≥ 0.95)
```

The full CI gate is the union of these. None of them touch the network or AWS.

## 8. Verify on staging (optional, for SC-007 / SC-010)

After merge + deploy to staging on `seqtek-preview.com`:

1. Edit any case study → flip published → save. Visit the public URL within 60 seconds → the change is live (SC-007).
2. Upload a JPG in the admin's media browser. Confirm it lands in `s3://seqtek-media-staging/<media-id>/<filename>` (Block Public Access still on) and resolves via `https://seqtek-preview.com/media/<media-id>/<filename>` (SC-010).

---

## Troubleshooting

| Symptom                                                                 | Probable cause                                                                                                                  | Fix                                                                                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Admin redirects `/admin` → `/admin/login` even with a valid session     | `payload-types.ts` out of date or `disableLocalStrategy: { enableFields: true }` regression in `Users.ts`.                      | `npm run generate:types`; verify the spec 001 strategies block still registers `local-jwt` (`src/collections/Users.ts:23`). |
| Admin throws "missing component" or admin form for a new block is blank | importMap is stale.                                                                                                             | `npm run generate:importmap`; restart dev.                                                                                  |
| Preview button is missing on a draft                                    | Slug is empty (`buildPreviewUrl` returns `null` when no slug).                                                                  | Type a title; slug auto-fills.                                                                                              |
| Saving a draft with a future `publishedAt` doesn't go live              | Working as designed — the `beforeChange` invariant forces draft until the cutover (FR-028). Phase 2 doesn't ship the cron flip. | Set `publishedAt` to now or earlier to publish manually.                                                                    |
| `npm run test:int` times out                                            | Docker isn't running, or port 5433 is taken by another project's DB.                                                            | Start Docker; check `lsof -i :5433`.                                                                                        |
| Seed script: `Cannot find module ...`                                   | Schema changed but migrations didn't run.                                                                                       | `npm run payload migrate` (or rely on `push: true` per `src/payload.config.ts:47` until Phase 5.5).                         |
| Media uploads land on disk in dev even though `S3_BUCKET` is set        | `S3_REGION` missing.                                                                                                            | Set both env vars; restart dev.                                                                                             |
| `/api/revalidate` returns 401 in dev                                    | `REVALIDATION_SECRET` env var unset or different from the `Authorization: Bearer` header you sent.                              | Match them; restart dev.                                                                                                    |
| CloudFront invalidation silently no-ops in dev                          | `CLOUDFRONT_DISTRIBUTION_ID` env var unset — by design (R-03).                                                                  | Leave unset locally; it's set per-environment in staging/prod via Parameter Store.                                          |
