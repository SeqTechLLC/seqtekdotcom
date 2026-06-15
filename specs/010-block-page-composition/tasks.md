---
description: 'Task list for spec 010 — Block-composed pages (two content primitives)'
---

# Tasks: Block-composed pages (two content primitives)

**Input**: Design documents from `/specs/010-block-page-composition/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Per constitution Principle II, every user story ships ≥1 Vitest integration or Playwright E2E test on its load-bearing path; write the test first and verify it FAILS before implementation. No external-verification carve-out is claimed (all paths are in-repo code).

**Organization**: Tasks grouped by user story (US1–US6 from spec.md). The plan's "Phase A foundation" maps to **Phase 2: Foundational** here (blocking prerequisites for all migration stories). Implements ADR 0009.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US6
- Exact file paths included

## Path Conventions

Single Next.js + Payload app: `src/` and `tests/` at repo root; collections in `src/collections/`, blocks in `src/payload/blocks/layout/`, render components in `src/components/sections/`, public routes in `src/app/(frontend)/`, skills in `.claude/skills/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffolding only — this is a mature codebase; no project init.

- [x] T001 Scaffold new source directories: `src/payload/seed/compose/`, `src/payload/seed/skeletons/`, `.claude/skills/compose-page/`, `.claude/skills/convert-to-blocks/`
- [x] T002 Confirm baseline green before changes: `tsc`, `npm run lint`, `npm test`, `npm run test:e2e` all pass on `feat/010-block-page-composition`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The gap-fill blocks, type-generic wiring, composer scaffold, and reading-column centralization that ALL migration stories depend on (plan Phase A). Also delivers the FR-005 image/gallery gap and the SC-005 coverage audit.

**⚠️ CRITICAL**: No migration story (US1, US2, US5) can begin until this phase is complete.

- [x] T003 [P] Create `image` block (single figure: image/caption/width/alignment) in `src/payload/blocks/layout/Image.ts` per data-model.md
- [x] T004 [P] Create `gallery` block (1..N images, captions, grid/carousel, columns) in `src/payload/blocks/layout/Gallery.ts` per data-model.md — the "add 1-to-many pictures to any page layout" block
- [x] T005 Register `image` + `gallery` in `src/payload/blocks/layout/index.ts` (depends T003, T004)
- [x] T006 [P] Create `Image` render component (honors reading column §11.4) in `src/components/sections/Image.tsx`
- [x] T007 [P] Create `Gallery` render component (grid/carousel, captions) in `src/components/sections/Gallery.tsx`
- [x] T008 Register `image`, `gallery` slugs in `src/components/sections/registry.ts` (depends T006, T007)
- [x] T009 [P] Add showcase fixtures for `image` + `gallery` in `src/payload/seed/showcase/fixtures.ts`
- [x] T010 Run `npm run generate:types` and create the Payload migration for the new `pages_blocks_image`/`pages_blocks_gallery` (+ `_v`) tables under `src/migrations/` (depends T005, T008)
- [x] T011 [P] Add `image`+`gallery` render coverage + null/empty resilience test in `tests/int/blocks/imageGallery.int.spec.ts`
- [x] T012 [P] Centralize reading-column enforcement in block components and reconcile `docs/DESIGN_SYSTEM.md` §11.4 to "rule lives in blocks" (FR-009); remove interim per-template centering assumptions
- [x] T013 [P] Add `workshops` and `teamMembers` to `PREVIEW_COLLECTIONS` + `publicPathFor` (`/workshops/${slug}`, `/team/${slug}`) in `src/payload/livePreview/url.ts`
- [x] T014 [P] Create shared composer helpers (reuse `upsertBySlug`, `buildLexical`, dry-run JSON-Lines, migration logger) in `src/payload/seed/compose/shared.ts`
- [x] T015 Create the field→layout fidelity + idempotency test harness in `tests/int/seed/composeFidelity.int.spec.ts` (shared scaffold; per-type cases added in their stories) per contracts/migration-fidelity.md
- [x] T016 [P] Document the block-coverage audit in `docs/BLOCK_LIBRARY.md`: every retired-template capability maps to ≥1 block, 0 lost (SC-005)
- [x] T017 Visual-verify new blocks: `npm run seed:showcase` then `PLAYWRIGHT_BASE_URL=http://localhost:3100 npm run visual:capture`; open `image`/`gallery` PNGs at desktop+mobile and judge — **DONE**: captured + reviewed `block-image` and `block-gallery` at desktop+mobile. Image: 3 width variants (standard/wide/full) progressively wider, all reading-axis-centered, captions correct. Gallery: 3-col grid → 1-col on mobile + horizontal snap carousel, captions intact. All 171 showcase/route captures passed (no render errors).

**Checkpoint**: Block library complete (45 blocks), wiring type-generic, composer + fidelity harness ready — migration stories can begin.

---

## Phase 3: User Story 1 — Compose a workshop page from blocks, no deploy (Priority: P1) 🎯 MVP

**Goal**: Workshops body is block-composed and editor-rearrangeable with no deploy — the acceptance gate for the whole feature.

**Independent Test**: On staging, reorder two blocks on a published workshop and publish → public page reflects the new order with no code change; workshop still appears on the listing and emits valid JSON-LD.

### Tests for User Story 1 (write first, verify FAIL)

- [x] T018 [P] [US1] Workshops field→layout fidelity + idempotency case in `tests/int/seed/composeFidelity.int.spec.ts` (SC-003/SC-004)
- [x] T019 [P] [US1] E2E: reorder-without-deploy + listing/JSON-LD parity for workshops in `tests/e2e/blocks/workshops-compose.e2e.spec.ts`

### Implementation for User Story 1

- [x] T020 [US1] Add `layout` blocks field (+ `defaultValue` skeleton) and `admin.livePreview = livePreviewFor('workshops')` to `src/collections/Workshops.ts`; set `description`/`format`/`audience`/`deliverables`/`photos`/`video` to `admin.hidden:true, readOnly:true` (expand/contract, R2)
- [x] T021 [P] [US1] Default workshop skeleton in `src/payload/seed/skeletons/workshop.ts` (FR-008)
- [x] T022 [US1] `npm run generate:types` + Payload migration `add_layout_workshops` (live + `_v` block tables) under `src/migrations/` (depends T020)
- [x] T023 [US1] Workshop composer `src/payload/seed/compose/workshopToLayout.ts` per data-model.md mapping (content/deliverables/gallery/video-embed/testimonial-block)
- [x] T024 [US1] Switch `src/app/(frontend)/workshops/[slug]/page.tsx` body to `<RenderBlocks layout={…}/>`; keep metadata, breadcrumb JSON-LD, and the cached-read-then-`draftMode()` ordering
- [x] T025 [US1] Extend cache-tag parity keystone test for `workshops` in `tests/int/lib/payload-cache-tags.int.spec.ts` (C1)
- [x] T026 [US1] Run `workshopToLayout` (dry-run → verify JSON-Lines + zero writes, then real); re-run to confirm idempotent; fidelity test green
- [x] T027 [US1] Visual-verify: capture `/workshops` + `/workshops/[slug]` at desktop+mobile; open PNGs and judge vs pre-migration render (measure boxes if any alignment doubt) — **DONE**: composer ran against dev DB (6 workshops composed). Reviewed `/workshops` (listing intact — numbered cards unchanged) and `/workshops/touchstone` detail at desktop+mobile: full composed layout renders in documented order (content×3 with section headers → deliverables → gallery with REAL workshop photos → video-embed → contact-cta), reading column centered, responsive single-column on mobile. E2E reorder-without-deploy + listing/JSON-LD parity green.

**Checkpoint**: Workshops fully block-composed, editor-rearrangeable, listing/JSON-LD intact. MVP shippable.

---

## Phase 4: User Story 2 — Same composition for case studies, services, and team (Priority: P2)

**Goal**: Apply the proven pattern to case studies → services → team. Each retires its bespoke template body for block composition while preserving listings/SEO/nested URLs. Sequenced after US1 to limit blast radius; the three increments are independently testable.

**Independent Test**: For each type, an editor reorders/enriches a record and the detail page updates with no deploy; the type's listing + JSON-LD are unchanged.

### Case studies

- [x] T028 [P] [US2] caseStudies fidelity + idempotency case in `tests/int/seed/composeFidelity.int.spec.ts`
- [x] T029 [P] [US2] E2E: case-study detail renders via RenderBlocks + grid/listing + breadcrumb parity in `tests/e2e/blocks/case-studies-compose.e2e.spec.ts`
- [x] T030 [US2] Add `layout` (+ skeleton) to `src/collections/CaseStudies.ts`; hide `problem`/`solution`/`impact`/`metrics`/`technologies`
- [x] T031 [P] [US2] Default case-study skeleton in `src/payload/seed/skeletons/caseStudy.ts`
- [x] T032 [US2] generate:types + migration `add_layout_case_studies` (live + `_v`) under `src/migrations/` (depends T030)
- [x] T033 [US2] Composer `src/payload/seed/compose/caseStudyToLayout.ts` (case-study-hero/content/stats-bar+metric-display/tech-stack/key-takeaways/testimonial-block)
- [x] T034 [US2] Switch `src/app/(frontend)/case-studies/[slug]/page.tsx` body to `<RenderBlocks/>`; keep metadata/breadcrumb/draft
- [x] T035 [US2] Run composer (dry-run → real); idempotency + fidelity green
- [x] T036 [US2] Visual-verify `/case-studies` + `/case-studies/[slug]` at both viewports

### Services

- [x] T037 [P] [US2] services fidelity + idempotency case in `tests/int/seed/composeFidelity.int.spec.ts`
- [x] T038 [P] [US2] E2E: nested `/services/[pillar]/[slug]` renders via RenderBlocks + breadcrumb + pillar-move revalidation parity in `tests/e2e/blocks/services-compose.e2e.spec.ts`
- [x] T039 [US2] Add `layout` (+ skeleton) to `src/collections/Services.ts`; hide `description`/`approach`/`deliverables`/`faq`
- [x] T040 [P] [US2] Default service skeleton in `src/payload/seed/skeletons/service.ts`
- [x] T041 [US2] generate:types + migration `add_layout_services` (live + `_v`) under `src/migrations/` (depends T039)
- [x] T042 [US2] Composer `src/payload/seed/compose/serviceToLayout.ts` (content/deliverables/faq — `faq` block preserves FAQPage JSON-LD)
- [x] T043 [US2] Switch `src/app/(frontend)/services/[pillar]/[slug]/page.tsx` body to `<RenderBlocks/>`; preserve nested URL + breadcrumb; leave `revalidateOnChange` services pillar-move logic untouched
- [x] T044 [US2] Run composer; idempotency + fidelity green
- [x] T045 [US2] Visual-verify `/services`, `/services/[pillar]`, `/services/[pillar]/[slug]` at both viewports

### Team (page + block; owner clarification 2026-06-14)

- [x] T046 [P] [US2] teamMembers fidelity + idempotency case in `tests/int/seed/composeFidelity.int.spec.ts`
- [x] T047 [P] [US2] E2E: `/team/[slug]` renders via RenderBlocks + Person JSON-LD + `/team` listing parity in `tests/e2e/blocks/team-compose.e2e.spec.ts`
- [x] T048 [US2] Update access-matrix test: `teamMembers` moves to the `editorial-draftable` tier in `tests/int/collections/access.int.spec.ts`
- [x] T049 [US2] In `src/collections/TeamMembers.ts`: add `layout` (+ skeleton), `versions:{drafts:true,maxPerDoc:50}`, `livePreviewFor('teamMembers')`, `enforceDraftWhenScheduled`, and an `seo` group; hide `bio`/`expertise`/`certifications`/`education`/`personalFacts`/`quote`
- [x] T050 [P] [US2] Default team-member skeleton in `src/payload/seed/skeletons/teamMember.ts`
- [x] T051 [US2] generate:types + migration `add_layout_team_members` (adds version tables since teamMembers was non-versioned) under `src/migrations/` (depends T049)
- [x] T052 [US2] Composer `src/payload/seed/compose/teamMemberToLayout.ts` (content/deliverables/key-takeaways/testimonial-block)
- [x] T053 [US2] Add `personLd(member)` to `src/lib/structured-data.ts` and `getTeamMemberBySlug` cached reader to `src/lib/payload.ts` (detailCacheTags parity)
- [x] T054 [US2] Create NEW route `src/app/(frontend)/team/[slug]/page.tsx` — RenderBlocks body + Person + breadcrumb JSON-LD + cached-read-then-draftMode ordering + PreviewBanner
- [x] T055 [US2] Update `src/app/(frontend)/team/page.tsx` listing cards to link to `/team/[slug]`; confirm the existing `team-grid` block still composes team onto any page with no new code (page + block, per clarification)
- [x] T056 [US2] Extend cache-tag parity for `teamMembers` (incl. `/team/[slug]` path) and confirm `sitemap.ts` enumerates `/team/[slug]` via `publishedSlugsFor('teamMembers')`
- [x] T057 [US2] Run composer; idempotency + fidelity green
- [x] T058 [US2] Visual-verify `/team` + `/team/[slug]` at both viewports

**Checkpoint**: Case studies, services, and team all block-composed; listings/JSON-LD/nested URLs preserved; team usable both as a page and as a block.

---

## Phase 5: User Story 3 — Design a page from existing blocks via a skill (Priority: P3)

**Goal**: An authoring skill composes a page from existing blocks, or names the single missing block.

**Independent Test**: Run the skill on a brief → valid block layout using only existing blocks, OR a named missing block. No bespoke page code.

- [x] T059 [P] [US3] Fixture check: `compose-page` output uses only `registry.ts` slugs or names exactly one gap, in `tests/int/skills/composePage.int.spec.ts` (validates emitted layout shape per contracts/authoring-skill.md) — **DONE**: test validates the two committed worked-example outputs in `.claude/skills/compose-page/examples/` against the registry (source of truth), asserting (a) exactly one output mode per example, (b) ≥1 layout AND ≥1 gap present, (c) every layout `blockType` is a real registry slug, (d) every named gap is a genuine gap (slug absent from registry) with a reason + valid `nearestExisting`. Verified FAIL before examples existed → 6/6 green after.
- [x] T060 [US3] Implement `.claude/skills/compose-page/SKILL.md` (frontmatter + procedure) citing BLOCK_LIBRARY §5/§6, DESIGN_SYSTEM §11.4, CONTENT-REQUIREMENTS §8 (FR-010) — **DONE**: user-invocable skill (frontmatter matches speckit format) with a 6-step procedure (read registry as authoritative slug source → start from per-type skeleton → map sections to best-fit blocks → honor reading-column/AICO/no-em-dash rules → decide layout vs single gap → validate every slug against registry). Documents the doc-name↔slug drift (testimonial-single→testimonial-block, latest-insights→post-list, markets-map→map, etc.; registry wins) and the JSON output schema. Two test-guarded `examples/` (careers-page layout, savings-calculator gap).

**Checkpoint**: Net-new pages authorable from blocks at speed.

---

## Phase 6: User Story 4 — Adding a block type is the only code path (Priority: P3)

**Goal**: Bound and document the single legitimate code path; the `image`/`gallery` blocks (Phase 2) are the worked example.

**Independent Test**: Follow the documented loop to add a block → it appears in the library, renders via the shared renderer, is documented, and is usable on any page type with no per-type code.

- [x] T061 [P] [US4] Integration test proving a new block (`gallery`) renders on multiple page types (page + case study + workshop) with no per-type code, in `tests/int/blocks/blockReuseAcrossTypes.int.spec.tsx` (`.tsx` — renders JSX, matching `imageGallery.int.spec.tsx`) — **DONE**: 13 assertions across three legs — (1) schema reuse: exactly one `gallery` definition (object identity === the exported block), reachable from page/case-study/workshop `layout` because all spread the same `layoutBlocks`; (2) render reuse: the one `RenderBlocks` dispatcher renders the gallery to byte-identical DOM for all three types; (3) no per-type code: one registry entry resolves `gallery`, and the workshops/case-studies/team/pages detail routes each hand their whole `layout` to `<RenderBlocks blocks={layout}>`. Assertions have teeth (config object-identity + real route source + render output). 13/13 green.
- [x] T062 [US4] Document the block-curation loop (missing capability → fix/add block → document → available everywhere) in `docs/BLOCK_LIBRARY.md`; update inventory to 45 blocks (FR-011) — **DONE**: added §5.9 "Block-curation loop — the one code path" (surface gap → confirm it's real, prefer extending an existing block → add/fix block: config+index+layoutBlocks, component+registry, generate:types/importmap, migration for live+`_v` tables, showcase+visual → document in §5 + bump count → available everywhere via shared `layoutBlocks`/`RenderBlocks`). Cites the guard tests (registryCoverage + blockReuseAcrossTypes) and the compose-page skill. Inventory: verified exactly 45 (registry + `layoutBlocks` both count 45); §5.7's "+2 → 45 blocks" line stands.

**Checkpoint**: The one code path is documented and demonstrated.

---

## Phase 7: User Story 5 — Homepage composed from blocks (Priority: P3)

**Goal**: The homepage global is block-composed (highest-risk, last). Hero, conversion signals, and SEO preserved.

**Independent Test**: Reorder/edit homepage sections in admin → live after publish with no deploy; Organization JSON-LD + analytics unchanged.

- [ ] T063 [P] [US5] Homepage-global fidelity case in `tests/int/seed/composeFidelity.int.spec.ts`
- [ ] T064 [P] [US5] E2E: `/` renders via RenderBlocks + Organization JSON-LD present + `cta_click`/`case_study_view` analytics signals intact in `tests/e2e/blocks/homepage-compose.e2e.spec.ts`
- [ ] T065 [US5] Add `layout` blocks field to `src/globals/Homepage.ts`; hide `hero`/`stats`/`featuredCaseStudy`/`brandTeaser`/`clientLogos`/`featuredTestimonials`
- [ ] T066 [US5] generate:types + migration `add_layout_homepage` under `src/migrations/` (depends T065)
- [ ] T067 [US5] Composer `src/payload/seed/compose/homepageToLayout.ts` (homepage-hero/stats-bar/featured-case-study/brand-teaser/client-logo-grid/featured-testimonials)
- [ ] T068 [US5] Switch `src/app/(frontend)/page.tsx` to `<RenderBlocks/>`; preserve `getHomepage()`, `homepage_list` tag, Organization JSON-LD, analytics
- [ ] T069 [US5] Run composer; visual-verify `/` at both viewports

**Checkpoint**: Every non-blog page renders through RenderBlocks (SC-001 reachable).

---

## Phase 8: User Story 6 — Convert an existing page into blocks via a skill (Priority: P3)

**Goal**: A re-runnable conversion skill turns an existing page (migrated record, Wix-audit page, or hand-built) into a block layout reproducing its content, or names the missing block.

**Independent Test**: Run the skill on an existing page → block layout reproducing source content using only existing blocks, OR a named missing block. No bespoke page code.

- [x] T070 [P] [US6] Fixture: `convert-to-blocks` reproduces a known record's content (or names one gap) and is re-runnable (stable output), in `tests/int/skills/convertToBlocks.int.spec.ts` per contracts/conversion-skill.md — **DONE**: 9 assertions over two committed `examples/` — (1) each names a real source (ref + type + `mustReproduce` units); (2) exactly one output mode, both branches present; (3) layout uses only registry slugs; (4) **reproduction**: every declared source unit appears in the emitted layout; (5) **re-runnable/consistency**: the migrated-workshop example's block sequence is asserted equal to `composeWorkshopLayout(source.record)` (pure composer → also pins idempotency, so skill + migration-of-record can't diverge); (6) gap names a genuine missing block. Verified FAIL before examples → 9/9 green.
- [x] T071 [US6] Implement `.claude/skills/convert-to-blocks/SKILL.md` (frontmatter + procedure), distinct from the per-type seed composer and the authoring skill (FR-014) — **DONE**: user-invocable skill with a 7-step reproduce-don't-author procedure (read source: migrated record / Wix-audit / hand-built → inventory content units → map to existing blocks reproducing source words+media → honor reading-column/no-em-dash/alt rules → layout or one gap → re-runnable pure-of-source ordering → validate slugs + composer consistency). Carries an explicit 3-way distinction table vs the per-type seed composer (FR-007, code) and `compose-page` (FR-010, authors net-new); for migrated records it mirrors the per-type composer mapping. Two test-guarded `examples/` (migrated-workshop layout, wix-audit gap). Restored the §5.9 link to this skill in BLOCK_LIBRARY.

**Checkpoint**: Existing/legacy pages convertible to blocks repeatably.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final doc reconciliation, the expand/contract close-out, and the full acceptance sweep.

- [ ] T072 [P] Reconcile docs in-change: `docs/BLOCK_LIBRARY.md` (45 blocks final + curation loop), `docs/ARCHITECTURE.md` §2 (content models = two primitives), `docs/DESIGN_SYSTEM.md` §11.4 (reading column owned by blocks)
- [ ] T073 Move the spec 010 ROADMAP item to `docs/PROJECT_HISTORY.md` (preserve ID; not a checkbox flip) per constitution III
- [ ] T074 SC-001 guard: add a test/grep asserting zero bespoke per-type body render templates remain except Posts in `tests/int/render/`
- [ ] T075 Follow-up migration `drop_legacy_body_columns` (live + `_v` tables) under `src/migrations/` — **DEFERRED**: run only after each migrated type has soaked one release (expand/contract close-out, R2)
- [ ] T076 [P] Final visual-capture sweep across all migrated routes (`/`, `/workshops/[slug]`, `/case-studies/[slug]`, `/services/[pillar]/[slug]`, `/team/[slug]`) at both viewports; add `/team/[slug]` to the `ROUTES` list in `tests/e2e/visual/pages.e2e.spec.ts`; open PNGs and judge
- [ ] T077 Run the full quickstart.md validation gate (US→test map green; no-deploy reorder proof per type; access matrix + cache-tag parity green)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; **BLOCKS** US1, US2, US5 (they need image/gallery, type-generic preview wiring, and the composer harness). US3/US4/US6 (skills + curation doc) depend only on the block library existing (Phase 2 blocks + registry).
- **US1 (Phase 3)**: after Foundational. MVP.
- **US2 (Phase 4)**: after Foundational; sequenced after US1 ships (pilot proves the model). The three increments (case studies, services, team) are independent of each other.
- **US3, US4, US6 (Phases 5, 6, 8)**: after Foundational; independent of the migration stories.
- **US5 (Phase 7)**: after Foundational; sequenced LAST among migrations (highest-risk) per FR-013/US5.
- **Polish (Phase 9)**: after all desired stories; T075 is explicitly deferred a release.

### Within each migration type (US1/US2/US5)

Tests (write first, FAIL) → collection/global schema edit → generate:types + Payload migration → composer + skeleton → template switch to RenderBlocks → run composer (dry-run then real) + idempotency → cache-tag/parity extension → visual verify. Migration depends on the schema edit; composer run depends on the migration applied.

### Parallel Opportunities

- Phase 2: T003/T004 (block configs), T006/T007 (render components), then T009/T011/T012/T013/T014/T016 are largely parallel (different files).
- Within a type: the two test tasks `[P]` and the skeleton `[P]` parallelize; schema→migration→template are sequential.
- Across US2: case studies, services, and team can be staffed in parallel after Foundational (different files), though the plan recommends sequencing for blast-radius control.
- US3, US4, US6 skills/docs can proceed in parallel with the migration stories.

---

## Parallel Example: User Story 1

```bash
# Write both US1 tests first (they must FAIL before T020+):
Task: "Workshops fidelity + idempotency case in tests/int/seed/composeFidelity.int.spec.ts"
Task: "E2E reorder-without-deploy + listing/JSON-LD parity in tests/e2e/blocks/workshops-compose.e2e.spec.ts"

# Skeleton parallels the schema edit (different files):
Task: "Default workshop skeleton in src/payload/seed/skeletons/workshop.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational (CRITICAL — blocks all migrations).
2. Phase 3 US1 Workshops.
3. **STOP and VALIDATE**: reorder two blocks on a staging workshop and publish with no deploy; listing + JSON-LD intact.
4. Ship the pilot (SC-007: pilot fully usable before later phases begin).

### Incremental Delivery

Foundational → US1 (MVP) → US2 case studies → US2 services → US2 team → US3/US4/US6 (skills + curation doc, any order) → US5 homepage (last, highest-risk) → Polish. Each migration phase is independently shippable (FR-013); the `drop_legacy_body_columns` migration (T075) lands a release later.

---

## Notes

- [P] = different files, no incomplete-task dependency.
- Tests are mandatory per constitution II; write them first and verify they FAIL.
- Every schema change is a Payload migration (live + `_v` tables), never `drizzle-kit push` (constitution V).
- Old body fields are hidden, not dropped, until the soak release (expand/contract, R2) — T075.
- Visual verification (open the PNGs at both viewports, measure boxes on doubt) is required for every migrated route per CLAUDE.md + DESIGN_SYSTEM §11.4.
- No new runtime deps; no version bumps; JSON-LD stays nonce-safe.
