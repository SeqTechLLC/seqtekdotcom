---
description: 'Task list for spec 011 — Payload admin UX for content self-serve'
---

# Tasks: Payload admin UX for content self-serve

**Input**: Design documents from `specs/011-payload-admin-ux/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/admin-metadata.md](./contracts/admin-metadata.md), [quickstart.md](./quickstart.md)

**Tests**: Mandatory per constitution Principle II. **No carve-out is claimed.** The 2026-08-21 clarification demoted SC-001 and SC-003 from release gates to stated targets, so every acceptance criterion in this feature has an in-repo path and is CI-covered.

**Organization**: Grouped by user story. US1 and US2 are both P1 but fully independent — US1 is destructive and schema-bearing, US2 is config-only. **US1 is the MVP**: it is the trust foundation, and every other story is wasted effort while the admin still lies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US6, mapping to spec.md user stories

---

## Phase 1: Setup

**Purpose**: Establish the before-state that the non-regression gates compare against. T001 is time-ordered — once any config changes, the baseline is unrecoverable.

- [ ] T001 Capture the pre-change public-site baseline: run `npm run seed:showcase`, start a dev server on a free port, run `PLAYWRIGHT_BASE_URL=http://localhost:<port> npm run visual:capture`, then copy `tests/e2e/visual/screenshots/pages/` to a scratch path outside the repo. This is the FR-028 comparison set and MUST be taken before any task in Phase 2+.
- [ ] T002 [P] Extract the throwaway admin-session pattern into a reusable fixture at `tests/e2e/helpers/adminSession.ts`, wrapping `attachEditorSessionToContext` from `tests/sessions/editorSession.ts` with automatic fixture-user cleanup. Used by T038, T045, T052.
- [ ] T003 [P] Record the current local mirror inventory (row counts per legacy column from data-model.md §1.2) into `specs/011-payload-admin-ux/inventory-before.md` so T010's remediation has a reference point.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Two shared utilities that more than one story consumes.

**⚠️ CRITICAL**: T005 is consumed by both US1 (T008) and US4 (T044). Build it once.

- [ ] T004 [P] Create the shared block-category taxonomy at `src/payload/blocks/categories.ts`, exporting the six existing categories (`hero`, `content`, `social-proof`, `cta`, `content-collection`, `specialty`) and a `BlockCategory` type. Derive the values from the existing `category` field in `src/payload/seed/showcase/fixtures.ts` — do NOT invent a new taxonomy; it must stay aligned with `docs/BLOCK_LIBRARY.md` §5.1–§5.6.
- [ ] T005 Create a Payload-config field-tree flattener at `tests/int/helpers/flattenFields.ts` that walks collections, globals, and blocks and yields every leaf field as `{ path, field, entity }`, descending through `group`, `array`, `tabs`, `row`, and `blocks` field types. Consumed by T008 and T044.

**Checkpoint**: Shared utilities ready. US1 and US2 can proceed in parallel.

---

## Phase 3: User Story 1 — Every editable control affects the site (Priority: P1) 🎯 MVP

**Goal**: No field, global, or collection in the admin accepts input that never reaches the rendered site. Completes the ADR 0009 expand/contract.

**Independent Test**: The field-consumer registry test passes over the full config; every public route's metadata **and the homepage `Organization` JSON-LD** are byte-identical to the pre-change characterization; `visual:capture` shows zero differences.

**⚠️ This story is destructive.** T009/T010 gate T022, and T007 gates T016. Do not author a drop migration before the equivalence gate is green, and do not delete the globals before the JSON-LD golden test is green.

### Tests for User Story 1 (MANDATORY) ⚠️

> Write T006, T007 and T008 first and confirm they behave as expected before implementation.

- [ ] T006 [US1] Write a metadata characterization test at `tests/int/render/metadataOutput.int.spec.ts` asserting the full resolved `Metadata` object (title, description, openGraph.siteName, canonical) for a representative record from each of the **14** route files that call `buildMetadata`. **No such suite exists today** — this must be green BEFORE T013 and still green after. This is one of the two things standing between the `siteSettings` unwind and a silent regression; `visual:capture` will not catch it.
- [ ] T007 [P] [US1] Write `tests/int/render/organizationLd.int.spec.ts` — a golden-object assertion over `organizationLd()` from `src/lib/structured-data.ts` covering **all seven** values the CMS global currently feeds it: `companyName`, `tagline`, `email`, `phone`, the full `address` (street/city/state/zip → `PostalAddress`), and the three `socialLinks` (→ `sameAs`). **This is the highest-value gate in the feature.** The spec originally named only two consumers; the code has seven, and withdrawing the global without this test would silently strip the postal address, telephone, email and social profiles from the homepage schema (research R5). Must be green before T014 and still green after T016.
- [ ] T008 [P] [US1] Write `tests/int/fieldConsumerRegistry.int.spec.ts` per contract C5, using the T005 flattener: fail on any leaf field path absent from `CONSUMED_FIELDS`, and fail on any registry entry naming a path that no longer exists. Exempt Payload's auth and versioning field prefixes. Follow the shape of the existing `tests/int/render/registryCoverage.int.spec.ts`. Expect it to fail loudly on first run — that failure list is the T020 worklist.
- [ ] T009 [US1] Build the equivalence gate at `tools/legacy-equivalence/check.ts`. For every real record holding a non-null legacy prose column, re-run the matching composer from `src/payload/seed/compose/*ToLayout.ts` against its legacy fields and compare the result to the record's stored `layout`. Emit a per-record pass/fail report. **Note**: `tests/int/seed/composeFidelity.int.spec.ts` does NOT cover this — it exercises the composers against synthetic fixtures, not real records whose layouts may have been composed by an earlier composer version or hand-edited since.

### Implementation for User Story 1

- [ ] T010 [US1] Run `tools/legacy-equivalence/check.ts` against the local mirror and remediate every failure (re-run the composer for that record, or fix by hand) until the report is fully green. Record the outcome in `specs/011-payload-admin-ux/inventory-before.md`. **Blocks T022.**
- [ ] T011 [US1] Promote `expertise` in `src/collections/TeamMembers.ts` from `hidden: true, readOnly: true` to a visible, editable array field, labelled and described in terms of its search-result effect, positioned with the per-member SEO inputs. Remove it from the legacy-drop list. Rationale in research.md §R2 — it feeds `knowsAbout` in `src/lib/structured-data.ts:90`. **Must land before T022.**
- [ ] T012 [US1] Confirm all seven values in the data-model.md §1.5 consumer table exist verbatim on the hard-coded `siteSettings` constant at `src/lib/site-content.ts:141-152` (companyName, tagline, phone, email, address, socialLinks). They do as of 2026-08-21 — this task is the check, not an authoring step. If any drifted, reconcile before proceeding.
- [ ] T013 [US1] Remove the `siteSettings` fallback argument from `buildMetadata` in `src/lib/metadata.ts`, read `tagline` and `companyName` from the `site-content.ts` constant, and unwind the `getSiteSettings()` call from all 14 `generateMetadata` functions under `src/app/(frontend)/`. Re-run T006 — it must be unchanged.
- [ ] T014 [US1] Change `organizationLd` in `src/lib/structured-data.ts` to read the `site-content.ts` constant instead of taking a `SiteSetting` argument, and update its call site at `src/app/(frontend)/page.tsx:66`. Re-run T007 — all seven values must still emit identically.
- [ ] T015 [US1] Delete `getNavigation()` and its cache-tag wiring from `src/lib/payload.ts:183` (zero callers, verified in research R5), and delete `getSiteSettings()` now that T013 and T014 leave it callerless.
- [ ] T016 [US1] Delete `src/globals/Navigation.ts` and `src/globals/SiteSettings.ts` and remove them from `src/payload.config.ts`. **Delete, not `admin.hidden`** — FR-007 forbids hidden schema remnants, and the version history is a deliberate accepted loss because all seven read values now live in code (research R5, ADR 0010). **Requires T007 green.**
- [ ] T017 [US1] Remove the `layout` field and the `livePreview` config from `src/collections/Services.ts` and `src/collections/ServicePillars.ts`; remove their entries from `PREVIEW_COLLECTIONS` and `PUBLIC_PATH_BUILDERS` in `src/payload/livePreview/url.ts` (and the now-obsolete comment), and delete the skipped `tests/e2e/preview/servicesPreview.e2e.spec.ts`. Update `tests/int/preview/livePreviewUrl.int.spec.ts` for the narrowed collection set.
- [ ] T018 [US1] Delete the `hero` group field from `src/collections/Pages.ts` (verified empty across all 57 rows and unconsumed — research R1).
- [ ] T019 [US1] Delete every remaining `hidden: true, readOnly: true` legacy field from `src/collections/CaseStudies.ts`, `src/collections/Workshops.ts`, `src/collections/Services.ts`, `src/collections/TeamMembers.ts`, and `src/globals/Homepage.ts`, per data-model.md §1.2. **Do not touch** `teamMembers.expertise` (T011) or the block-owned `<table>_blocks_deliverables` / `<table>_blocks_faq` structures — only the bare legacy `deliverables` / `faq` array fields.
- [ ] T020 [US1] Create `src/payload/admin/consumedFields.ts` exporting `CONSUMED_FIELDS`, mapping every surviving leaf field path to a one-line claim of where its value surfaces. Work the T008 failure list to empty. Any path with no honest answer gets its field deleted instead of an entry.
- [ ] T021 [US1] Add a **pre-migration DB snapshot** step to the deploy sequence in `docs/INFRASTRUCTURE_RUNBOOK.md`, named explicitly rather than assumed. The separate staging account was retired 2026-08-14 and the two remaining lanes are two services in one stack in one account, both holding real content — there is no isolated environment to rehearse T022's drops in. The equivalence gate covers content correctness; the snapshot covers operator error.
- [ ] T022 [US1] Author the five migrations with `npm run payload migrate:create` per data-model.md §4, in order: `promote_team_member_expertise`, `drop_pages_hero`, `drop_legacy_body_columns`, `drop_services_layout`, `drop_chrome_globals` (the `navigation` and `site_settings` tables plus their versions counterparts). Local dev is push-managed — author only, never run `payload migrate` locally. **Requires T010 green, T011 landed, and T007 green for the last migration.**
- [ ] T023 [US1] Run `npm run generate:types` and commit the regenerated `src/payload-types.ts`. Fix any resulting type errors in render components that referenced dropped fields or the removed `SiteSetting` / `Navigation` types.
- [ ] T024 [US1] Retire the cutover step in `docs/INFRASTRUCTURE_RUNBOOK.md` that seeds the `siteSettings` NAP so `Organization` JSON-LD emits an address (added in PR #105). The values are code-owned after T014, so the step is not merely unnecessary but actively misleading (FR-005a).
- [ ] T025 [US1] Replay every `docs/content-drafts/*.json` file in the load order from `docs/content-drafts/README.md` with `--dry-run`, reconcile any file that sets a removed field, and **delete any `global-navigation*.json` / `global-site-settings*.json` request file outright** rather than editing it. Confirm zero unresolved references (FR-029). These files are gitignored and outside CI — this is a manual merge gate.

**Checkpoint**: Nothing in the admin accepts input that goes nowhere. Metadata, `Organization` JSON-LD, and public render are provably unchanged. This is a shippable increment on its own.

---

## Phase 4: User Story 2 — Pick the right block without guessing (Priority: P1)

**Goal**: The block picker presents 45 blocks in named categories, each with a distinct preview and a description that disambiguates it from its neighbours.

**Independent Test**: Open the picker in the admin and confirm grouped, visually distinct entries; the metadata completeness test passes.

**Note**: Config-only and non-destructive — can run fully in parallel with US1.

### Tests for User Story 2 (MANDATORY) ⚠️

- [ ] T026 [US2] Write `tests/int/adminMetadata.int.spec.ts` implementing contract C1 and C2: every layout block has `admin.group` (a valid `BlockCategory` from T004), a non-empty `admin.description`, `disableBlockName: true`, and an `admin.images.thumbnail` whose URL resolves to a file on disk; no two blocks share a thumbnail path; the committed preview set totals under the 400 KB budget; every inline block has an `admin.images.icon`. Model it on `tests/int/render/registryCoverage.int.spec.ts`.

### Implementation for User Story 2

- [ ] T027 [US2] Build `tools/block-thumbnails/index.ts`: read the desktop showcase captures from `tests/e2e/visual/screenshots/showcase/block-<blockType>-desktop.png`, resize to 480px wide, encode webp at q78 with `sharp`, write to `public/block-previews/<blockType>.webp`, and fail if the committed total exceeds the 400 KB budget. Measured basis: 7.8 KB mean per block, ~340 KB for all 45 (research R3). Print the list of blocks it skipped.
- [ ] T028 [US2] Run the pipeline (`npm run seed:showcase` → `npm run visual:capture` → `tools/block-thumbnails`) and commit the generated webp files under `public/block-previews/`. Add a `.gitattributes` entry if needed so they are treated as binary.
- [ ] T029 [US2] Hand-author SVG previews at `public/block-previews/<blockType>.svg` for the blocks that render empty in isolation: `hubspot-form`, `hubspot-meetings`, `embed`, `map`, `related-posts`, `post-list`. Schematic wireframes, not screenshots.
- [ ] T030 [P] [US2] Add `admin.group: 'hero'`, description, `disableBlockName`, and `admin.images.thumbnail` to the 4 hero blocks in `src/payload/blocks/layout/`: `Hero.ts`, `CaseStudyHero.ts`, `ServicePillarHero.ts`, `HomepageHero.ts`. Descriptions MUST state when to choose each over the other three — this is the motivating case for contract C1's disambiguation clause.
- [ ] T031 [P] [US2] Same treatment for the 9 `content` blocks in `src/payload/blocks/layout/`: `Content.ts`, `TwoColumn.ts`, `Image.ts`, `Gallery.ts`, `ProcessSteps.ts`, `Deliverables.ts`, `ComparisonTable.ts`, `Timeline.ts`, `FAQ.ts`.
- [ ] T032 [P] [US2] Same treatment for the 6 `social-proof` blocks in `src/payload/blocks/layout/`: `StatsBar.ts`, `MetricDisplay.ts`, `LogoBar.ts`, `TestimonialBlock.ts`, `FeaturedTestimonials.ts`, `ClientLogoGrid.ts`.
- [ ] T033 [P] [US2] Same treatment for the 3 `cta` blocks in `src/payload/blocks/layout/`: `CtaSection.ts`, `ContactCta.ts`, `NewsletterCta.ts`.
- [ ] T034 [P] [US2] Same treatment for the 10 `content-collection` blocks in `src/payload/blocks/layout/`: `FeaturedCaseStudy.ts`, `CaseStudyGrid.ts`, `ServicePillarCards.ts`, `ServiceCards.ts`, `TeamGrid.ts`, `PostList.ts`, `RelatedPosts.ts`, `WorkshopList.ts`, `IndustryGrid.ts`, `LocationsList.ts`.
- [ ] T035 [P] [US2] Same treatment for the 13 `specialty` blocks in `src/payload/blocks/layout/`: `Accordion.ts`, `Tabs.ts`, `BrandTeaser.ts`, `DownloadCard.ts`, `Embed.ts`, `VideoEmbed.ts`, `HubspotForm.ts`, `HubspotMeetings.ts`, `KeyTakeaways.ts`, `Map.ts`, `MissionVisionValues.ts`, `NavCards.ts`, `TechStack.ts`.
- [ ] T036 [US2] Add `admin.images.icon` (20×20) and descriptions to the 7 inline blocks in `src/payload/blocks/inline/`: `Callout.ts`, `Disclosure.ts`, `Figure.ts`, `ImageWithCaption.ts`, `InlineCta.ts`, `QuotePullquote.ts`, `TestimonialEmbed.ts`.
- [ ] T037 [US2] Run `npm run generate:importmap` and commit `src/app/(payload)/admin/importMap.js`. Required — a stale map shows as an editor that mounts blank or a `Cannot find module` in the admin console.
- [ ] T038 [US2] Write a Playwright admin spec at `tests/e2e/admin/blockPicker.e2e.spec.ts` using the T002 fixture: open the layout block picker on a Page create form, assert category headings render, and assert the four hero blocks are distinguishable by description text.

**Checkpoint**: The picker is usable. Screenshot it and look at it — do not claim this from a green test.

---

## Phase 5: User Story 3 — Lists answer "what's live?" and "which image is this?" (Priority: P2)

**Goal**: Publish state is a default column everywhere drafts exist; every image previews itself.

**Independent Test**: Load each list view and the media library and confirm both, including for records uploaded before this change.

### Tests for User Story 3 (MANDATORY) ⚠️

- [ ] T039 [P] [US3] Write `tests/int/adminThumbnail.int.spec.ts` per contract C6, over three fixtures: a record carrying the existing `mobile_webp` derivative (the state of all 78 current records), a record with no usable derivative at all, and a non-image record. Assert the resolution order and that the last two return `null` rather than a broken URL.
- [ ] T040 [P] [US3] Extend `tests/int/adminMetadata.int.spec.ts` with contract C3's clause: every collection with `versions.drafts === true` has `_status` as the first entry in `defaultColumns`.

### Implementation for User Story 3

- [ ] T041 [US3] In `src/collections/Media.ts`, set `adminThumbnail` to the **function form** returning the existing `mobile_webp` derivative, then `null`. **Do NOT add a new `imageSize`** — clarified 2026-08-21: measured on the real photo library the existing 640px derivative averages 53 KB against 16 KB for a dedicated 300px size, a 3.3× saving on an edge-cached internal screen that does not justify a ninth derivative on every upload plus a backfill (research R7). Do not use the string form either — Payload generates derivatives at upload only, so it would leave all 78 existing records exactly as broken as they are now.
- [ ] T042 [US3] Add `_status` as the first entry of `defaultColumns` in every collection with `versions.drafts: true` — all 10: `src/collections/Pages.ts`, `Posts.ts`, `CaseStudies.ts`, `Workshops.ts`, `TeamMembers.ts`, `Partners.ts`, `Services.ts`, `ServicePillars.ts`, `Industries.ts`, `Locations.ts`.
- [ ] T043 [US3] Verify in the running admin that thumbnails appear in the media list, in the upload field picker inside a block, and on collapsed rows of a media array (the Homepage client-logo grid is the test case). Capture screenshots and look at them. If array rows are still unidentifiable, add `admin.components.RowLabel` to the relevant array fields.

**Checkpoint**: Both daily lookup tasks work by sight.

---

## Phase 6: User Story 4 — Forms read like English, not like a schema (Priority: P2)

**Goal**: Labels are written, not generated; non-obvious fields explain themselves; variant-irrelevant fields hide.

**Independent Test**: The label/description test passes; selecting each variant of a multi-variant block hides the other variants' fields.

### Tests for User Story 4 (MANDATORY) ⚠️

- [ ] T044 [US4] Extend `tests/int/adminMetadata.int.spec.ts` with contract C4 clauses (1) and (2) using the T005 flattener: fail when a field's auto-generated label differs from a written label by more than case and spacing and no explicit `label` is declared; fail when a field on the non-obvious list lacks `admin.description`.
- [ ] T045 [US4] Write a Playwright admin spec at `tests/e2e/admin/variantFields.e2e.spec.ts` using the T002 fixture: for each multi-variant block, select each variant and assert fields belonging only to other variants are not rendered.

### Implementation for User Story 4

- [ ] T046 [US4] Extract the 10× repeated `seo` group into a `seoField()` factory at `src/payload/fields/seo.ts` with labels and help text authored once, and apply it across all 10 call sites. **Highest-risk task in this spec**: the generated column names MUST be byte-identical to the current inline definitions or this becomes a schema change. Produce an explicit before/after schema diff and attach it to the PR.
- [ ] T047 [US4] Extract the repeated CTA group shape into a `ctaField()` factory at `src/payload/fields/cta.ts` and apply it to the 11 surviving call sites (`cta` ×3, `primaryCta` ×5, `secondaryCta` ×4 — `ctaButton` leaves with Navigation in T016). Same schema-diff requirement as T046.
- [ ] T048 [US4] Add `label` overrides across the remaining camelCase field names in `src/collections/`, `src/globals/`, and `src/payload/blocks/` (49 total, minus those absorbed by T046/T047). Priority offenders by frequency: `url` ×20, `ogImage` ×10, `seo` ×10.
- [ ] T049 [US4] Add `admin.description` help text to block fields in `src/payload/blocks/` whose purpose or rendered effect is not self-evident. 220 block fields exist, 8 have help text — target the non-obvious subset, not all 212.
- [ ] T050 [US4] Audit the 37 layout blocks in `src/payload/blocks/layout/` not currently using `requiredWhen` from `src/payload/blocks/conditional.ts` and add `admin.condition` to every field that applies only to a subset of its block's variants. Many blocks have no variants and will be no-ops; the audit is per-block and must be recorded.
- [ ] T051 [US4] Create `src/payload/admin/BlockRowLabel.tsx`, a client component deriving a collapsed row's title from the block's content (headline, heading, or first text field), and wire it via `admin.components.Label` on the blocks where a content-derived title helps. Re-run `npm run generate:importmap`.

**Checkpoint**: A 10-block page reads as its own outline when collapsed.

---

## Phase 7: User Story 5 — Creating a page doesn't require developer knowledge (Priority: P3)

**Goal**: Title-only creation works, collisions fail legibly, and new pages open scaffolded.

**Independent Test**: Create a Page in the admin supplying only a title; it saves with a derived slug and a starting block structure. Create a second Page whose title derives the same slug; it is rejected with a message naming the first.

### Tests for User Story 5 (MANDATORY) ⚠️

- [ ] T052 [US5] Write a Playwright admin spec at `tests/e2e/admin/slugFromTitle.e2e.spec.ts` using the T002 fixture, covering all five rows of contract C7: title-only creation derives a slug; an explicitly entered slug is honoured unchanged; renaming a title does not rewrite an existing slug; an invalid slug shows a plain-language format error; **a title deriving an in-use slug is rejected with a message naming the conflicting record and offering an available alternative**.

### Implementation for User Story 5

- [ ] T053 [US5] Remove `required: true` from the `slug` field in every content collection (`src/collections/Pages.ts`, `Posts.ts`, `CaseStudies.ts`, `Workshops.ts`, `TeamMembers.ts`, `Partners.ts`, `Services.ts`, `ServicePillars.ts`, `Industries.ts`, `Locations.ts`, `Categories.ts`) and adjust `validateSlug` in `src/payload/hooks/slugFromTitle.ts` to return `true` for empty input while still rejecting malformed non-empty values. The generation hook already works server-side (verified in research R10) — `required` was the only thing blocking it from reaching the UI.
- [ ] T054 [US5] Add collision handling to `validateSlug` in `src/payload/hooks/slugFromTitle.ts` per FR-024a and contract C7: query the collection through `req` for a record already holding the slug (excluding the record being saved), and on conflict return a message naming that record's title and offering the next available alternative. **Auto-suffixing is prohibited** — this site's URL map is curated and backed by a 301 redirect table, so silently minting `/contact-2` produces a junk URL nobody chose. Keep the DB `unique` constraint as the backstop. The check lives in the field `validate`, not in the hook, so it fires identically for derived and hand-typed slugs.
- [ ] T055 [US5] Add a `pageSkeleton` default layout at `src/payload/seed/skeletons/page.ts` and wire it as the `defaultValue` of `Pages.layout`, mirroring the existing `caseStudySkeleton` pattern. Use placeholder prose that tells the editor what to replace.

**Checkpoint**: A new editor can start a page without asking what a slug is, and cannot silently collide with an existing URL.

---

## Phase 8: User Story 6 — The dashboard is organized by what things are for (Priority: P3)

**Goal**: Grouped, described entries on the admin home.

**Independent Test**: Load `/admin` and confirm named group headings and a one-line description on every entry.

### Tests for User Story 6 (MANDATORY) ⚠️

- [ ] T056 [US6] Extend `tests/int/adminMetadata.int.spec.ts` with the remaining contract C3 clauses: every collection and global has an `admin.group` from the allowed set (`Content`, `Reference data`, `Site`, `Admin`) and a non-empty `admin.description`.

### Implementation for User Story 6

- [ ] T057 [US6] Add `admin.group` and `admin.description` to all 14 collections and the one surviving global. Grouping: **Content** — Pages, Posts, Case Studies, Workshops, Team Members, Partners, Media; **Reference data** — Services, Service Pillars, Testimonials, Industries, Locations, Categories; **Site** — Homepage (the only global left after T016); **Admin** — Users. Descriptions written for an editor, not a developer.

**Checkpoint**: All six stories independently functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T058 [P] Write `docs/decisions/0010-site-chrome-code-owned.md` recording the 2026-08-21 decision to withdraw Navigation and Site Settings rather than wire them up: the unvalidated-nav-URL and redirect-map-coupling rationale, the **full seven-value consumer inventory** that made the withdrawal wider than first specced, the once-a-decade edit frequency, and the revisit condition.
- [ ] T059 [P] Write `docs/decisions/0011-committed-block-previews.md` recording the committed-raster tradeoff: the measured size basis (7.8 KB × 45 ≈ 340 KB against a 400 KB budget), why build-time generation was rejected (Playwright plus Postgres in the production image build, plus a silent-failure mode), why a separate asset bucket was rejected (previews become environment state, absent in local dev and CI), and the SVG fallback for blocks that photograph badly.
- [ ] T060 Reconcile the docs this feature changes, in-commit per constitution Principle III: `docs/BLOCK_LIBRARY.md` (categories are now load-bearing metadata, not prose organisation), `docs/PAYLOAD_DEVELOPMENT.md` (add the "adding a new block" contract paragraph from contracts/admin-metadata.md), `docs/ARCHITECTURE.md` §2 (globals withdrawn from the admin and dropped), `docs/LOCAL_DEVELOPMENT.md` (block-preview regeneration).
- [ ] T061 [P] Fix the dead cross-reference in `.specify/memory/constitution.md` § Additional Constraints: "Phase boundaries … see ROADMAP.md §4" no longer resolves, because the roadmap was restructured on 2026-08-21 into a prioritized P1–P4 punch list with no numbered sections. Repoint it. Required by Principle III, which this feature is otherwise being held to.
- [ ] T062 Move spec 011 from `docs/ROADMAP.md` (currently the first P1 item) to `docs/PROJECT_HISTORY.md` as a `P5-*` row — moved, not checkbox-flipped, per constitution Principle III. Resolve the ROADMAP "A-1 residual" item too if editor training follows immediately.
- [ ] T063 Update `CLAUDE.md`: the current-phase pointer, the site-chrome ownership decision, and the new block-authoring requirements (every new block needs a category, preview, and description or CI fails).
- [ ] T064 Re-run `visual:capture` against every public route at both viewports and compare against the T001 baseline. **Open the PNGs and look at them** — a green typecheck is not visual verification. Zero differences expected (FR-028).
- [ ] T065 Run the full local E2E suite before pushing. CI reseeds a fresh database, so content Pages that exist only in the local mirror 404 there; this feature removes fields and deletes globals, which is exactly the change class that has caused this before (PR #79).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 is strictly first — the baseline is unrecoverable once config changes.
- **Foundational (Phase 2)**: T005 blocks T008 (US1) and T044 (US4). T004 blocks all of US2's metadata tasks.
- **US1 (Phase 3)** and **US2 (Phase 4)**: both P1, fully independent. US1 is destructive and schema-bearing; US2 is config-only.
- **US3–US6 (Phases 5–8)**: independent of each other. US4's T046/T047 should land after US1's T016 so `ctaButton` is already gone.
- **Polish (Phase 9)**: T064/T065 depend on every desired story.

### Critical Path (US1 — the destructive chain)

```
T009 (equivalence gate) → T010 (run + remediate) ─┐
T011 (promote expertise) ─────────────────────────┤
T018, T019 (delete fields) ───────────────────────┼→ T022 (migrations) → T023 (types) → T025 (seed replay)
T007 (organizationLd golden) → T014 → T016 ───────┘
```

Two independent gates feed T022. **T006 must be green before T013 and green again after. T007 must be green before T014 and green again after T016** — until it is, the CMS global is still the source of the homepage's postal address.

### Within Each User Story

- Tests are written before implementation and expected to fail (T008's failure list literally becomes T020's worklist).
- Config changes before migrations; migrations before type regeneration; type regeneration before the seed replay.
- `generate:importmap` after any task adding a client component (T037, T051).

### Parallel Opportunities

- T002, T003 in parallel during Setup.
- **US1 and US2 in parallel** — different files, no shared state. This is the biggest win: one developer on the destructive chain, one on the block metadata sweep.
- T007, T008 in parallel — both are new test files with no shared fixture.
- T030–T035 in parallel — six category tasks, disjoint file sets, 45 blocks total.
- T039, T040 in parallel. T058, T059, T061 in parallel.

---

## Parallel Example: User Story 2 block metadata sweep

```bash
# After T004 (categories) and T028 (previews committed), launch all six together:
Task: "T030 hero category metadata — 4 blocks in src/payload/blocks/layout/"
Task: "T031 content category metadata — 9 blocks in src/payload/blocks/layout/"
Task: "T032 social-proof category metadata — 6 blocks in src/payload/blocks/layout/"
Task: "T033 cta category metadata — 3 blocks in src/payload/blocks/layout/"
Task: "T034 content-collection category metadata — 10 blocks in src/payload/blocks/layout/"
Task: "T035 specialty category metadata — 13 blocks in src/payload/blocks/layout/"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational
2. Phase 3 US1
3. **STOP and VALIDATE**: registry test green, metadata characterization unchanged, `organizationLd` golden test unchanged, `visual:capture` clean, content-drafts replay clean
4. Ship it. The admin no longer lies, which is the trust precondition for everything else.

### Incremental Delivery

1. Setup + Foundational → shared utilities ready
2. US1 → the admin stops lying → ship (MVP)
3. US2 → the picker becomes usable → ship
4. US3 + US4 → daily work becomes pleasant → ship
5. US5 + US6 → onboarding friction gone → ship
6. Polish → docs, ADRs, and the non-regression gates

### Two-Developer Split

Once Phase 2 lands, the natural cut is destructive vs. cosmetic:

- **Developer A**: US1 — the schema-bearing chain, migrations, metadata and JSON-LD refactor. Highest risk, needs the most care.
- **Developer B**: US2 → US4 → US6 — the config-only presentation sweep. Zero migration risk, highly parallelisable.
- Rejoin for Phase 9.

---

## Notes

- **T007 is the task that pays for this whole spec-kit pass.** The spec as first drafted named two Site Settings consumers; the code has seven. Without that test, T016 ships a homepage whose `Organization` schema silently loses its postal address, telephone, email and social profiles.
- The 45-block sweep is six tasks, not 45 — grouped by the category taxonomy that already exists in `src/payload/seed/showcase/fixtures.ts`.
- T046/T047 are labelled "presentation-only" but can silently become schema changes if the extracted factories generate different column names. They carry a mandatory schema diff for that reason.
- `tests/int/seed/composeFidelity.int.spec.ts` looks like it covers T009 and does not — it tests composers against synthetic fixtures, not real stored records.
- `docs/content-drafts/*.json` is gitignored and outside CI. T025 cannot be automated and is a human merge gate.
- Do not run `payload migrate` locally — local dev is push-managed (`docs/PAYLOAD_DEVELOPMENT.md`).
- SC-001 and SC-003 are targets, not gates (clarified 2026-08-21). No walkthrough session is scheduled here; the editor guide and training are out of scope and tracked separately.
- Commit after each task or logical group. Stop at any checkpoint to validate a story independently.
