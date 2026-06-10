# Implementation Plan: Media via CloudFront `/media/*`

**Branch**: `feat/009-media-cloudfront-serving` | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-media-cloudfront-serving/spec.md`

## Summary

Staging media is broken (`http://localhost:3100/api/media/file/<filename>` URLs) because `serverURL` falls back to localhost and the storage adapter serves through the app proxy instead of the existing CloudFront `/media/*` OAC behavior. The fix is three small, independent changes plus a data migration: (1) provision a `next_public_site_url` SSM parameter (auto-mapped to `NEXT_PUBLIC_SITE_URL` by the existing user-data loop — zero compute-stack change); (2) set the storage adapter's `prefix: 'media'` and add a `generateFileURL` that emits absolute `${NEXT_PUBLIC_SITE_URL}/media/<key>` URLs — the settled `media/<filename>` key shape maps verbatim onto the CloudFront behavior with **no infra change**; (3) re-key the 27 staging objects **in place** (S3 server-side move + REST `PATCH {prefix: 'media'}` per doc), preserving media IDs and the 10 team-member relations. Reconcile ARCHITECTURE §5/§6, the STAGING_INGEST runbook, and the s3.ts comment; flip ADR 0008 → Accepted.

## Technical Context

**Language/Version**: TypeScript 5.x strict, Node 24

**Primary Dependencies**: Next.js 16, Payload 3.85 (`@payloadcms/storage-s3` + `@payloadcms/plugin-cloud-storage`), AWS CDK v2 (infra), `@aws-sdk/client-cloudfront` (already a dep, used by `src/lib/cloudfront/invalidate.ts`)

**Storage**: S3 (`seqtek-media-staging` / `seqtek-media-prod`), Postgres (media docs carry a per-document `prefix` column from PR #39)

**Testing**: Vitest (URL-builder unit/integration), CDK assertions (`infra/test/data-stack.test.ts`), Playwright E2E unchanged (local = S3 disabled), staging verification deliverable per the Principle II carve-out

**Target Platform**: EC2 (Docker, standalone Next) behind ALB + CloudFront; local dev unaffected (plugin `enabled: false`)

**Project Type**: Web app (Next.js + embedded Payload) + CDK infra in `infra/`

**Performance Goals**: media served from CloudFront edge (`CachingOptimized`, long TTL, compression); zero media bytes streamed through EC2 on public page views

**Constraints**: public repo (no secrets); `NEXT_PUBLIC_*` is build-time-inlined for _client_ code — all four current consumers are server-side, so runtime SSM injection works; future client-side use would NOT see the SSM value (documented in research R6)

**Scale/Scope**: 27 seeded media docs (+ ~8 size variants each), 10 team members; 2 app files, 1 infra file, 4 docs, 1 migration runbook

**Framework source read (Constitution I)** — the plan's design rests on these files, enumerated in [research.md](./research.md) §Sources:

- `node_modules/@payloadcms/plugin-cloud-storage/dist/{plugin.js, fields/getFields.js, hooks/{afterRead,beforeChange,afterChange,afterDelete,preserveFileData}.js, utilities/{getFileKey,getFilePrefix}.js}`
- `node_modules/@payloadcms/storage-s3/dist/{index.js, generateURL.js, uploadFile.js}`
- `node_modules/payload/dist/uploads/{getBaseFields.js, generateFilePathOrURL.js}`, `node_modules/payload/dist/collections/config/sanitize.js`, `node_modules/payload/dist/fields/mergeBaseFields.js`, `node_modules/payload/dist/utilities/deepMerge.js`

## Constitution Check

_GATE: evaluated pre-Phase 0; re-evaluated post-Phase 1. **PASS** (no violations; one declared carve-out substitution)._

- **I. Spec Before Code** — spec 009 exists, clarified (key shape settled 2026-06-09). Plan implements against Payload internals; source files read are enumerated above and in research.md. The decisive internals findings (hook merge order making `generateFileURL` win; `afterChange` no-op without an incoming file; static-handler per-doc prefix resolution) are exactly the class of gotcha this principle exists to catch — all three materially shaped the design. ✅
- **II. Tests Gate Merge** — code paths get automated tests: the URL builder is extracted as a pure helper and Vitest-tested (prefix join, encoding, host fallback, variant filenames); the new SSM param gets a CDK assertion in `infra/test/data-stack.test.ts`; the media invalidation hook gets a Vitest test against a mocked `invalidateCloudFrontPaths`. **Carve-out declared (US1 staging verification / FR-010, SC-001–003)**: edge-cache behavior, OAC serving, and live `/team` rendering live in AWS, not this repo — substituted with a captured staging-evidence deliverable (`quickstart.md` §Verify: x-cache headers, /team screenshot, localhost-grep across pages + sitemap). The in-repo substrate (URL generation, CSP, render components) is CI-covered. ✅
- **III. Docs Are Code** — same-change reconciliation enumerated: ARCHITECTURE §5 line 601 + §6 line 572 key-shape claims (`<media-id>/<filename>` → `media/<filename>`), §6 line 572 cache-busting rationale (stable keys ⇒ natural cache-busting is gone ⇒ replaced by the invalidation hook), §6 line 573's 403→404 remap claim (corrected to "deferred, Phase 5.5" matching `edge-stack.ts`), `tools/ingest-photos/STAGING_INGEST.md` line 78 key-shape claim, `src/payload/storage/s3.ts` in-file comment, ADR 0008 Proposed → Accepted with sub-decisions recorded. Spec FR-005 amended to the in-place re-key mechanics (research R4) in the same change. ✅
- **IV. Security Baseline** — no new dependencies; no secrets (the site URL is public config; SSM String param, not SecureString — matches `s3_region`). Bucket stays private/OAC; CSP unchanged (same-origin media). ✅
- **V. Bleeding-Edge Stack** — no version changes. ✅

## Project Structure

### Documentation (this feature)

```text
specs/009-media-cloudfront-serving/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions R1–R7 + framework sources
├── data-model.md        # Phase 1 — media doc / S3 key / SSM param model
├── quickstart.md        # Phase 1 — staging migration + verification runbook
├── contracts/
│   └── media-url.md     # Phase 1 — URL ↔ key ↔ CDN mapping contract
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── payload/storage/s3.ts            # prefix: 'media' + generateFileURL (extracted pure helper)
├── collections/Media.ts             # afterChange/afterDelete invalidation hook wiring (replace-in-place stale-edge fix)
├── lib/cloudfront/invalidate.ts     # existing helper, reused — no change
└── payload.config.ts                # no change (serverURL already reads NEXT_PUBLIC_SITE_URL)

infra/
├── lib/data-stack.ts                # + next_public_site_url SSM param (mirrors #38 s3_region)
└── test/data-stack.test.ts          # + CDK assertion for the param

tools/ingest-photos/
├── rekey-staging.ts                 # NEW one-shot: S3 move + REST PATCH prefix (research R4)
└── STAGING_INGEST.md                # key-shape claim reconciled

tests/
└── int/media-url.int.spec.ts        # NEW Vitest: URL builder + invalidation hook (.int.spec.ts — vitest include glob)

docs/
├── ARCHITECTURE.md                  # §5/§6 reconciliation
└── decisions/0008-media-cloudfront-serving.md  # Proposed → Accepted + sub-decisions
```

**Structure Decision**: single-project layout (existing). All changes land in the canonical `src/`, `infra/`, `tools/`, `docs/` trees; the only new file in `src/`-adjacent space is the Vitest spec. The re-key script lives in `tools/ingest-photos/` per the tooling-in-subdirectories rule.

## Complexity Tracking

No constitution violations — table not required.

## Phase summaries

**Phase 0 (research.md)**: All Technical Context unknowns resolved. Key decisions: `generateFileURL` is the URL seam and wins the hook chain unconditionally (R1); absolute site-domain URLs, computed per-read so nothing persisted goes stale (R2); SSM param auto-maps to env via the existing user-data loop, requiring only an instance refresh (R3); **in-place re-key** (S3 move + `PATCH prefix`) replaces the spec's delete + re-push to preserve media IDs and team-member relations — spec FR-005 amended accordingly (R4); local dev/CI untouched because the disabled plugin attaches no hooks (R5); `NEXT_PUBLIC_*` build-inlining is a documented non-issue today (R6); stable keys lose natural cache-busting, fixed with a small invalidation hook on replace/delete reusing `invalidateCloudFrontPaths` (R7).

**Phase 1 (data-model.md, contracts/, quickstart.md)**: media-doc field model (per-doc `prefix` column as the load-bearing migration lever), the URL ↔ key ↔ CDN-behavior contract, and the staging migration/verification runbook.
