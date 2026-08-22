---
description: 'Task list for spec 011 — Payload admin UX for content self-serve'
---

# Tasks: Payload admin UX for content self-serve

**Input**: Design documents from `specs/011-payload-admin-ux/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/admin-metadata.md](./contracts/admin-metadata.md), [quickstart.md](./quickstart.md)

**Tests**: Mandatory per constitution Principle II. One declared carve-out — SC-003 (block-pick accuracy) is verified as a recorded walkthrough (T060), with FR-013's metadata check (T023) as its CI-side proxy.

**Organization**: Grouped by user story. US1 and US2 are both P1 but fully independent — US1 is destructive and schema-bearing, US2 is config-only. **US1 is the MVP**: it is the trust foundation, and every other story is wasted effort while the admin still lies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US6, mapping to spec.md user stories

---

## Phase 1: Setup

**Purpose**: Establish the before-state that the non-regression gates compare against. T001 is time-ordered — once any config changes, the baseline is unrecoverable.

- [ ] T001 Capture the pre-change public-site baseline: run `npm run seed:showcase`, start a dev server on a free port, run `PLAYWRIGHT_BASE_URL=http://localhost:<port> npm run visual:capture`, then copy `tests/e2e/visual/screenshots/pages/` to a scratch path outside the repo. This is the FR-028 comparison set and MUST be taken before any task in Phase 2+.
- [ ] T002 [P] Extract the throwaway admin-session pattern into a reusable fixture at `tests/e2e/helpers/adminSession.ts`, wrapping `attachEditorSessionToContext` from `tests/sessions/editorSession.ts` with automatic fixture-user cleanup. Used by T035, T047, T048.
- [ ] T003 [P] Record the current local mirror inventory (row counts per legacy column from data-model.md §1.2) into `specs/011-payload-admin-ux/inventory-before.md` so T009's remediation has a reference point.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Two shared utilities that more than one story consumes.

**⚠️ CRITICAL**: T005 is consumed by both US1 (T007) and US4 (T040). Build it once.

- [ ] T004 [P] Create the shared block-category taxonomy at `src/payload/blocks/categories.ts`, exporting the six existing categories (`hero`, `content`, `social-proof`, `cta`, `content-collection`, `specialty`) and a `BlockCategory` type. Derive the values from the existing `category` field in `src/payload/seed/showcase/fixtures.ts` — do NOT invent a new taxonomy; it must stay aligned with `docs/BLOCK_LIBRARY.md` §5.1–§5.6.
- [ ] T005 Create a Payload-config field-tree flattener at `tests/int/helpers/flattenFields.ts` that walks collections, globals, and blocks and yields every leaf field as `{ path, field, entity }`, descending through `group`, `array`, `tabs`, `row`, and `blocks` field types. Consumed by T007 and T040.

**Checkpoint**: Shared utilities ready. US1 and US2 can proceed in parallel.

---

## Phase 3: User Story 1 — Every editable control affects the site (Priority: P1) 🎯 MVP

**Goal**: No field, global, or collection in the admin accepts input that never reaches the rendered site. Completes the ADR 0009 expand/contract.

**Independent Test**: The field-consumer registry test passes over the full config; every public route's metadata is byte-identical to the pre-change characterization; `visual:capture` shows zero differences.

**⚠️ This story is destructive.** T008/T009 gate T019. Do not author a drop migration before the equivalence gate is green.

### Tests for User Story 1 (MANDATORY) ⚠️

> Write T006 and T007 first and confirm they behave as expected before implementation.

- [ ] T006 [US1] Write a metadata characterization test at `tests/int/render/metadataOutput.int.spec.ts` asserting the full resolved `Metadata` object (title, description, openGraph.siteName, canonical) for a representative record from each of the 16 route files that call `buildMetadata`. **No such suite exists today** — this must be green BEFORE T011/T012 and still green after. This is the only thing standing between the `siteSettings` unwind and a silent metadata regression; `visual:capture` will not catch it.
- [ ] T007 [P] [US1] Write `tests/int/fieldConsumerRegistry.int.spec.ts` per contract C5, using the T005 flattener: fail on any leaf field path absent from `CONSUMED_FIELDS`, and fail on any registry entry naming a path that no longer exists. Exempt Payload's auth and versioning field prefixes. Follow the shape of the existing `tests/int/render/registryCoverage.int.spec.ts`. Expect it to fail loudly on first run — that failure list is the T018 worklist.
- [ ] T008 [US1] Build the equivalence gate at `tools/legacy-equivalence/check.ts`. For every real record holding a non-null legacy prose column, re-run the matching composer from `src/payload/seed/compose/*ToLayout.ts` against its legacy fields and compare the result to the record's stored `layout`. Emit a per-record pass/fail report. **Note**: `tests/int/seed/composeFidelity.int.spec.ts` does NOT cover this — it exercises the composers against synthetic fixtures, not real records whose layouts may have been composed by an earlier composer version or hand-edited since.

### Implementation for User Story 1

- [ ] T009 [US1] Run `tools/legacy-equivalence/check.ts` against the local mirror and remediate every failure (re-run the composer for that record, or fix by hand) until the report is fully green. Record the outcome in `specs/011-payload-admin-ux/inventory-before.md`. **Blocks T019.**
- [ ] T010 [US1] Promote `expertise` in `src/collections/TeamMembers.ts` from `hidden: true, readOnly: true` to a visible, editable array field, labelled and described in terms of its search-result effect, positioned with the per-member SEO inputs. Remove it from the legacy-drop list. Rationale in research.md §R2 — it feeds `knowsAbout` in `src/lib/structured-data.ts:90`. **Must land before T019.**
- [ ] T011 [US1] Move `tagline` and `companyName` reads out of the Payload global: confirm both values exist on the hard-coded `siteSettings` constant in `src/lib/site-content.ts` and update `src/lib/metadata.ts` to read them from there.
- [ ] T012 [US1] Remove the `siteSettings` fallback argument from `buildMetadata` in `src/lib/metadata.ts` and unwind the `getSiteSettings()` call from all 16 `generateMetadata` functions under `src/app/(frontend)/`. Re-run T006 — it must be unchanged.
- [ ] T013 [US1] Delete `getNavigation()` and its cache-tag wiring from `src/lib/payload.ts` (zero callers, verified in research R5), and delete `getSiteSettings()` if T012 leaves it callerless.
- [ ] T014 [P] [US1] Set `admin: { hidden: true }` on `src/globals/Navigation.ts` and `src/globals/SiteSettings.ts`. Do not remove them from `src/payload.config.ts` — hiding retains tables and 50 versions each and keeps ADR 0010's revisit path open.
- [ ] T015 [US1] Remove the `layout` field and the `livePreview` config from `src/collections/Services.ts`; remove the `services` entry from `PREVIEW_COLLECTIONS` and `PUBLIC_PATH_BUILDERS` in `src/payload/livePreview/url.ts` (and its now-obsolete comment), and delete the skipped `tests/e2e/preview/servicesPreview.e2e.spec.ts`. Update `tests/int/preview/livePreviewUrl.int.spec.ts` for the narrowed collection set.
- [ ] T016 [US1] Delete the `hero` group field from `src/collections/Pages.ts` (verified empty across all 57 rows and unconsumed — research R1).
- [ ] T017 [US1] Delete every remaining `hidden: true, readOnly: true` legacy field from `src/collections/CaseStudies.ts`, `src/collections/Workshops.ts`, `src/collections/Services.ts`, `src/collections/TeamMembers.ts`, and `src/globals/Homepage.ts`, per data-model.md §1.2. **Do not touch** `teamMembers.expertise` (T010) or the block-owned `<table>_blocks_deliverables` / `<table>_blocks_faq` structures — only the bare legacy `deliverables` / `faq` array fields.
- [ ] T018 [US1] Create `src/payload/admin/consumedFields.ts` exporting `CONSUMED_FIELDS`, mapping every surviving leaf field path to a one-line claim of where its value surfaces. Work the T007 failure list to empty. Any path with no honest answer gets its field deleted instead of an entry.
- [ ] T019 [US1] Author the four migrations with `npm run payload migrate:create` per data-model.md §4, in order: `promote_team_member_expertise`, `drop_pages_hero`, `drop_legacy_body_columns`, `drop_services_layout`. Local dev is push-managed — author only, never run `payload migrate` locally. **Requires T009 green and T010 landed.**
- [ ] T020 [US1] Run `npm run generate:types` and commit the regenerated `src/payload-types.ts`. Fix any resulting type errors in render components that referenced dropped fields.
- [ ] T021 [US1] Replay every `docs/content-drafts/*.json` file in the load order from `docs/content-drafts/README.md` with `--dry-run`, reconcile any file that sets a removed field, and confirm zero unresolved references (FR-029). These files are gitignored and outside CI — this is a manual merge gate.

**Checkpoint**: Nothing in the admin accepts input that goes nowhere. Metadata and public render are provably unchanged. This is a shippable increment on its own.

---

## Phase 4: User Story 2 — Pick the right block without guessing (Priority: P1)

**Goal**: The block picker presents 45 blocks in named categories, each with a distinct preview and a description that disambiguates it from its neighbours.

**Independent Test**: Open the picker in the admin and confirm grouped, visually distinct entries; the metadata completeness test passes.

**Note**: Config-only and non-destructive — can run fully in parallel with US1.

### Tests for User Story 2 (MANDATORY) ⚠️

- [ ] T022 [US2] Write `tests/int/adminMetadata.int.spec.ts` implementing contract C1 and C2: every layout block has `admin.group` (a valid `BlockCategory` from T004), a non-empty `admin.description`, `disableBlockName: true`, and an `admin.images.thumbnail` whose URL resolves to a file on disk; no two blocks share a thumbnail path; every inline block has an `admin.images.icon`. Model it on `tests/int/render/registryCoverage.int.spec.ts`.

### Implementation for User Story 2

- [ ] T023 [US2] Build `tools/block-thumbnails/index.ts`: read the desktop showcase captures from `tests/e2e/visual/screenshots/showcase/block-<blockType>-desktop.png`, crop to 3:2, resize to 480×320, encode webp with `sharp`, write to `public/admin/blocks/<blockType>.webp`, and fail if the committed total exceeds the 400 KB budget. Print the list of blocks it skipped.
- [ ] T024 [US2] Run the pipeline (`npm run seed:showcase` → `npm run visual:capture` → `tools/block-thumbnails`) and commit the generated webp files under `public/admin/blocks/`. Add a `.gitattributes` entry if needed so they are treated as binary.
- [ ] T025 [US2] Hand-author SVG previews at `public/admin/blocks/<blockType>.svg` for the blocks that render empty in isolation: `hubspot-form`, `hubspot-meetings`, `embed`, `map`, `related-posts`, `post-list`. Schematic wireframes, not screenshots.
- [ ] T026 [P] [US2] Add `admin.group: 'hero'`, description, `disableBlockName`, and `admin.images.thumbnail` to the 4 hero blocks in `src/payload/blocks/layout/`: `Hero.ts`, `CaseStudyHero.ts`, `ServicePillarHero.ts`, `HomepageHero.ts`. Descriptions MUST state when to choose each over the other three — this is the motivating case for contract C1's disambiguation clause.
- [ ] T027 [P] [US2] Same treatment for the 9 `content` blocks: `Content.ts`, `TwoColumn.ts`, `Image.ts`, `Gallery.ts`, `ProcessSteps.ts`, `Deliverables.ts`, `ComparisonTable.ts`, `Timeline.ts`, `FAQ.ts`.
- [ ] T028 [P] [US2] Same treatment for the 6 `social-proof` blocks: `StatsBar.ts`, `MetricDisplay.ts`, `LogoBar.ts`, `TestimonialBlock.ts`, `FeaturedTestimonials.ts`, `ClientLogoGrid.ts`.
- [ ] T029 [P] [US2] Same treatment for the 3 `cta` blocks: `CtaSection.ts`, `ContactCta.ts`, `NewsletterCta.ts`.
- [ ] T030 [P] [US2] Same treatment for the 10 `content-collection` blocks: `FeaturedCaseStudy.ts`, `CaseStudyGrid.ts`, `ServicePillarCards.ts`, `ServiceCards.ts`, `TeamGrid.ts`, `PostList.ts`, `RelatedPosts.ts`, `WorkshopList.ts`, `IndustryGrid.ts`, `LocationsList.ts`.
- [ ] T031 [P] [US2] Same treatment for the 13 `specialty` blocks: `Accordion.ts`, `Tabs.ts`, `BrandTeaser.ts`, `DownloadCard.ts`, `Embed.ts`, `VideoEmbed.ts`, `HubspotForm.ts`, `HubspotMeetings.ts`, `KeyTakeaways.ts`, `Map.ts`, `MissionVisionValues.ts`, `NavCards.ts`, `TechStack.ts`.
- [ ] T032 [US2] Add `admin.images.icon` (20×20) and descriptions to the 7 inline blocks in `src/payload/blocks/inline/`: `Callout.ts`, `Disclosure.ts`, `Figure.ts`, `ImageWithCaption.ts`, `InlineCta.ts`, `QuotePullquote.ts`, `TestimonialEmbed.ts`.
- [ ] T033 [US2] Run `npm run generate:importmap` and commit `src/app/(payload)/admin/importMap.js`. Required — a stale map shows as an editor that mounts blank or a `Cannot find module` in the admin console.
- [ ] T034 [US2] Write a Playwright admin spec at `tests/e2e/admin/blockPicker.e2e.spec.ts` using the T002 fixture: open the layout block picker on a Page create form, assert category headings render, and assert the four hero blocks are distinguishable by description text.

**Checkpoint**: The picker is usable. Screenshot it and look at it — do not claim this from a green test.

---

## Phase 5: User Story 3 — Lists answer "what's live?" and "which image is this?" (Priority: P2)

**Goal**: Publish state is a default column everywhere drafts exist; every image previews itself.

**Independent Test**: Load each list view and the media library and confirm both, including for records uploaded before this change.

### Tests for User Story 3 (MANDATORY) ⚠️

- [ ] T035 [P] [US3] Write `tests/int/adminThumbnail.int.spec.ts` per contract C6, over three fixtures: a record carrying the new `thumbnail` derivative, a record carrying only the legacy `mobile_webp` derivative (the state of all 78 existing records), and a non-image record. Assert the resolution order and that non-images return `null` rather than a broken URL.
- [ ] T036 [P] [US3] Extend `tests/int/adminMetadata.int.spec.ts` with contract C3's clause: every collection with `versions.drafts === true` and not `admin.hidden` has `_status` as the first entry in `defaultColumns`.

### Implementation for User Story 3

- [ ] T037 [US3] In `src/collections/Media.ts`, add a `thumbnail` image size (400×300, `fit: 'cover'`, webp) to `imageSizes` and set `adminThumbnail` to the **function form** preferring `thumbnail`, falling back to `mobile_webp`, then `null`. Do NOT use the string form — Payload generates derivatives at upload only, so a string `adminThumbnail: 'thumbnail'` would leave all 78 existing records exactly as broken as they are now (research R7).
- [ ] T038 [US3] Add `_status` as the first entry of `defaultColumns` in every collection with `versions.drafts: true` — all 10: `src/collections/Pages.ts`, `Posts.ts`, `CaseStudies.ts`, `Workshops.ts`, `TeamMembers.ts`, `Partners.ts`, `Services.ts`, `ServicePillars.ts`, `Industries.ts`, `Locations.ts`. The last four are regrouped as reference data in T052 but are not hidden, so FR-014 and contract C3 still cover them.
- [ ] T039 [US3] Verify in the running admin that thumbnails appear in the media list, in the upload field picker inside a block, and on collapsed rows of a media array (the Homepage client-logo grid is the test case). Capture screenshots. If array rows are still unidentifiable, add `admin.components.RowLabel` to the relevant array fields.

**Checkpoint**: Both daily lookup tasks work by sight.

---

## Phase 6: User Story 4 — Forms read like English, not like a schema (Priority: P2)

**Goal**: Labels are written, not generated; non-obvious fields explain themselves; variant-irrelevant fields hide.

**Independent Test**: The label/description test passes; selecting each variant of a multi-variant block hides the other variants' fields.

### Tests for User Story 4 (MANDATORY) ⚠️

- [ ] T040 [US4] Extend `tests/int/adminMetadata.int.spec.ts` with contract C4 clauses (1) and (2) using the T005 flattener: fail when a field's auto-generated label differs from a written label by more than case and spacing and no explicit `label` is declared; fail when a field on the non-obvious list lacks `admin.description`.
- [ ] T041 [US4] Write a Playwright admin spec at `tests/e2e/admin/variantFields.e2e.spec.ts` using the T002 fixture: for each multi-variant block, select each variant and assert fields belonging only to other variants are not rendered.

### Implementation for User Story 4

- [ ] T042 [US4] Extract the 10× repeated `seo` group into a `seoField()` factory at `src/payload/fields/seo.ts` with labels and help text authored once, and apply it across all 10 call sites. **Highest-risk task in this spec**: the generated column names MUST be byte-identical to the current inline definitions or this becomes a schema change. Produce an explicit before/after schema diff and attach it to the PR.
- [ ] T043 [US4] Extract the repeated CTA group shape into a `ctaField()` factory at `src/payload/fields/cta.ts` and apply it to the 11 surviving call sites (`cta` ×3, `primaryCta` ×5, `secondaryCta` ×4 — `ctaButton` leaves with Navigation in T014). Same schema-diff requirement as T042.
- [ ] T044 [US4] Add `label` overrides across the remaining camelCase field names in `src/collections/`, `src/globals/`, and `src/payload/blocks/` (49 total, minus those absorbed by T042/T043). Priority offenders by frequency: `url` ×20, `ogImage` ×10, `seo` ×10.
- [ ] T045 [US4] Add `admin.description` help text to block fields whose purpose or rendered effect is not self-evident. 220 block fields exist, 8 have help text — target the non-obvious subset, not all 212.
- [ ] T046 [US4] Audit the 37 layout blocks not currently using `requiredWhen` from `src/payload/blocks/conditional.ts` and add `admin.condition` to every field that applies only to a subset of its block's variants. Many blocks have no variants and will be no-ops; the audit is per-block and must be recorded.
- [ ] T047 [US4] Create `src/payload/admin/BlockRowLabel.tsx`, a client component deriving a collapsed row's title from the block's content (headline, heading, or first text field), and wire it via `admin.components.Label` on the blocks where a content-derived title helps. Re-run `npm run generate:importmap`.

**Checkpoint**: A 10-block page reads as its own outline when collapsed.

---

## Phase 7: User Story 5 — Creating a page doesn't require developer knowledge (Priority: P3)

**Goal**: Title-only creation works; new pages open scaffolded.

**Independent Test**: Create a Page in the admin supplying only a title; it saves with a derived slug and a starting block structure.

### Tests for User Story 5 (MANDATORY) ⚠️

- [ ] T048 [US5] Write a Playwright admin spec at `tests/e2e/admin/slugFromTitle.e2e.spec.ts` using the T002 fixture: create a Page with only a title and assert it saves with the derived slug; assert an explicitly entered slug is honoured; assert renaming the title does not rewrite an existing slug; assert an invalid slug shows a plain-language error.

### Implementation for User Story 5

- [ ] T049 [US5] Remove `required: true` from the `slug` field in every content collection (`Pages.ts`, `Posts.ts`, `CaseStudies.ts`, `Workshops.ts`, `TeamMembers.ts`, `Partners.ts`, `Services.ts`, `ServicePillars.ts`, `Industries.ts`, `Locations.ts`, `Categories.ts`) and adjust `validateSlug` in `src/payload/hooks/slugFromTitle.ts` to return `true` for empty input while still rejecting malformed non-empty values. The generation hook already works server-side (verified in research R10) — `required` was the only thing blocking it from reaching the UI.
- [ ] T050 [US5] Add a `pageSkeleton` default layout at `src/payload/seed/skeletons/page.ts` and wire it as the `defaultValue` of `Pages.layout`, mirroring the existing `caseStudySkeleton` pattern. Use placeholder prose that tells the editor what to replace.

**Checkpoint**: A new editor can start a page without asking what a slug is.

---

## Phase 8: User Story 6 — The dashboard is organized by what things are for (Priority: P3)

**Goal**: Grouped, described entries on the admin home.

**Independent Test**: Load `/admin` and confirm named group headings and a one-line description on every entry.

### Tests for User Story 6 (MANDATORY) ⚠️

- [ ] T051 [US6] Extend `tests/int/adminMetadata.int.spec.ts` with the remaining contract C3 clauses: every collection and global has an `admin.group` from the allowed set (`Content`, `Reference data`, `Site`, `Admin`) and a non-empty `admin.description`; entries marked `admin.hidden` are exempt.

### Implementation for User Story 6

- [ ] T052 [US6] Add `admin.group` and `admin.description` to all 14 collections and the surviving global. Grouping: **Content** — Pages, Posts, Case Studies, Workshops, Team Members, Partners, Media; **Reference data** — Services, Service Pillars, Testimonials, Industries, Locations, Categories; **Site** — Homepage; **Admin** — Users. Descriptions written for an editor, not a developer.

**Checkpoint**: All six stories independently functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T053 [P] Write `docs/decisions/0010-site-chrome-code-owned.md` recording the 2026-08-21 decision to withdraw Navigation and Site Settings rather than wire them up: the unvalidated-nav-URL and redirect-map-coupling rationale, the once-a-decade edit frequency, and the revisit condition.
- [ ] T054 [P] Write `docs/decisions/0011-derived-block-previews.md` recording the committed-raster tradeoff, the 400 KB budget, the SVG fallback for blocks that photograph badly, and why build-time generation was rejected (no showcase fixtures in staging/prod).
- [ ] T055 Reconcile the docs this feature changes, in-commit per constitution Principle III: `docs/BLOCK_LIBRARY.md` (categories are now load-bearing metadata, not prose organisation), `docs/PAYLOAD_DEVELOPMENT.md` (add the "adding a new block" contract paragraph from contracts/admin-metadata.md), `docs/ARCHITECTURE.md` §2 (globals withdrawn from the admin), `docs/LOCAL_DEVELOPMENT.md` (thumbnail regeneration).
- [ ] T056 Move the shipped items from `docs/ROADMAP.md` to `docs/PROJECT_HISTORY.md` — moved, not checkbox-flipped, per constitution Principle III.
- [ ] T057 Update `CLAUDE.md`: current phase, the site-chrome ownership decision, and the new block-authoring requirements.
- [ ] T058 Re-run `visual:capture` against every public route at both viewports and compare against the T001 baseline. **Open the PNGs and look at them** — a green typecheck is not visual verification. Zero differences expected (FR-028).
- [ ] T059 Run the full local E2E suite before pushing. CI reseeds a fresh database, so content Pages that exist only in the local mirror 404 there; this feature removes fields and hides globals, which is exactly the change class that has caused this before (PR #79).
- [ ] T060 **Verification deliverable (constitution II carve-out)**: sit with the marketing lead, hand them a written brief, and watch them build and publish the page unaided. Record time-to-publish against SC-001 (under 20 minutes) and block-pick accuracy against SC-003 (9 of 10, under 30s each). Where they stall is the real result — write it up in `specs/011-payload-admin-ux/walkthrough-findings.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 is strictly first — the baseline is unrecoverable once config changes.
- **Foundational (Phase 2)**: T005 blocks T007 (US1) and T040 (US4). T004 blocks all of US2's metadata tasks.
- **US1 (Phase 3)** and **US2 (Phase 4)**: both P1, fully independent. US1 is destructive and schema-bearing; US2 is config-only.
- **US3–US6 (Phases 5–8)**: independent of each other. US4's T042/T043 should land after US1's T014 so `ctaButton` is already gone.
- **Polish (Phase 9)**: T058/T059 depend on every desired story. T060 depends on the whole feature being deployed somewhere the marketing lead can reach.

### Critical Path (US1 — the destructive chain)

```
T008 (equivalence gate) → T009 (run + remediate) ─┐
T010 (promote expertise) ─────────────────────────┼→ T019 (migrations) → T020 (types) → T021 (seed replay)
T016, T017 (delete fields) ───────────────────────┘
```

T006 must be green before T011/T012 and green again after. T009 and T010 both gate T019; neither is optional.

### Within Each User Story

- Tests are written before implementation and expected to fail (T007's failure list literally becomes T018's worklist).
- Config changes before migrations; migrations before type regeneration; type regeneration before the seed replay.
- `generate:importmap` after any task adding a client component (T033, T047).

### Parallel Opportunities

- T002, T003 in parallel during Setup.
- **US1 and US2 in parallel** — different files, no shared state. This is the biggest win: one developer on the destructive chain, one on the block metadata sweep.
- T026–T031 in parallel — six category tasks, disjoint file sets, 45 blocks total.
- T035, T036 in parallel. T053, T054 in parallel.

---

## Parallel Example: User Story 2 block metadata sweep

```bash
# After T004 (categories) and T024 (thumbnails committed), launch all six together:
Task: "T026 hero category metadata — 4 blocks in src/payload/blocks/layout/"
Task: "T027 content category metadata — 9 blocks in src/payload/blocks/layout/"
Task: "T028 social-proof category metadata — 6 blocks in src/payload/blocks/layout/"
Task: "T029 cta category metadata — 3 blocks in src/payload/blocks/layout/"
Task: "T030 content-collection category metadata — 10 blocks in src/payload/blocks/layout/"
Task: "T031 specialty category metadata — 13 blocks in src/payload/blocks/layout/"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational
2. Phase 3 US1
3. **STOP and VALIDATE**: registry test green, metadata characterization unchanged, `visual:capture` clean, content-drafts replay clean
4. Ship it. The admin no longer lies, which is the trust precondition for everything else.

### Incremental Delivery

1. Setup + Foundational → shared utilities ready
2. US1 → the admin stops lying → ship (MVP)
3. US2 → the picker becomes usable → ship
4. US3 + US4 → daily work becomes pleasant → ship
5. US5 + US6 → onboarding friction gone → ship
6. Polish + T060 walkthrough → the actual answer to "can she self-serve?"

### Two-Developer Split

Once Phase 2 lands, the natural cut is destructive vs. cosmetic:

- **Developer A**: US1 — the schema-bearing chain, migrations, metadata refactor. Highest risk, needs the most care.
- **Developer B**: US2 → US4 → US6 — the config-only presentation sweep. Zero migration risk, highly parallelisable.
- Rejoin for Phase 9.

---

## Notes

- The 45-block sweep is six tasks, not 45 — grouped by the category taxonomy that already exists in `src/payload/seed/showcase/fixtures.ts`.
- T042/T043 are labelled "presentation-only" but can silently become schema changes if the extracted factories generate different column names. They carry a mandatory schema diff for that reason.
- `tests/int/seed/composeFidelity.int.spec.ts` looks like it covers T008 and does not — it tests composers against synthetic fixtures, not real stored records.
- `docs/content-drafts/*.json` is gitignored and outside CI. T021 cannot be automated and is a human merge gate.
- Do not run `payload migrate` locally — local dev is push-managed (`docs/PAYLOAD_DEVELOPMENT.md`).
- Commit after each task or logical group. Stop at any checkpoint to validate a story independently.
