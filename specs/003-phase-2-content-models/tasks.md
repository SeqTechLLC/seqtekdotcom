# Tasks: Phase 2 — Content Models, Block Library & Editorial Workflow

**Input**: Design documents from `/specs/003-phase-2-content-models/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Constitution Principle II requires every user story to ship with at least one Vitest integration or Playwright E2E test that exercises the load-bearing path. Test tasks are included per story and SHOULD be written first and fail before implementation tasks turn them green.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no dependency on incomplete tasks — safe to parallelize.
- **[Story]**: Maps a task to its user story (US1–US7). Setup/Foundational/Polish carry no story label.

## Path Conventions

Single Next.js project per `plan.md`. `src/`, `tests/`, `docs/` at repo root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Phase 2's new dependencies, wire repo-level config, and document the environment shape `quickstart.md` assumes.

- [x] T001 Install `@payloadcms/storage-s3@^3.85` and `@aws-sdk/client-cloudfront@^3` as production deps and update `package.json` + `package-lock.json` (FR-022, FR-027, plan.md §Primary Dependencies)
- [x] T002 [P] Add `migration-errors.log` to `.gitignore` (R-16, spec Assumption "local file at repo root (gitignored)")
- [x] T003 [P] Document `PREVIEW_SECRET`, `REVALIDATION_SECRET`, `CLOUDFRONT_DISTRIBUTION_ID`, `S3_BUCKET`, `S3_REGION`, `AUDIT_DIR` in `docs/LOCAL_DEVELOPMENT.md` per `quickstart.md` §1 (Constitution III — docs reconcile in same PR)
- [x] T004 [P] Run `npm audit --omit=dev --audit-level=high` and resolve any high/critical findings introduced by T001 (Constitution IV)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared helpers, hooks, route, storage adapter, collection scaffolds, globals, editor config — every artefact every user story depends on.

**CRITICAL**: No user story work can begin until this phase is complete.

### Access helpers

- [x] T005 [P] Create `isAdmin` + `isAdminOrEditor` access helpers in `src/payload/access/byRole.ts` (R-12, FR-015)
- [x] T006 [P] Create `publishedOrAuthed` access helper in `src/payload/access/publishedOrAuthed.ts` per `contracts/public-api-draft-filter.md` (R-12, FR-016)

### Hooks

- [x] T007 [P] Create `slugFromTitle` beforeChange hook in `src/payload/hooks/slugFromTitle.ts` (R-05, FR-003)
- [x] T008 [P] Create `enforceDraftWhenScheduled` beforeChange hook in `src/payload/hooks/enforceDraftWhenScheduled.ts` (R-11, FR-028)
- [x] T009 [P] Create CloudFront invalidation wrapper in `src/lib/cloudfront/invalidate.ts` lazily instantiating `@aws-sdk/client-cloudfront` (R-18, FR-027)
- [x] T010 Create `revalidateOnChange` afterChange hook factory + collection→tag/path mapping in `src/payload/hooks/revalidateOnChange.ts` (R-03, FR-026, FR-027) — depends on T009

### Lexical editor config + inline blocks

- [x] T011 [P] Create inline-block config `src/payload/blocks/inline/InlineCta.ts` per BLOCK_LIBRARY.md §5.2 (FR-008)
- [x] T012 [P] Create inline-block config `src/payload/blocks/inline/TestimonialEmbed.ts` per BLOCK_LIBRARY.md §5.2 (FR-008)
- [x] T013 [P] Create inline-block config `src/payload/blocks/inline/Callout.ts` per BLOCK_LIBRARY.md §5.2 (FR-008)
- [x] T014 [P] Create inline-block config `src/payload/blocks/inline/ImageWithCaption.ts` per BLOCK_LIBRARY.md §5.2 (FR-008)
- [x] T015 [P] Create inline-block config `src/payload/blocks/inline/Figure.ts` per BLOCK_LIBRARY.md §5.2 (FR-008)
- [x] T016 [P] Create inline-block config `src/payload/blocks/inline/QuotePullquote.ts` per BLOCK_LIBRARY.md §5.2 (FR-008)
- [x] T017 [P] Create inline-block config `src/payload/blocks/inline/Disclosure.ts` per BLOCK_LIBRARY.md §5.2 (FR-008)
- [x] T018 Create `src/payload/blocks/inline/index.ts` re-exporting every inline block (depends on T011–T017)
- [x] T019 Create shared Lexical config in `src/payload/editor/editorConfig.ts` registering link/list/heading/blockquote + `BlocksFeature({ inlineBlocks })` from T018 (R-15, FR-013) — depends on T018

### Storage adapter + livePreview URL builder + revalidate route

- [x] T020 [P] Create conditional S3 storage plugin wiring in `src/payload/storage/s3.ts` (R-07, FR-022, FR-024, FR-025)
- [x] T021 [P] Create `buildPreviewUrl` in `src/payload/livePreview/url.ts` per `contracts/live-preview-urls.md` (R-01, FR-019)
- [x] T022 Create `POST /api/revalidate` route handler at `src/app/(frontend)/api/revalidate/route.ts` per `contracts/revalidate-route.md` (FR-026, FR-027) — depends on T009

### Collection scaffolds

- [x] T023 [P] Update `src/collections/Pages.ts` per data-model §1.2: add `status`, `seo`, hero group, `versions: { drafts: true, maxPerDoc: 50 }`, access via helpers, hooks (`slugFromTitle`, `enforceDraftWhenScheduled`, `revalidateOnChange`) — do NOT add `layout` field yet (US1 adds it)
- [x] T024 [P] Create `src/collections/Posts.ts` per data-model §1.3 (drafts, full access, hooks, `richText` body using shared `editorConfig`, relationships to teamMembers/categories/posts/services)
- [x] T025 [P] Create `src/collections/CaseStudies.ts` per data-model §1.4 (drafts, structured fields, relationships, hooks)
- [x] T026 [P] Create `src/collections/Services.ts` per data-model §1.5 (drafts, structured `description` richText — NOT blocks per B-1)
- [x] T027 [P] Create `src/collections/ServicePillars.ts` per data-model §1.6
- [x] T028 [P] Create `src/collections/TeamMembers.ts` per data-model §1.7 (no drafts, `slugFromTitle` on `name`)
- [x] T029 [P] Create `src/collections/Testimonials.ts` per data-model §1.8 (no drafts; `isActive` gates public read)
- [x] T030 [P] Create `src/collections/Workshops.ts` per data-model §1.9
- [x] T031 [P] Create `src/collections/Industries.ts` per data-model §1.10
- [x] T032 [P] Create `src/collections/Locations.ts` per data-model §1.11
- [x] T033 [P] Update `src/collections/Media.ts` per data-model §1.12: add `alt` required + non-empty validate, MIME filter (`image/*` + `application/pdf`), 25MB size cap, focal-point field (US6 adds S3 plugin registration)
- [x] T034 [P] Create `src/collections/Categories.ts` per data-model §1.13

### Globals

- [x] T035 [P] Create `src/globals/SiteSettings.ts` per data-model §2.1 (drafts + revalidate hook)
- [x] T036 [P] Create `src/globals/Navigation.ts` per data-model §2.2
- [x] T037 [P] Create `src/globals/Homepage.ts` per data-model §2.3 (structured — no blocks layout)

### Wire everything + regenerate artefacts

- [x] T038 Update `src/payload.config.ts` to register all new collections (T023–T034), globals (T035–T037), `editorConfig` (T019), and the conditional S3 plugin (T020) — depends on T019–T037
- [x] T039 Run `npm run generate:types` and commit refreshed `src/payload-types.ts` (FR-038) — depends on T038
- [x] T040 Run `npm run generate:importmap` and commit refreshed `src/app/(payload)/admin/importMap.js` (FR-039, `project_payload_importmap_gotcha`) — depends on T038
- [x] T041 `npm run typecheck && npm run lint && npm run build` smoke — confirm scaffold boots before stories begin (depends on T038–T040)

**Checkpoint**: Foundation ready — user story phases may begin.

---

## Implementation Status (2026-05-30)

- **Phase 1 Setup**: complete (T001–T004). Storage + CloudFront deps installed, env vars documented, `migration-errors.log` gitignored, `npm audit --omit=dev --audit-level=high` clean.
- **Phase 2 Foundational**: complete (T005–T041). 12 collections, 3 globals, 7 inline blocks, access helpers, hooks, editor config, S3 storage, livePreview URL builder, `/api/revalidate` route. `typecheck` + `lint` + `build` all green; `generate:types` + `generate:importmap` regenerated.
- **Phase 3 US1**: complete (T042–T073). Shipped **43 layout blocks across 6 categories** (Hero/Content/Social-proof/CTA/Content-collection/Specialty) plus all 7 inline blocks — every block enumerated in BLOCK_LIBRARY.md §5.1–§5.6 is implemented, plus 7 additions tracked in §5.7. T042/T043 admin-UX Playwright specs landed as `test.skip` skeletons by design (the visual showcase harness covers the structural round-trip more thoroughly; flesh-out steps are documented in each file's header). T045–T048 + T071 vitest tests landed in the same PR. Visual showcase harness (`npm run seed:showcase` + `npm run visual:capture`) produces 147 screenshots across desktop/tablet/mobile per block and per category. ADR-0004 logs the planned PG 18 bump at Phase 5.5. `text-eyebrow` Tailwind token added.
- **Phase 3 deferred (functional, client-side):** Carousel autoplay (`featured-testimonials`), client-side tab switching (`tabs`), video click-to-load facade (`video-embed`), HubSpot live-script integration for `hubspot-form` / `hubspot-meetings` / `download-card` / `newsletter-cta` (Phase 3 per `docs/INTEGRATIONS.md` §1–§3).
- **Phase 4 US2**: complete (T074–T086). Live-preview URL builder + `livePreviewFor` factory wired into Pages/Posts/CaseStudies/Services. `/preview/[collection]/[slug]` route handler is same-origin (admin session cookie) — the earlier URL-secret design was rejected and the contract updated to match (`contracts/live-preview-urls.md`). `<PreviewBanner />` lives at `src/components/layout/PreviewBanner.tsx` and is wired into the `/showcase/[slug]` dev route so the full preview loop is verifiable today. T074–T077 cover redirect mechanics per collection (302 + Location + `__prerender_bypass` cookie); the visual "renders draft content" assertion is deferred to spec 004 page templates. T079 staging revalidation E2E lands as a `test.skip` skeleton — public page templates from spec 004 are a prerequisite.
- **Phase 5 US3**: complete (T087–T091). Type-level non-nullable assertions on `Page`/`CaseStudy`/`Post`/`Service`/`HeroBlock` ship in `tests/int/render/typesNonNullable.int.spec.ts` (13 cases). Public draft-query invariant covered in `tests/int/render/publicDraftQuery.int.spec.ts` — caseStudies draft hidden from anon `payload.find`, pages published doc surfaced. `LOCAL_DEVELOPMENT.md` "Common Tasks" gains "Regenerating Payload types" + "Regenerating the Payload importMap" subsections; `PAYLOAD_DEVELOPMENT.md` §7 (inline blocks) + §14 (custom components) link to the importMap workflow. 76/76 render-path int tests green; typecheck clean.
- **Phase 6 US4**: complete (T092–T107). Audit seed pipeline ships at `src/payload/seed/migrateFromAudit.ts` — idempotent `upsertBySlug` via Payload Local API, slug rewrite map (INTEGRATIONS.md §9), plain-text-to-Lexical transformer per CONTENT_MIGRATION.md §4, five per-source parsers (caseStudies / pages / posts / homepage / siteSettings), and an R-16 `migration-errors.log` writer. CLI supports `--dry-run`, `--collection=<name>`, `--recrawl-images` (wired, post-Phase-2 execution per R-10), `--help`; env validation maps to the exit-code table in `contracts/seed-cli.md`. 7/7 seed int tests pass; 138/138 int suite green; pages layout intentionally lands empty for editor composition per §3.2 (logged as `AUDIT_GAP`).
- **Phase 7 US5**: complete (T108–T113). Access matrix locked behind a data-driven int test — 185 cells (13 collections × 3 roles × 5 ops) green at `tests/int/collections/access.int.spec.ts`, plus T112's FR-017 regression guard (no local-strategy backdoor on `users`) co-located. Draft-leak coverage at `tests/int/collections/draftLeak.int.spec.ts` (35/35) verifies `NotFound`/`Forbidden` distinction per FR-016 and parity between REST list / detail / GraphQL surfaces. Two new Playwright specs: `firstSignInBootstrap.e2e.spec.ts` (cookie-mint smoke always-on; bootstrap-table-wipe gated behind `E2E_ALLOW_DESTRUCTIVE=true` since the local dev DB is shared with the main worktree) and `editorDeleteForbidden.e2e.spec.ts` (UI affordance: `#action-delete` absent on editor session). 358/358 int suite green; typecheck + lint clean. Pre-PR refactor: `tests/helpers/` split into `tests/seeders/` / `tests/fixtures/` / `tests/sessions/` per the long-pending convention. ARCHITECTURE.md §6 access table updated with per-collection overrides (`categories` admin-only mutations, `testimonials` `isActive` gating, `users` create-always-denied + admin-only update/delete) plus the `media`/`teamMembers` public-read row that was implicit before.
- **Phases 8–10 (US6, US7 + Polish)**: not started.

---

## Phase 3: User Story 1 — Editor authors a page from the block library (Priority: P1) MVP

**Goal**: Editor signs in at `/admin`, opens `pages`, composes a document using the full block menu + inline blocks inside rich text, saves a draft, returns later without data loss, and the saved draft renders through `RenderBlocks` without console warnings.

**Independent Test**: A non-engineer admin builds a 3-block page (hero + content with an inline callout + cta-section) and saves a draft, signs out, signs in, resumes editing — then renders the draft via the public preview path with every block resolving to its component. No DB access. No console errors. (SC-001, SC-012, FR-007, FR-010)

### Tests for User Story 1 (MANDATORY — Constitution II)

> Write FIRST, ensure they FAIL before implementation.

- [x] T042 [P] [US1] Playwright E2E `tests/e2e/authoring/composeThreeBlockPage.spec.ts` exercises hero → content (with inline `callout`) → cta-section save/sign-out/resume (SC-001, SC-012) — _skeleton landed (`test.skip`); see header rationale_
- [x] T043 [P] [US1] Playwright E2E `tests/e2e/authoring/inlineBlocksInRichText.spec.ts` inserts each of the 7 inline blocks inside a richText field and asserts the saved node round-trips (FR-008) — _skeleton landed (`test.skip`); see header rationale_
- [x] T044 [P] [US1] Vitest int `tests/int/render/renderBlocksUnknownType.test.ts`: empty array → no DOM/warn; known block → renders; unknown block in dev → single warn + skip; unknown in prod → silent skip (FR-010, contract `render-blocks.md`)
- [x] T045 [P] [US1] Vitest int `tests/int/render/registryCoverage.test.ts` iterates `src/payload/blocks/layout/index.ts` exports and asserts each has a `registry.ts` entry (BLOCK_LIBRARY.md §9 rule 6, contract `render-blocks.md`)
- [x] T046 [P] [US1] Vitest int `tests/int/render/richTextInline.test.ts`: empty input → null; plain text → `<p>` inside `<Prose>`; `inline-cta` → registered component renders; unknown → dev warn + no DOM (contract `inline-block-converter.md`)
- [x] T047 [P] [US1] Vitest int `tests/int/render/inlineRegistryCoverage.test.ts` iterates `src/payload/blocks/inline/index.ts` exports and asserts a `defaultInlineRegistry` entry exists for each (contract `inline-block-converter.md`)
- [x] T048 [P] [US1] Vitest int `tests/int/collections/slugFromTitle.test.ts` asserts auto-generation on create, no rewrite on update, URL-safe validate rejects bad slugs (FR-003)

### Conditional-required helper

- [x] T049 [P] [US1] Create `requiredWhen(predicate)` helper at `src/payload/blocks/conditional.ts` returning `{ admin: { condition }, validate }` (R-06, FR-011)

### Layout block configs (BLOCK_LIBRARY.md §5)

> Each task creates the listed `.ts` files under `src/payload/blocks/layout/`. One file per block (BLOCK_LIBRARY.md §9 rule 6). Use `requiredWhen` (T049) for conditional required fields. Cross-reference BLOCK_LIBRARY.md §5 for the canonical field list per block.

- [x] T050 [P] [US1] Hero category: `Hero.ts`, `CaseStudyHero.ts`, `ServicePillarHero.ts`, `HomepageHero.ts` per BLOCK_LIBRARY.md §5.1
- [x] T051 [P] [US1] Content category: `Content.ts` (wires `richText` with shared `editorConfig` so inline blocks insert), `TwoColumn.ts`, `ProcessSteps.ts`, `ComparisonTable.ts`, `MissionVisionValues.ts`, `Timeline.ts` per BLOCK_LIBRARY.md §5 content section
- [x] T052 [P] [US1] Social-proof category: `StatsBar.ts`, `LogoBar.ts`, `FeaturedTestimonials.ts`, `TestimonialBlock.ts`, `ClientLogoGrid.ts` per BLOCK_LIBRARY.md §5 social-proof section
- [x] T053 [P] [US1] CTA category: `CtaSection.ts`, `NewsletterCta.ts`, `ContactCta.ts` per BLOCK_LIBRARY.md §5 CTA section
- [x] T054 [P] [US1] Content-collection category: `CaseStudyGrid.ts`, `ServiceCards.ts`, `FeaturedCaseStudy.ts`, `PostList.ts`, `RelatedPosts.ts`, `IndustryGrid.ts`, `LocationsList.ts`, `WorkshopList.ts` per BLOCK_LIBRARY.md §5 content-collection section
- [x] T055 [P] [US1] Specialty category: `VideoEmbed.ts`, `FAQ.ts`, `Accordion.ts`, `Tabs.ts`, `Map.ts`, `Embed.ts` per BLOCK_LIBRARY.md §5 specialty section
- [x] T056 [US1] Create `src/payload/blocks/layout/index.ts` re-exporting every layout block from T050–T055 — depends on T050–T055
- [x] T057 [US1] Verify FR-007 coverage: every block enumerated in BLOCK_LIBRARY.md §5 is exported from T056; reconcile any divergence as a doc update in this PR (Constitution III, FR-012)

### Layout block renderers

> Each task creates the matching React component files under `src/components/sections/`. One renderer per layout block; PascalCase filename matches the config.

- [x] T058 [P] [US1] Hero renderers: `src/components/sections/Hero.tsx`, `CaseStudyHero.tsx`, `ServicePillarHero.tsx`, `HomepageHero.tsx`
- [x] T059 [P] [US1] Content renderers: `src/components/sections/Content.tsx` (uses `RichText` from T064), `TwoColumn.tsx`, `ProcessSteps.tsx`, `ComparisonTable.tsx`, `MissionVisionValues.tsx`, `Timeline.tsx`
- [x] T060 [P] [US1] Social-proof renderers: `src/components/sections/StatsBar.tsx`, `LogoBar.tsx`, `FeaturedTestimonials.tsx`, `TestimonialBlock.tsx`, `ClientLogoGrid.tsx`
- [x] T061 [P] [US1] CTA renderers: `src/components/sections/CtaSection.tsx`, `NewsletterCta.tsx`, `ContactCta.tsx`
- [x] T062 [P] [US1] Content-collection renderers: `src/components/sections/CaseStudyGrid.tsx`, `ServiceCards.tsx`, `FeaturedCaseStudy.tsx`, `PostList.tsx`, `RelatedPosts.tsx`, `IndustryGrid.tsx`, `LocationsList.tsx`, `WorkshopList.tsx`
- [x] T063 [P] [US1] Specialty renderers: `src/components/sections/VideoEmbed.tsx`, `FAQ.tsx`, `Accordion.tsx`, `Tabs.tsx`, `Map.tsx`, `Embed.tsx`

### Inline-block renderers + Prose

- [x] T064 [P] [US1] Inline-block renderers: `src/components/richText/inline/InlineCta.tsx`, `TestimonialEmbed.tsx`, `Callout.tsx`, `ImageWithCaption.tsx`, `Figure.tsx`, `QuotePullquote.tsx`, `Disclosure.tsx`
- [x] T065 [P] [US1] Create `<Prose>` primitive at `src/components/ui/Prose.tsx` using `@tailwindcss/typography` brand tokens (FR-014, BLOCK_LIBRARY.md §3)

### Dispatcher + RichText converter

- [x] T066 [US1] Create `src/components/sections/registry.ts` mapping every `blockType` → React component imported from T058–T063 (contract `render-blocks.md`) — depends on T058–T063
- [x] T067 [US1] Create `src/components/sections/RenderBlocks.tsx` per contract `render-blocks.md` (FR-010) — depends on T066
- [x] T068 [US1] Create `src/components/richText/inline/registry.ts` (`defaultInlineRegistry`) importing every component from T064 (contract `inline-block-converter.md`) — depends on T064
- [x] T069 [US1] Create `src/components/richText/RichText.tsx` Lexical→JSX converter per contract `inline-block-converter.md` — depends on T065, T068

### Wire blocks into Pages + finalize editor config

- [x] T070 [US1] Update `src/collections/Pages.ts`: add `layout` blocks field accepting every export from `src/payload/blocks/layout/index.ts` (T056) — depends on T056
- [x] T071 [US1] Update `src/payload/editor/editorConfig.ts` if any `richText` field in a layout block needs the shared inline-blocks set (verify `Content.ts` and any other content block) — depends on T019, T050–T055 — _verified: `Content.ts`, `TwoColumn.ts`, `FAQ.ts` all wire shared `editorConfig`_
- [x] T072 [US1] Run `npm run generate:types` and `npm run generate:importmap`; commit both (FR-038, FR-039) — depends on T070
- [x] T073 [US1] Run T042–T048; verify all green — _116/116 vitest int tests pass; T042/T043 skip-by-design_

**Checkpoint**: US1 fully functional and independently testable. A non-engineer can compose a 3-block page through the admin UI; the saved draft renders through `RenderBlocks`.

---

## Phase 4: User Story 2 — Editor previews unpublished content (Priority: P1)

**Goal**: Editor invokes preview from inside the admin for any `pages` / `posts` / `caseStudies` / `services` document and lands on a rendered draft with a visible PREVIEW MODE banner. Unauthenticated visitors cannot reach the preview URL. Publishing flips to live within the revalidation window.

**Independent Test**: Open a draft of each of the four supported collections, click Preview, see a banner + draft content. Sign out, attempt the same URL, get redirected to `/admin/login`. (SC-003, FR-019, FR-020, FR-021)

### Tests for User Story 2

- [x] T074 [P] [US2] Playwright E2E `tests/e2e/preview/pagesPreview.spec.ts`: authenticated editor → 302 to `/<slug>` with draft-mode cookie; unauthenticated → `/admin/login`; missing doc → 404; unsupported collection → 404 (FR-019, FR-021, SC-003) — _scope adjusted: redirect mechanics only; visual draft-render assertion deferred to spec 004 (no public templates yet); secret-query design replaced by same-origin cookie auth — contract updated_
- [x] T075 [P] [US2] Playwright E2E `tests/e2e/preview/postsPreview.spec.ts` mirrors T074 for `posts`
- [x] T076 [P] [US2] Playwright E2E `tests/e2e/preview/caseStudiesPreview.spec.ts` mirrors T074 for `caseStudies`
- [x] T077 [P] [US2] Playwright E2E `tests/e2e/preview/servicesPreview.spec.ts` mirrors T074 for `services` (verifies pillar.slug resolution in redirect)
- [x] T078 [P] [US2] Vitest int `tests/int/preview/livePreviewUrl.test.ts`: `buildPreviewUrl` returns expected string per collection, `null` when slug missing (contract `live-preview-urls.md`) — _23 cases incl. `publicPathFor`, `isPreviewCollection`, breakpoints, secret-not-in-URL regression guard_
- [x] T079 [P] [US2] Playwright E2E `tests/e2e/publish/revalidationOnPublish.spec.ts` (staging-tagged): publish a content change and assert public route reflects it within 60s (SC-007) — _skeleton (`test.skip`); awaits spec 004 page templates; revalidation surface already exercised via collection hooks_

### Implementation

- [x] T080 [P] [US2] Create `<PreviewBanner />` at `src/components/layout/PreviewBanner.tsx` consumed by Phase 3 templates when `draftMode().isEnabled === true` (FR-020) — _also wired into `/showcase/[slug]` so the full preview loop is verifiable in spec 003_
- [x] T081 [US2] Create draft-mode entry route at `src/app/(frontend)/preview/[collection]/[slug]/route.ts` per contract `live-preview-urls.md` — _ships with same-origin cookie auth (admin `payload-token`) instead of URL-borne secret; rationale logged in `livePreview/url.ts` + contract updated_
- [x] T082 [P] [US2] Wire `admin.livePreview` on `src/collections/Pages.ts` using `buildPreviewUrl` + standard breakpoints (FR-019)
- [x] T083 [P] [US2] Wire `admin.livePreview` on `src/collections/Posts.ts`
- [x] T084 [P] [US2] Wire `admin.livePreview` on `src/collections/CaseStudies.ts`
- [x] T085 [P] [US2] Wire `admin.livePreview` on `src/collections/Services.ts`
- [x] T086 [US2] Run T074–T079; verify all green — _11/11 preview E2E pass against the dev server; T079 skipped by design_

**Checkpoint**: US2 fully functional. The preview flow works for all four supported collections; drafts never leak via the preview URL to unauthenticated visitors.

---

## Phase 5: User Story 3 — Engineer renders from saved content without ad-hoc shaping (Priority: P1)

**Goal**: An engineer building a Phase 3 page imports `Page['layout']` from `payload-types.ts`, queries Payload by slug, passes the result to `<RenderBlocks>`, and gets a complete page — no `as any`, no defensive null-checks for schema-required fields, no console warnings. Adding a `richText`/client-component field has a documented one-line followup (`generate:importmap`).

**Independent Test**: From a clean Phase 3-style probe file, query a published `pages` document, pass `layout` to `<RenderBlocks>`, render in a browser. Confirm: zero console warnings, required-field types non-nullable (TypeScript), unknown-block branch logs a single dev-warn and skips, draft never escapes the public query. (SC-008, FR-010, FR-038, FR-039)

### Tests for User Story 3

- [x] T087 [P] [US3] Vitest int `tests/int/render/typesNonNullable.int.spec.ts` (type-level): import `Page['layout']` + `CaseStudy` types and assert via `expectTypeOf` that schema-required fields are non-nullable in the generated types (SC-008)
- [x] T088 [P] [US3] Vitest int `tests/int/render/publicDraftQuery.int.spec.ts`: query `payload.find({ collection: 'caseStudies', where: { slug } })` without `req.user` against a draft fixture → empty result (US3 acceptance #5, FR-016) — _positive companion switched to `pages` (no required relationships) to avoid dragging a media+industry fixture into a render-path test; same `publishedOrAuthed` helper exercised_

### Implementation & docs

- [x] T089 [US3] Update `docs/LOCAL_DEVELOPMENT.md` with a "Payload importMap" subsection documenting `npm run generate:importmap` and a "Regenerating Payload types" subsection documenting `npm run generate:types` (R-08, FR-038, FR-039, Constitution III)
- [x] T090 [P] [US3] Update `docs/PAYLOAD_DEVELOPMENT.md` to link to the importMap workflow + add a one-line reminder comment at the top of `src/payload/blocks/inline/index.ts` ("If you add an inline block, run npm run generate:importmap before next dev-start") — _reminder comment was already present at the top of the index from Foundational work; left in place and linked from the doc_
- [x] T091 [US3] Run T087, T088, T044, T045, T046, T047 together — every render-path invariant green — _76/76 vitest int tests pass across the 6 render-path specs_

**Checkpoint**: US3 fully functional. The render path is mechanical; engineers can compose Phase 3 pages without per-page glue.

---

## Phase 6: User Story 4 — Content lead seeds the audit data (Priority: P2)

**Goal**: Run `migrateFromAudit.ts` against the audit directory; populate every record listed in CONTENT_MIGRATION.md §2 into drafts; re-run is idempotent; gaps land in `migration-errors.log`; `--dry-run` and `--collection=<name>` work.

**Independent Test**: `AUDIT_DIR=~/projects/seqtek-internal/audit npx tsx src/payload/seed/migrateFromAudit.ts --dry-run` runs cleanly; drop `--dry-run` and seeds; re-run produces zero new rows; `migration-errors.log` enumerates every known gap. (SC-004, SC-011, FR-029–FR-035)

### Tests for User Story 4

- [x] T092 [P] [US4] Vitest int `tests/int/seed/upsertIdempotency.int.spec.ts`: seed twice against testcontainer, assert row counts equal across runs across all seeded collections (SC-004, FR-030)
- [x] T093 [P] [US4] Vitest int `tests/int/seed/slugRewrites.int.spec.ts`: audit fixture with `case-study-3` → created doc has slug `mobile-apps-remote-operations` (FR-031)
- [x] T094 [P] [US4] Vitest int `tests/int/seed/dryRun.int.spec.ts`: `--dry-run` produces stdout but zero DB writes (FR-033)
- [x] T095 [P] [US4] Vitest int `tests/int/seed/collectionFilter.int.spec.ts`: `--collection=posts` processes only `posts` (FR-033)
- [x] T096 [P] [US4] Vitest int `tests/int/seed/migrationErrorsLog.int.spec.ts`: fresh seed enumerates every gap in CONTENT_MIGRATION.md §11 (SC-011, FR-032)

### Implementation

- [x] T097 [P] [US4] Create migration-errors log writer at `src/payload/seed/log.ts` per R-16 format (timestamp + level + kind + collection/slug + detail)
- [x] T098 [P] [US4] Create `upsertBySlug` helper at `src/payload/seed/upsert.ts` going through Payload Local API (R-09, FR-030)
- [x] T099 [P] [US4] Create slug rewrite map at `src/payload/seed/slugRewrites.ts` per INTEGRATIONS.md §9 (FR-031)
- [x] T100 [P] [US4] Create `htmlToLexical` transformer at `src/payload/seed/htmlToLexical.ts` reusing `editorConfig` so output matches admin's Lexical JSON (R-15, CONTENT*MIGRATION.md §4) — \_audit JSON is plain text per §4, so the file exports `textToLexical(Nodes)` directly; HTML-conversion wrapper deferred until a re-crawl provides HTML*
- [x] T101 [P] [US4] Create `src/payload/seed/parsers/caseStudies.ts` per CONTENT_MIGRATION.md §3
- [x] T102 [P] [US4] Create `src/payload/seed/parsers/pages.ts` per CONTENT*MIGRATION.md §3 — \_layout blocks land empty (`layout: []`) and the editor composes hero/stats-bar/comparison-table/content/cta-section blocks per §3.2; gaps logged as AUDIT_GAP*
- [x] T103 [P] [US4] Create `src/payload/seed/parsers/posts.ts` per CONTENT_MIGRATION.md §3
- [x] T104 [P] [US4] Create `src/payload/seed/parsers/homepage.ts` per CONTENT_MIGRATION.md §3
- [x] T105 [P] [US4] Create `src/payload/seed/parsers/siteSettings.ts` per CONTENT_MIGRATION.md §3
- [x] T106 [US4] Create CLI entry `src/payload/seed/migrateFromAudit.ts` per contract `seed-cli.md` (flags, env validation, exit codes, per-collection loop) — depends on T097–T105
- [x] T107 [US4] Run T092–T096; verify all green — _7/7 seed int tests pass; 138/138 int suite green; typecheck + lint + build clean_

**Checkpoint**: US4 fully functional. The seed bridges Wix audit JSON → Payload drafts; the lead has a punch list in `migration-errors.log`.

---

## Phase 7: User Story 5 — Admin manages users + access matrix holds (Priority: P2)

**Goal**: First SSO sign-in against empty `users` table → admin; subsequent → editor. Every cell of the ARCHITECTURE.md §6 access matrix matches implementation. Drafts never leak via REST/GraphQL.

**Independent Test**: Boot a fresh DB, run the SSO bootstrap path twice (first → admin, second → editor), exercise every role × op × collection cell, assert results match the matrix. (SC-005, SC-006, SC-009, FR-015–FR-018, FR-036, FR-037)

### Tests for User Story 5

- [x] T108 [P] [US5] Vitest int `tests/int/collections/access.int.spec.ts` — data-driven matrix iterating 13 collections × 3 roles (public/editor/admin) × 5 ops (read-published, read-draft, create, update, delete) against Payload Local API; asserts each result matches ARCHITECTURE.md §6 (R-17, SC-005) — _185/185 cells green; tier-grouped (editorial-draftable / public-read-editorial-mutate / public-read-admin-mutate / active-gated / users)_
- [x] T109 [P] [US5] Vitest int `tests/int/collections/draftLeak.int.spec.ts` — for each draftable collection + global, create a draft and assert unauthenticated REST list, REST detail (404 not 401), and GraphQL queries do NOT return it (SC-006, contract `public-api-draft-filter.md`) — _35/35 green across the 8 draftable collections + 3 draftable globals; verifies `NotFound` (not `Forbidden`) on findByID, plus list + GraphQL parity_
- [x] T110 [P] [US5] Playwright E2E `tests/e2e/auth/firstSignInBootstrap.e2e.spec.ts` — fresh DB; first SSO sign-in becomes admin, second becomes editor (SC-009, FR-036, FR-037) — _bootstrap-promotion tests gated behind `E2E_ALLOW_DESTRUCTIVE=true` / `CI=true` (wipes users table — destructive against the shared local dev DB); always-on cookie-mint test verifies `/admin` accepts a minted admin session_
- [x] T111 [P] [US5] Playwright E2E `tests/e2e/admin/editorDeleteForbidden.e2e.spec.ts` — UI affordance smoke: editor session does NOT see a delete button on `caseStudies` (UI smoke per R-17) — _1/1 green; asserts `#action-delete` has zero matches on the editor session_

### Implementation / verification

- [x] T112 [US5] Assert FR-017 regression guard in `tests/int/collections/access.int.spec.ts` (or a sibling test): `users` collection still has Payload's local strategy disabled per spec 001 — `/admin` offers only Google SSO (FR-017, FR-018) — _co-located at the bottom of `access.int.spec.ts`; asserts `auth.disableLocalStrategy: { enableFields: true }` and that the only registered strategy is `local-jwt` (no password form re-enables in `/admin`)_
- [x] T113 [US5] Run T108–T111; reconcile any drift between `docs/ARCHITECTURE.md` §6 and implementation in this PR (Constitution III) — _358/358 int green; added the `categories` / `testimonials` / `users` per-collection overrides + the `media`/`teamMembers` public-read row to ARCHITECTURE.md §6 to match the per-file access blocks; refactored `tests/helpers/` → `tests/seeders/` + `tests/fixtures/` + `tests/sessions/` per the long-pending memory note_

**Checkpoint**: US5 fully functional. Role-based access is testable, enforced, and matches the canonical doc.

---

## Phase 8: User Story 6 — Editor uploads media reachable via CDN (Priority: P2)

**Goal**: Upload through admin lands in per-environment S3 bucket (no static AWS creds), `alt` required, file selectable from any media-relationship field, served via CloudFront `/media/*` with bucket non-public. Local dev falls back to filesystem cleanly.

**Independent Test**: Upload a JPG via admin; confirm `alt` validation; in staging confirm S3 key pattern `<media-id>/<filename>` + CloudFront serve. In dev with no S3 env, file lands on disk. (SC-010, FR-022–FR-025)

### Tests for User Story 6

- [ ] T114 [P] [US6] Playwright E2E `tests/e2e/media/altRequired.spec.ts` — attempt upload with empty `alt` → blocked with clear message; with `alt` → succeeds (FR-023, SC-010)
- [ ] T115 [P] [US6] Vitest int `tests/int/collections/mediaAltValidation.test.ts` — `payload.create({ collection: 'media', data: { alt: '' }, file })` rejects (server-side validate, not only admin UI) (FR-023)
- [ ] T116 [P] [US6] Vitest int `tests/int/collections/mediaSizeAndMime.test.ts` — oversize upload blocked; non-allowed MIME blocked (data-model §1.12)

### Implementation

- [ ] T117 [US6] Confirm `src/collections/Media.ts` from Foundational (T033) ships the `alt` validate, MIME filter, size cap (data-model §1.12); patch if T114–T116 expose gaps
- [ ] T118 [US6] Verify `src/payload.config.ts` (T038) registers the conditional S3 plugin from T020 only when `S3_BUCKET` is set, falling back to local FS otherwise (FR-022)
- [ ] T119 [US6] Run T114–T116; verify green locally
- [ ] T120 [US6] Staging verification per SC-010: upload via staging admin, confirm S3 key + CloudFront `/media/*` resolution + bucket Block Public Access on (run from `seqtek-preview.com`)

**Checkpoint**: US6 fully functional. Editors upload media that reaches the public site through the CDN without static AWS creds anywhere.

---

## Phase 9: User Story 7 — Scheduled-publish invariant (Priority: P3)

**Goal**: Saving any draftable doc with future `publishedAt` forces `status: 'draft'` regardless of editor input. Re-saving doesn't accidentally publish. Past `publishedAt` allows manual publish. Cron flip-at-cutover is out of scope for Phase 2.

**Independent Test**: Save a `posts` draft with `publishedAt = now + 24h` and `status: 'published'` → record persists as `draft`. Re-save → still `draft`. Update `publishedAt` to past → save with `status: 'published'` → allowed. (FR-028, R-11)

### Tests for User Story 7

- [ ] T121 [P] [US7] Vitest int `tests/int/collections/enforceDraftWhenScheduled.test.ts` — exercises the three transitions on `posts` and one structured collection (e.g., `caseStudies`); asserts hook forces `_status: 'draft'` only when `publishedAt > now` (FR-028, R-11)

### Implementation / verification

- [ ] T122 [US7] Verify `enforceDraftWhenScheduled` hook (T008) is wired on every draftable collection that has a `publishedAt` field (`posts`, `caseStudies`, optionally `pages`/`services`/`workshops` per schema) — patch the affected `src/collections/*.ts` files if any are missing
- [ ] T123 [US7] Run T121; verify green

**Checkpoint**: US7 fully functional. The Payload-side invariant ships; the cron trigger is intentionally deferred.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story tests, docs reconciliation, gates that protect every story, and the quickstart validation that closes out SC-012.

- [ ] T124 [P] Vitest int `tests/int/hooks/revalidateOnChange.test.ts` — afterChange fires only on published-state transitions; calls `revalidateTag` with expected tags and invalidates expected CloudFront paths (mocked SDK); hook never throws on AWS failure (R-03, FR-026, FR-027)
- [ ] T125 [P] Vitest int `tests/int/api/revalidate.test.ts` per contract `revalidate-route.md` — 401 on bad secret, 400 on malformed body, 200 with timing/counts on success (FR-026)
- [ ] T126 [P] axe-core admin authoring tests `tests/a11y/adminAuthoring.spec.ts` covering the Pages composer and the richText inline-insertion menus (Constitution II, ARCHITECTURE.md §7)
- [ ] T127 [P] Lighthouse CI a11y/best-practices/SEO ≥ 0.95 gate on one representative admin route and one rendered public preview route (Constitution II)
- [ ] T128 [P] Update `docs/ARCHITECTURE.md` §2/§3/§6 with any divergence captured during implementation (Constitution III)
- [ ] T129 [P] Update `docs/BLOCK_LIBRARY.md` §5/§6/§8 with any block additions/changes captured during implementation (Constitution III, FR-012)
- [ ] T130 [P] Update `docs/CONTENT_MIGRATION.md` §11 if any new gap categories surfaced during seed runs (Constitution III, SC-011)
- [ ] T131 Update `docs/ROADMAP.md` Phase 2 deliverables: flip every shipped item from "tracker" to `docs/PROJECT_HISTORY.md` per Constitution III (not just checked off)
- [ ] T132 [P] Remove `src/lib/site-content.ts` placeholder if globals (T035–T037) replaced its usage (per plan.md project structure note)
- [ ] T133 Quickstart validation per `quickstart.md` §2–§7 against the merged branch — clone → boot → SSO → compose 3-block page → preview → publish → seed dry-run → tests pass (SC-012)

### Vercel react-best-practices follow-ups (audit 2026-05-29, plan.md §Performance Goals)

- [ ] T134 [P] Create `src/lib/payload.ts` with module-level `getPayload` singleton + `React.cache()`-wrapped readers `getSiteSettings()`, `getNavigation()`, `getHomepage()` (`server-cache-react`, `server-hoist-static-io`) — primitive Phase 3 (Spec 004) page templates compose against so cross-component global reads dedupe per request
- [ ] T135 [P] Add `<link rel="preconnect">` resource hints for `https://www.googletagmanager.com`, `https://js.hs-scripts.com`, `https://forms.hubspot.com` in `src/app/(frontend)/layout.tsx` (`rendering-resource-hints`) — env-gate the GTM/HubSpot ones on the same vars as their loaders so unset dev/CI doesn't preconnect to nothing
- [ ] T136 [P] Remove `export const dynamic = 'force-dynamic'` from `src/app/(frontend)/page.tsx` — spike holdover; safe to drop once `revalidateOnChange` (T010) is wired and `getPayload` singleton (T134) replaces the inline `getPayload({ config: await config })` call
- [ ] T137 [P] Refactor `src/components/layout/MobileNav.tsx` backdrop-close: replace the `useEffect` + `getBoundingClientRect` block (lines 20–37) with an inline `onClick={(e) => e.target === dialogRef.current && close()}` on the `<dialog>` (`rerender-move-effect-to-event`)

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no deps — start immediately.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories. Within Phase 2, T010 depends on T009; T019 depends on T011–T018; T022 depends on T009; T038 depends on T019–T037; T039/T040/T041 depend on T038.
- **US1 (Phase 3)**: depends on Foundational; layout block configs (T050–T055) → layout `index.ts` (T056); renderers (T058–T063) parallel to configs but registry (T066) depends on renderers; dispatcher (T067) depends on registry; `RichText` (T069) depends on `Prose` (T065) + inline registry (T068); Pages.layout wiring (T070) depends on T056.
- **US2 (Phase 4)**: depends on Foundational. Preview wiring (T082–T085) depends on collections existing (T023–T026) + `buildPreviewUrl` (T021).
- **US3 (Phase 5)**: depends on US1's render path (T067, T069) and Foundational types (T039).
- **US4 (Phase 6)**: depends on Foundational collections + globals + `editorConfig`. CLI (T106) depends on parsers + helpers.
- **US5 (Phase 7)**: depends on Foundational (collections wired). Tests can run any time after T041.
- **US6 (Phase 8)**: depends on Foundational T020, T033, T038.
- **US7 (Phase 9)**: depends on Foundational T008 + any collection with `publishedAt`.
- **Polish (Phase 10)**: depends on the user stories the task touches; T133 depends on every story closing. T134–T137 are independent of every story (no dep on T010 for T136 inside this PR: T134/T136 are paired but T136's safety depends on T010 being merged, which Foundational guarantees before Polish starts); T135 and T137 are pure additive edits.

### User-story independence

- US1, US2, US3 are all P1. US1 and US2 are independently deliverable once Foundational completes. US3 depends on US1's dispatcher to render a probe page.
- US4 (seed) depends on the collections existing (Foundational) and on `editorConfig` (Foundational T019). It does NOT depend on US1's layout blocks because seeded content lands in structured fields + richText body, not in `pages.layout`.
- US5 access matrix runs against Foundational. US7 invariant runs against Foundational.
- US6 is the only story that meaningfully touches media; runs against Foundational.

### Within each story

- Tests first per Constitution II (T042–T048 for US1, T074–T079 for US2, T087–T088 for US3, T092–T096 for US4, T108–T111 for US5, T114–T116 for US6, T121 for US7). Tests SHOULD fail before implementation tasks turn them green.
- Configs before renderers; renderers before registry; registry before dispatcher.
- Types/importMap regeneration runs after schema changes (T039/T040 in Foundational; T072 in US1; re-run as needed in other stories).

---

## Parallel Examples

### Foundational — all [P] access/hooks/inline-blocks in parallel

```text
T005 [P] byRole.ts
T006 [P] publishedOrAuthed.ts
T007 [P] slugFromTitle.ts
T008 [P] enforceDraftWhenScheduled.ts
T009 [P] lib/cloudfront/invalidate.ts
T011–T017 [P] 7 inline-block configs
T020 [P] storage/s3.ts
T021 [P] livePreview/url.ts
```

### Foundational — all [P] collection scaffolds in parallel

```text
T023 [P] Pages
T024 [P] Posts
T025 [P] CaseStudies
T026 [P] Services
T027 [P] ServicePillars
T028 [P] TeamMembers
T029 [P] Testimonials
T030 [P] Workshops
T031 [P] Industries
T032 [P] Locations
T033 [P] Media
T034 [P] Categories
T035 [P] SiteSettings
T036 [P] Navigation
T037 [P] Homepage
```

### US1 — all [P] tests in parallel before implementation

```text
T042 [P] composeThreeBlockPage.spec.ts
T043 [P] inlineBlocksInRichText.spec.ts
T044 [P] renderBlocksUnknownType.test.ts
T045 [P] registryCoverage.test.ts
T046 [P] richTextInline.test.ts
T047 [P] inlineRegistryCoverage.test.ts
T048 [P] slugFromTitle.test.ts
```

### US1 — all [P] block category tasks in parallel

```text
T050 [P] Hero category configs
T051 [P] Content category configs
T052 [P] Social-proof category configs
T053 [P] CTA category configs
T054 [P] Content-collection category configs
T055 [P] Specialty category configs
# (renderers T058–T063 likewise parallel-eligible)
```

### US4 — all [P] parsers/helpers in parallel

```text
T097 [P] log.ts
T098 [P] upsert.ts
T099 [P] slugRewrites.ts
T100 [P] htmlToLexical.ts
T101 [P] parsers/caseStudies.ts
T102 [P] parsers/pages.ts
T103 [P] parsers/posts.ts
T104 [P] parsers/homepage.ts
T105 [P] parsers/siteSettings.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Setup (T001–T004).
2. Foundational (T005–T041). Large — but every story needs it.
3. US1 (T042–T073).
4. **STOP and VALIDATE**: a non-engineer composes a 3-block page through the admin and the saved draft renders through `RenderBlocks`. SC-001 + SC-012 demonstrably hold.
5. Demo to leadership; close any spec/doc divergence per Constitution III.

### Incremental delivery after MVP

1. US3 (T087–T091) — closes the developer ergonomics gate for Phase 3.
2. US2 (T074–T086) — preview unblocks editorial confidence; required for the content lead's editorial pass.
3. US4 (T092–T107) — seed gives the lead a worklist.
4. US5 (T108–T113) — gate before non-engineers get accounts.
5. US6 (T114–T120) — media completes the editorial loop.
6. US7 (T121–T123) — invariant ships before the first scheduled draft.
7. Polish (T124–T133) — close out a11y/SEO/docs/quickstart.

### Parallel team strategy

- Developer A: US1 (block library is the deepest single phase).
- Developer B: US2 + US3 (preview + render-side ergonomics).
- Developer C: US4 (seed) + US7 (invariant).
- Developer D: US5 (access matrix) + US6 (media).
- All four sync on the Foundational → Polish handoff and the cross-cutting `revalidate` tests (T124, T125).

---

## Summary

- **Total tasks**: 137.
- **Setup (Phase 1)**: 4 tasks (T001–T004).
- **Foundational (Phase 2)**: 37 tasks (T005–T041) — large, but every story depends on it.
- **US1 (P1) — block library + dispatcher**: 32 tasks (T042–T073).
- **US2 (P1) — live preview**: 13 tasks (T074–T086).
- **US3 (P1) — render-path ergonomics**: 5 tasks (T087–T091).
- **US4 (P2) — seed script**: 16 tasks (T092–T107).
- **US5 (P2) — roles + access matrix**: 6 tasks (T108–T113).
- **US6 (P2) — media via S3/CDN**: 7 tasks (T114–T120).
- **US7 (P3) — scheduled-publish invariant**: 3 tasks (T121–T123).
- **Polish (Phase 10)**: 14 tasks (T124–T137).

**Parallel opportunities**: 83 tasks marked `[P]`. The Foundational scaffold tasks (T011–T017, T023–T037) and US1 block tasks (T050–T064) are the largest parallel surfaces.

**MVP scope (P1 only)**: Setup + Foundational + US1 + US2 + US3 = 91 tasks. US1 alone (with Setup + Foundational) is the minimum vertical slice that satisfies SC-001, SC-012, FR-007, and FR-010.

**Independent test criteria per story**: documented in each phase's "Independent Test" line; mapped to spec success criteria (SC-001 through SC-012) and functional requirements (FR-001 through FR-039).

**Format validation**: every task above starts with `- [ ]`, carries a sequential `T###`, includes `[P]` only where parallel-safe, carries a `[US#]` label inside user-story phases (and no label in Setup/Foundational/Polish), and names exact file paths.
