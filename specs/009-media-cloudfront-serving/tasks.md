# Tasks: Media via CloudFront `/media/*`

**Input**: Design documents from `/specs/009-media-cloudfront-serving/`

**Prerequisites**: plan.md, spec.md (clarified 2026-06-09), research.md (R1–R7), data-model.md, contracts/media-url.md, quickstart.md

**Tests**: Constitution Principle II applies. US1 code paths ship Vitest tests written first; US2 is config-only and US3 is documentation-only — both use the **verification-deliverable carve-out declared in plan.md § Constitution Check** (staging evidence / doc-review acceptance) because their load-bearing paths are external to this codebase and the in-repo substrate is already CI-covered.

**Organization**: Tasks grouped by user story; stories independently testable. US1 is the MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 / US2 / US3 per spec.md

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Provision the public-site-URL config both US1 (media URL host) and US2 (canonical/OG/sitemap host) depend on for staging verification. The user-data loop in `infra/lib/compute-stack.ts:240-243` auto-maps the param to `NEXT_PUBLIC_SITE_URL` — no compute-stack change (research R3).

- [x] T001 Add CDK assertion for the `next_public_site_url` SSM parameter in `infra/test/data-stack.test.ts` (mirror the existing `s3_region` assertion pattern); run `npm test` in `infra/` and verify it FAILS
- [x] T002 Add `next_public_site_url` `ssm.StringParameter` in `infra/lib/data-stack.ts` next to `s3_region` (`data-stack.ts:156-160`), value wired per-env via `DataStackProps` (staging: `https://seqtek-preview.com`); T001 goes green

**Checkpoint**: `cdk synth`/`cdk diff` shows only the new parameter; infra tests green. Deployment + instance refresh happens in T010 (after the app code lands, one deploy for both).

---

## Phase 2: User Story 1 — Visitors see media, served from the edge (Priority: P1) 🎯 MVP

**Goal**: `/team` headshots render; media URLs are `https://<site>/media/<filename>` served by the existing CloudFront `/media/*` OAC behavior (edge-cached); staging objects re-keyed **in place** preserving media IDs and team-member relations (FR-005 as amended, research R4).

**Independent Test**: Vitest URL-builder/hook tests green locally; on staging, `/team` renders 12/12, `curl -sI .../media/<file>` shows `Hit from cloudfront` on second request, and admin thumbnails still render (quickstart.md §Verify).

### Tests for User Story 1 (write first, verify they FAIL) ⚠️

- [x] T003 [P] [US1] Vitest contract tests for the `mediaFileURL` helper in `tests/int/media-url.int.spec.ts` — the four cases from `contracts/media-url.md` §Test cases (prefix join, basename encoding, legacy empty-prefix shape, localhost fallback parity with `payload.config.ts`)
- [x] T004 [P] [US1] Vitest tests for the media CloudFront-invalidation hook in `tests/int/media-url.int.spec.ts` (same file, separate describe) — mock `invalidateCloudFrontPaths` from `src/lib/cloudfront/invalidate.ts`; assert: file **replace** invalidates `/media/<old-filename>` + all `sizes.*` variant paths from the previous doc; **delete** invalidates the doc's original + variant paths; metadata-only update (no file) invalidates nothing; no-op when `CLOUDFRONT_DISTRIBUTION_ID` unset

### Implementation for User Story 1

- [x] T005 [US1] In `src/payload/storage/s3.ts`: export pure `mediaFileURL({ prefix, filename })` helper (host = `process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100'`, posix-join, encode basename only — mirror `@payloadcms/storage-s3` `generateURL.js` encoding); set `prefix: 'media'` (was `''`); add `generateFileURL` on `collections.media` delegating to the helper; rewrite the stale in-file key-shape comment (`s3.ts:44`) to `media/<filename>` + note the R1 hook-order rationale and the R6 `NEXT_PUBLIC_*` build-inlining caveat. T003 goes green
- [x] T006 [US1] In `src/collections/Media.ts`: add `afterChange` (file-replacement) + `afterDelete` hooks calling `invalidateCloudFrontPaths()` with the previous doc's `/media/<filename>` + variant paths (FR-011); env-gated on `CLOUDFRONT_DISTRIBUTION_ID` exactly like the page-revalidation hooks; fire-and-forget with logged failure (don't block the mutation). T004 goes green
- [x] T007 [P] [US1] Create one-shot idempotent re-key script `tools/ingest-photos/rekey-staging.ts` per research R4 + quickstart.md §Re-key: list bucket keys not under `media/` → S3 server-side copy to `media/<key>` → verify → delete old key → REST `PATCH /api/media/<id> {prefix: 'media'}` for docs with prefix ≠ `'media'` (reuse `PayloadRestClient` from `tools/payload-rest/client`); `--dry-run` support; move objects BEFORE patching docs (keeps the static-handler fallback alive mid-run); never log `IMPORT_TOKEN`
- [x] T008 [US1] Local regression gate (FR-006): `npm run typecheck && npm run lint && npm run test:int && npm run test:e2e` — local dev/CI behavior unchanged (plugin disabled → no hooks, research R5); fix any fallout
- [x] T009 [US1] Regenerate Payload importMap (`npm run generate:importmap`) and types (`npm run generate:types`) if the config change touched either; commit any diff
- [x] T010 [US1] Ship + activate: merge PR → staging deploy; then ASG **instance refresh** so the user-data loop writes `NEXT_PUBLIC_SITE_URL` into `/etc/seqtek-website.env`; confirm via `curl -s https://seqtek-preview.com/api/health` and an admin page load
- [x] T011 [US1] Execute the re-key on staging per quickstart.md: `--dry-run` first (expect 27 originals + variants listed), then live; re-run to confirm idempotence (nothing to move/patch)
- [x] T012 [US1] **Verification deliverable** (Principle II carve-out, declared in plan.md): capture staging evidence per quickstart.md §Verify — `/team` renders 12/12 (screenshot), `x-cache: Hit from cloudfront` on second media request, bucket conformance check (zero keys outside `media/`), admin thumbnails render, one fresh `/admin` upload renders on a page with no manual fix-up (SC-001, SC-002, SC-004, SC-006); attach to the PR

**Checkpoint**: US1 fully shipped and verified — media is edge-served, MVP complete.

---

## Phase 3: User Story 2 — Correct absolute URLs site-wide (Priority: P2)

**Goal**: Canonical/OG/JSON-LD/sitemap URLs use `https://seqtek-preview.com`, never `localhost` (FR-007). No code change — `payload.config.ts:33`, `sitemap.ts:12`, `structured-data.ts:11`, `livePreview/url.ts:25` already read `NEXT_PUBLIC_SITE_URL`; Phase 1 + the T010 instance refresh provision it.

**Independent Test**: quickstart.md SC-003 commands — zero `localhost` occurrences across rendered pages, OG tags, and the sitemap.

### Verification for User Story 2 (carve-out — config-only story, substrate CI-covered)

- [x] T013 [US2] **Verification deliverable**: after T010, capture SC-003 evidence per quickstart.md — `curl` sweep of `/`, `/team`, a case study, and `/sitemap.xml` grepping for `localhost` (expect 0) and confirming `og:image`/canonical/JSON-LD URLs are absolute on the public host; spot-check live-preview opens from `/admin` against the staging domain; attach to the PR

**Checkpoint**: US1 + US2 verified on staging.

---

## Phase 4: User Story 3 — One documented key shape, ADR accepted (Priority: P3)

**Goal**: ARCHITECTURE, the runbook, the adapter source, and the CDN config state the same `media/<filename>` shape; ADR 0008 Accepted with sub-decisions recorded (FR-004, FR-009, SC-004, SC-005). Same-change reconciliation per Constitution III — these land in the same PR as Phase 2 code.

### Implementation for User Story 3

- [x] T014 [P] [US3] Reconcile `docs/ARCHITECTURE.md`: §5 line ~601 key strategy `<media-id>/<filename>` → `media/<filename>` (URL path maps verbatim to the key; no originPath/rewrite); §6 line ~572 cache-busting rationale → stable keys + the Media invalidation hook on replace/delete (name the hook + `invalidateCloudFrontPaths`); §6 line ~573 403→404 remap claim → corrected to "deferred to Phase 5.5" matching the `edge-stack.ts` note; add the FR-008 note that prod inherits via its own `next_public_site_url` value at cutover
- [x] T015 [P] [US3] Reconcile `tools/ingest-photos/STAGING_INGEST.md`: fix the line-78 key-shape claim (`<media-id>/<filename>` → `media/<filename>`), note that filename-stable replacements rely on the invalidation hook, and reference `rekey-staging.ts` as the one-shot migration that already ran
- [x] T016 [US3] Flip `docs/decisions/0008-media-cloudfront-serving.md` Status: Proposed → **Accepted**; record the three resolved sub-decisions (key shape `media/<filename>` per clarification 2026-06-09; URL host = site domain `/media/*` behavior; `serverURL` via `next_public_site_url` SSM param) and the R4 in-place re-key amendment; link spec 009
- [x] T017 [US3] **Verification deliverable** (doc-review acceptance per carve-out): cross-check the three surfaces of `contracts/media-url.md` agree — `src/payload/storage/s3.ts` (prefix + helper), `infra/lib/edge-stack.ts` `/media/*` behavior (unchanged, no originPath), ARCHITECTURE §5/§6 — and that no doc still claims `<media-id>/<filename>` (`grep -rn 'media-id' docs/ tools/ src/`)

**Checkpoint**: All three stories complete; docs and code agree.

---

## Phase 5: Polish & Cross-Cutting

- [x] T018 Full CI-parity gate locally: `npm run typecheck && npm run lint && npm run format:check && npm run test:int && npm run test:e2e` + Lighthouse budgets (note: consent/CSP Lighthouse failures from real local HubSpot/GTM IDs are a known local-only condition — pass in CI)
- [x] T019 Final quickstart.md walkthrough: every §Verify command re-run clean; PR description links the evidence (T012, T013, T017); conventional-commit series reviewed (`fix(media): …`, `fix(infra): …`, `docs: …`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: no dependencies — start immediately
- **Phase 2 (US1)**: T003/T004/T007 can start immediately (parallel with Phase 1); T005–T006 after their tests fail; T010 needs Phase 1 merged + T002–T009 complete; T011 after T010; T012 after T011
- **Phase 3 (US2)**: T013 needs only Phase 1 + T010 (instance refresh) — independent of the US1 re-key
- **Phase 4 (US3)**: T014–T016 are doc edits — can be written any time after plan approval, but land in the same PR as the code (Constitution III); T017 after T014–T016
- **Phase 5**: after everything

### Task-level notes

- T010 is the single deploy gate for both US1 and US2 (one merge, one instance refresh)
- T011's move-then-patch order is load-bearing (static-handler fallback stays alive mid-migration)
- New uploads after T010 already land at `media/<filename>` — T011's script must (and does) skip keys already under `media/`

### Parallel Opportunities

```text
Immediately:        T001 ∥ T003 ∥ T004 ∥ T007   (different files, all "write the failing artifact")
After tests fail:   T002 ∥ T005 → T006
Docs any time:      T014 ∥ T015 (T016 after both, same PR)
After T010:         T011→T012 ∥ T013
```

---

## Implementation Strategy

**MVP = Phase 1 + Phase 2 (US1)**: one PR carrying T001–T009 + the Phase 4 doc tasks (Constitution III same-change rule), then deploy (T010), migrate (T011), verify (T012–T013, T017). US2 ships "for free" with the same deploy; US3 is the doc spine of the same PR. Realistically this is **one PR + one staging migration session**, not three increments — the story split exists for verification traceability, not for separate deployments.

**Total**: 19 tasks — Foundational: 2 · US1: 10 · US2: 1 · US3: 4 · Polish: 2
