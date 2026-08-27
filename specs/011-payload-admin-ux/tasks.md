---
description: 'Task list for spec 011 — Payload admin UX for content self-serve'
---

# Tasks: Payload admin UX for content self-serve

**Input**: Design documents from `specs/011-payload-admin-ux/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/admin-metadata.md](./contracts/admin-metadata.md), [quickstart.md](./quickstart.md)

**Tests**: Mandatory per constitution Principle II. **No carve-out is claimed.** The 2026-08-21 clarification demoted SC-001 and SC-003 from release gates to stated targets, so every acceptance criterion in this feature has an in-repo path and is CI-covered.

**Organization**: Grouped by user story. US1 and US2 are both P1 but fully independent — US1 is destructive and schema-bearing, US2 is config-only. **US1 is the MVP**: it is the trust foundation, and every other story is wasted effort while the admin still lies.

## Retracted after review (PR #107)

Task text below is left as written for the audit trail. These items were
**undone** during review; treat this block as authoritative over the task lines.

| Retracted                                                                                                                                              | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T005, T008, T020 — the field-consumer registry (`consumedFields.ts`, `fieldConsumerRegistry.int.spec.ts`, `helpers/flattenFields.ts`)                  | It mapped 131 fields to prose and asserted the prose was non-empty — it verified that a human typed a sentence, not that it was true. **FR-008 is now marked NOT MET** rather than satisfied by ceremony. The one real output is preserved as ROADMAP **INERT-1**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| T009, T010 — the equivalence gate (`tools/legacy-equivalence/`)                                                                                        | Structurally dead: it reads legacy fields through `payload.find()`, which returns config-shaped documents, and the same commit that ships the gate removes those fields from the config. It could never find anything on any lane. Worse, running it against a remote lane would have **pushed the local schema** there (`payload.config.ts` enables Drizzle push whenever `NODE_ENV !== 'production'`). Replaced by a pre-merge RDS snapshot — `INFRASTRUCTURE_RUNBOOK.md` §2.9.                                                                                                                                                                                                                                                                                                                                                          |
| T022 — "the five migrations"                                                                                                                           | `migrate:create` generates from the whole schema diff in one pass. Two shipped: `20260824_201317_spec011_drop_inert_fields` and `20260824_214311_spec011_drop_stats_bar_source`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| T010a — the services-layout export                                                                                                                     | Kept, but `migrateFromAudit` and its parsers were deleted wholesale: the audit seeder was a one-shot Wix migration superseded by `docs/content-drafts`, and its case-study and homepage steps had both gone silently inert.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| C1/C2's `admin.description` clause, and FR-011 as written (T026, T030–T036)                                                                            | **Unimplementable, not merely unwise.** `payload@3.85`'s `Block` type declares `admin` as exactly `{ components, custom, disableBlockName, group, images, jsx }` — a description is a type error. `@payloadcms/ui`'s `BlockSelector` renders a card as a group heading, a thumbnail and `labels.singular`, and searches `labels.singular` alone; the Lexical menu renders an icon and a label. Upstream `docs/fields/blocks.mdx` lists the same six options. So a description would be prose no editor could read — the C5 failure mode again. **Replaced by**: no label may duplicate or be a substring of another label in the same picker. That is what forced `Hero (standard page)`, `Embed (iframe)` and `Testimonial (single)`. Recorded in ADR 0011 and contract C1's amendment; FR-011 is marked NOT MET as written in `spec.md`. |
| Spec 010 T014, T023, T033, T042, T052, T067, T071 — the per-type composers (`src/payload/seed/compose/*ToLayout.ts`) and the `convert-to-blocks` skill | Deleted in PR #107 review round 3. The composers were retained after T019a purely as the `convert-to-blocks` skill's reference mapping, and that skill exists to convert a page _from_ a non-block shape into blocks. Every routed body is now `layout` blocks (plus the blog Post's richText by design), so there is no source shape left to convert from: both sides of the pair were dead. `tests/int/skills/convertToBlocks.int.spec.ts` went with them. The mapping is in git history if it is ever needed again.                                                                                                                                                                                                                                                                                                                     |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US6, mapping to spec.md user stories

---

## Phase 1: Setup

**Purpose**: Establish the before-state that the non-regression gates compare against. T001 is time-ordered — once any config changes, the baseline is unrecoverable.

- [x] T001 Capture the pre-change public-site baseline: run `npm run seed:showcase`, start a dev server on a free port, run `PLAYWRIGHT_BASE_URL=http://localhost:<port> npm run visual:capture`, then copy `tests/e2e/visual/screenshots/pages/` to a scratch path outside the repo. This is the FR-028 comparison set and MUST be taken before any task in Phase 2+.
- [x] T002 [P] Extract the throwaway admin-session pattern into a reusable fixture at `tests/e2e/helpers/adminSession.ts`, wrapping `attachEditorSessionToContext` from `tests/sessions/editorSession.ts` with automatic fixture-user cleanup. Used by T038, T045, T052.
- [x] T003 [P] Record the current local mirror inventory (row counts per legacy column from data-model.md §1.2) into `specs/011-payload-admin-ux/inventory-before.md` so T010's remediation has a reference point.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Two shared utilities that more than one story consumes.

**⚠️ CRITICAL**: T005 is consumed by both US1 (T008) and US4 (T044). Build it once.

- [x] T004 [P] Create the shared block-category taxonomy at `src/payload/blocks/categories.ts`, exporting the six existing categories (`hero`, `content`, `social-proof`, `cta`, `content-collection`, `specialty`) and a `BlockCategory` type. Derive the values from the existing `category` field in `src/payload/seed/showcase/fixtures.ts` — do NOT invent a new taxonomy; it must stay aligned with `docs/BLOCK_LIBRARY.md` §5.1–§5.6.
- [x] T005 Create a Payload-config field-tree flattener at `tests/int/helpers/flattenFields.ts` that walks collections, globals, and blocks and yields every leaf field as `{ path, field, entity }`, descending through `group`, `array`, `tabs`, `row`, and `blocks` field types. Consumed by T008 and T044.

**Checkpoint**: Shared utilities ready. US1 and US2 can proceed in parallel.

---

## Phase 3: User Story 1 — Every editable control affects the site (Priority: P1) 🎯 MVP

**Goal**: No field, global, or collection in the admin accepts input that never reaches the rendered site. Completes the ADR 0009 expand/contract.

**Independent Test**: The field-consumer registry test passes over the full config; every public route's metadata **and the homepage `Organization` JSON-LD** are byte-identical to the pre-change characterization; `visual:capture` shows zero differences.

**⚠️ This story is destructive.** T009/T010 gate T022, and T007 gates T016. Do not author a drop migration before the equivalence gate is green, and do not delete the globals before the JSON-LD golden test is green.

### Tests for User Story 1 (MANDATORY) ⚠️

> Write T006, T007 and T008 first and confirm they behave as expected before implementation.

- [x] T006 [US1] Write a metadata characterization test at `tests/int/render/metadataOutput.int.spec.ts` asserting the full resolved `Metadata` object (title, description, openGraph.siteName, canonical) for a representative record from each of the **14** route files that call `buildMetadata`. **No such suite exists today** — this must be green BEFORE T013 and still green after. This is one of the two things standing between the `siteSettings` unwind and a silent regression; `visual:capture` will not catch it.
- [x] T007 [P] [US1] Write `tests/int/render/organizationLd.int.spec.ts` — a golden-object assertion over `organizationLd()` from `src/lib/structured-data.ts` covering **all seven** values the CMS global currently feeds it: `companyName`, `tagline`, `email`, `phone`, the full `address` (street/city/state/zip → `PostalAddress`), and the three `socialLinks` (→ `sameAs`). **This is the highest-value gate in the feature.** The spec originally named only two consumers; the code has seven, and withdrawing the global without this test would silently strip the postal address, telephone, email and social profiles from the homepage schema (research R5). Must be green before T014 and still green after T016.
- [x] T008 [P] [US1] Write `tests/int/fieldConsumerRegistry.int.spec.ts` per contract C5, using the T005 flattener: fail on any leaf field path absent from `CONSUMED_FIELDS`, and fail on any registry entry naming a path that no longer exists. Exempt Payload's auth and versioning field prefixes. Follow the shape of the existing `tests/int/render/registryCoverage.int.spec.ts`. Expect it to fail loudly on first run — that failure list is the T020 worklist.
- [x] T009 [US1] Build the equivalence gate at `tools/legacy-equivalence/check.ts`. For every real record holding a non-null legacy prose column, re-run the matching composer from `src/payload/seed/compose/*ToLayout.ts` against its legacy fields and compare the result to the record's stored `layout`. Emit a per-record pass/fail report. **Note**: `tests/int/seed/composeFidelity.int.spec.ts` does NOT cover this — it exercises the composers against synthetic fixtures, not real records whose layouts may have been composed by an earlier composer version or hand-edited since.

### Implementation for User Story 1

- [x] T010 [US1] Run `tools/legacy-equivalence/check.ts` against the local mirror and remediate every failure (re-run the composer for that record, or fix by hand) until the report is fully green. Record the outcome in `specs/011-payload-admin-ux/inventory-before.md`. **Blocks T022.**
- [x] T011 [US1] Promote `expertise` in `src/collections/TeamMembers.ts` from `hidden: true, readOnly: true` to a visible, editable array field, labelled and described in terms of its search-result effect, positioned with the per-member SEO inputs. Remove it from the legacy-drop list. Rationale in research.md §R2 — it feeds `knowsAbout` in `src/lib/structured-data.ts:90`. **Must land before T022.**
- [x] T012 [US1] Confirm all seven values in the data-model.md §1.5 consumer table exist verbatim on the hard-coded `siteSettings` constant at `src/lib/site-content.ts:141-152` (companyName, tagline, phone, email, address, socialLinks). They do as of 2026-08-21 — this task is the check, not an authoring step. If any drifted, reconcile before proceeding.
- [x] T013 [US1] Remove the `siteSettings` fallback argument from `buildMetadata` in `src/lib/metadata.ts`, read `tagline` and `companyName` from the `site-content.ts` constant, and unwind the `getSiteSettings()` call from all 14 `generateMetadata` functions under `src/app/(frontend)/`. Re-run T006 — it must be unchanged.
- [x] T014 [US1] Change `organizationLd` in `src/lib/structured-data.ts` to read the `site-content.ts` constant instead of taking a `SiteSetting` argument, and update its call site at `src/app/(frontend)/page.tsx:66`. Re-run T007 — all seven values must still emit identically.
- [x] T015 [US1] Delete `getNavigation()` and its cache-tag wiring from `src/lib/payload.ts:183` (zero callers, verified in research R5), and delete `getSiteSettings()` now that T013 and T014 leave it callerless.
- [x] T016 [US1] Delete `src/globals/Navigation.ts` and `src/globals/SiteSettings.ts` and remove them from `src/payload.config.ts`. **Delete, not `admin.hidden`** — FR-007 forbids hidden schema remnants, and the version history is a deliberate accepted loss because all seven read values now live in code (research R5, ADR 0010). **Requires T007 green.**
- [x] T017 [US1] Remove the `layout` field and the `livePreview` config from `src/collections/Services.ts` and `src/collections/ServicePillars.ts`; remove their entries from `PREVIEW_COLLECTIONS` and `PUBLIC_PATH_BUILDERS` in `src/payload/livePreview/url.ts` (and the now-obsolete comment), and delete the skipped `tests/e2e/preview/servicesPreview.e2e.spec.ts`. Update `tests/int/preview/livePreviewUrl.int.spec.ts` for the narrowed collection set.
- [x] T018 [US1] Delete the `hero` group field from `src/collections/Pages.ts` (verified empty across all 57 rows and unconsumed — research R1).
- [x] T019 [US1] Delete every remaining `hidden: true, readOnly: true` legacy field from `src/collections/CaseStudies.ts`, `src/collections/Workshops.ts`, `src/collections/Services.ts`, `src/collections/TeamMembers.ts`, and `src/globals/Homepage.ts`, per data-model.md §1.2. **Do not touch** `teamMembers.expertise` (T011) or the block-owned `<table>_blocks_deliverables` / `<table>_blocks_faq` structures — only the bare legacy `deliverables` / `faq` array fields.
- [x] T020 [US1] Create `src/payload/admin/consumedFields.ts` exporting `CONSUMED_FIELDS`, mapping every surviving leaf field path to a one-line claim of where its value surfaces. Work the T008 failure list to empty. Any path with no honest answer gets its field deleted instead of an entry.
- [x] T021 [US1] Add a **pre-migration DB snapshot** step to the deploy sequence in `docs/INFRASTRUCTURE_RUNBOOK.md`, named explicitly rather than assumed. The separate staging account was retired 2026-08-14 and the two remaining lanes are two services in one stack in one account, both holding real content — there is no isolated environment to rehearse T022's drops in. The equivalence gate covers content correctness; the snapshot covers operator error.
- [x] T022 [US1] Author the five migrations with `npm run payload migrate:create` per data-model.md §4, in order: `promote_team_member_expertise`, `drop_pages_hero`, `drop_legacy_body_columns`, `drop_services_layout`, `drop_chrome_globals` (the `navigation` and `site_settings` tables plus their versions counterparts). Local dev is push-managed — author only, never run `payload migrate` locally. **Requires T010 green, T011 landed, and T007 green for the last migration.**
- [x] T023 [US1] Run `npm run generate:types` and commit the regenerated `src/payload-types.ts`. Fix any resulting type errors in render components that referenced dropped fields or the removed `SiteSetting` / `Navigation` types.
- [x] T024 [US1] Retire the cutover step in `docs/INFRASTRUCTURE_RUNBOOK.md` that seeds the `siteSettings` NAP so `Organization` JSON-LD emits an address (added in PR #105). The values are code-owned after T014, so the step is not merely unnecessary but actively misleading (FR-005a).
- [~] T025 [US1] **Reconciliation done, replay BLOCKED on an interactive prompt.** Legacy keys stripped from the six affected drafts (133 keys across case-studies / services / team / workshops / pages / global-homepage; every doc verified to still carry a populated `layout`), and `global-navigation.json` + `global-site-settings.json` deleted. The `--dry-run` replay itself needs a local server on the new schema, and the dev-mode drizzle push halts on an interactive `(y/N)` data-loss confirmation that cannot be answered from a non-TTY shell (`PAYLOAD_FORCE_DRIZZLE_PUSH` does not bypass it — it only skips the no-change short-circuit). Hand-off in the session notes. Original task: replay every `docs/content-drafts/*.json` file in the load order from `docs/content-drafts/README.md` with `--dry-run`, reconcile any file that sets a removed field, and **delete any `global-navigation*.json` / `global-site-settings*.json` request file outright** rather than editing it. Confirm zero unresolved references (FR-029). These files are gitignored and outside CI — this is a manual merge gate.

### Discovered during implementation (not in the original plan)

- [x] T010a [US1] Export the composed `services.layout` to a gitignored `docs/content-drafts/services-layouts-backup.json` before the drop (FR-031 preserve branch). The T003 inventory found the tables held composed block content for the nine capability services — 24 content blocks, 9 deliverables (36 items), 9 FAQ (23 items), 12 contact CTAs — that ROADMAP SVC-3 plans to publish. The prose is archived in `_archive/content-batch.json`; the composition was not. Tool at `tools/legacy-equivalence/export-services-layouts.ts`; 9 services / 45 blocks exported.
- [x] T019a [US1] Retire the spec-010 migration runner (`runComposer` / `runGlobalComposer` in `compose/shared.ts`) and the two int suites that exercised it against real records. With the legacy columns gone it reads fields the schema no longer has and composes an empty layout — a deploy step that silently no-ops. The pure `composeX` functions survive; the `convert-to-blocks` skill still uses them as its reference mapping (its 9 tests stay green).
- [x] T019b [US1] Convert the committed E2E fixtures off the removed fields onto block layouts: `tests/e2e/helpers/seedInScopeRoutes.ts`, `datalayer-events.e2e.spec.ts`, `marquee-pages.e2e.spec.ts`.

**Checkpoint**: Nothing in the admin accepts input that goes nowhere. Metadata, `Organization` JSON-LD, and public render are provably unchanged. This is a shippable increment on its own.

---

## Phase 4: User Story 2 — Pick the right block without guessing (Priority: P1)

**Goal**: The block picker presents 45 blocks in named categories, each with a distinct preview and a description that disambiguates it from its neighbours.

**Independent Test**: Open the picker in the admin and confirm grouped, visually distinct entries; the metadata completeness test passes.

**Note**: Config-only and non-destructive — can run fully in parallel with US1.

### Tests for User Story 2 (MANDATORY) ⚠️

- [x] T026 [US2] Write `tests/int/adminMetadata.int.spec.ts` implementing contract C1 and C2. **The `admin.description` clause is dropped — Payload has no such property** (see the retraction below); it is replaced by the label uniqueness/substring rule, plus a check that `layoutBlocks` is sorted by category (the picker draws headings in registration order) and that `public/block-previews/` holds no orphan files. 153 assertions.

### Implementation for User Story 2

- [x] T027 [US2] Build `tools/block-thumbnails/index.ts` (`npm run block:thumbnails`). **Source changed**: not the full-page showcase capture. Payload draws the thumbnail into an `aspect-ratio: 3/2` box with `object-fit: cover`, so a stacked full-page screenshot arrives centre-cropped into an unreadable strip. A new capture spec, `tests/e2e/visual/blockPreviews.e2e.spec.ts`, screenshots the block's own `<section>` (every variant, so a preview can be re-pointed without re-capturing); the tool letterboxes that to exactly 480×320 on the block's own background colour, sampled from the capture. Actual: 45 previews, **141 KB** of the 400 KB budget.
- [x] T028 [US2] Ran the pipeline and committed 44 webp + 1 svg under `public/block-previews/`. No `.gitattributes` entry needed — git already treats webp as binary. **One trap worth recording**: the seeded showcase renders media through `serverURL`, which falls back to `http://localhost:3100`, so capturing from a dev server on any other port silently produces previews in which every image is a broken-image alt string. The first full run was thrown away for exactly that.
- [x] T029 [US2] **The predicted list was wrong — all six render fine.** `hubspot-form` draws a real form, `map` real tiles, `embed` a live iframe, and the three list blocks their seeded rows; each was looked at. Exactly one block needed drawing, for a different reason: `video-embed` renders a facade around a **remote** YouTube poster frame, so its capture is non-deterministic (it failed outright on one run) and would have committed a third party's video still into a public repo. Wireframe at `public/block-previews/video-embed.svg`. (Review round 1 replaced the tool's `HAND_AUTHORED` set with the extension declared on the block's own `admin.images.thumbnail`, so a hand-authored preview is now stated once, in `blockAdmin()`.)
- [x] T030 [P] [US2] Add `admin.group: 'hero'`, description, `disableBlockName`, and `admin.images.thumbnail` to the 4 hero blocks in `src/payload/blocks/layout/`: `Hero.ts`, `CaseStudyHero.ts`, `ServicePillarHero.ts`, `HomepageHero.ts`. Descriptions MUST state when to choose each over the other three — this is the motivating case for contract C1's disambiguation clause.
- [x] T031 [P] [US2] Same treatment for the 9 `content` blocks in `src/payload/blocks/layout/`: `Content.ts`, `TwoColumn.ts`, `Image.ts`, `Gallery.ts`, `ProcessSteps.ts`, `Deliverables.ts`, `ComparisonTable.ts`, `Timeline.ts`, `FAQ.ts`.
- [x] T032 [P] [US2] Same treatment for the 6 `social-proof` blocks in `src/payload/blocks/layout/`: `StatsBar.ts`, `MetricDisplay.ts`, `LogoBar.ts`, `TestimonialBlock.ts`, `FeaturedTestimonials.ts`, `ClientLogoGrid.ts`.
- [x] T033 [P] [US2] Same treatment for the 3 `cta` blocks in `src/payload/blocks/layout/`: `CtaSection.ts`, `ContactCta.ts`, `NewsletterCta.ts`.
- [x] T034 [P] [US2] Same treatment for the 10 `content-collection` blocks in `src/payload/blocks/layout/`: `FeaturedCaseStudy.ts`, `CaseStudyGrid.ts`, `ServicePillarCards.ts`, `ServiceCards.ts`, `TeamGrid.ts`, `PostList.ts`, `RelatedPosts.ts`, `WorkshopList.ts`, `IndustryGrid.ts`, `LocationsList.ts`.
- [x] T035 [P] [US2] Same treatment for the 13 `specialty` blocks in `src/payload/blocks/layout/`: `Accordion.ts`, `Tabs.ts`, `BrandTeaser.ts`, `DownloadCard.ts`, `Embed.ts`, `VideoEmbed.ts`, `HubspotForm.ts`, `HubspotMeetings.ts`, `KeyTakeaways.ts`, `Map.ts`, `MissionVisionValues.ts`, `NavCards.ts`, `TechStack.ts`.
- [x] T036 [US2] Add `admin.images.icon` (20×20) and descriptions to the 7 inline blocks in `src/payload/blocks/inline/`: `Callout.ts`, `Disclosure.ts`, `Figure.ts`, `ImageWithCaption.ts`, `InlineCta.ts`, `QuotePullquote.ts`, `TestimonialEmbed.ts`.
- [x] T037 [US2] Ran `npm run generate:importmap` — no change, and correctly so: `admin.images` and `admin.group` are data, not components, so nothing new enters the map. `npm run generate:types` did change `src/payload-types.ts`, but the diff is 81 lines moved with zero added or removed — the `layoutBlocks` reorder, no schema change and so no migration.
- [x] T038 [US2] Wrote `tests/e2e/admin/blockPicker.e2e.spec.ts` (3 tests, green). Asserts the six headings render **in taxonomy order**, that `__block-group-none` is empty (no ungrouped block), that all 45 cards are offered, that every preview `<img>` has a non-zero `naturalWidth` and none 404ed, and that the heroes are distinguishable **by label** — including that searching `hero` narrows to exactly the four, since the picker's search matches `labels.singular` alone.

**Checkpoint**: The picker is usable. Screenshotted and looked at, at 1600×1000, in the running admin: six headings
in taxonomy order (Page openers 4, Body content 9, Proof and credibility 6, Calls to action 3, Lists and collections 10,
Specialty 13 = 45), every card carrying a distinct, legible preview at card size.

**Two defects the previews surfaced, both fixed here**:

- The showcase fixtures and `BLOCK_LIBRARY.md` §5 **disagreed** about two blocks — fixtures filed `faq` under
  specialty and `mission-vision-values` under content, the reverse of the doc. Rather than correct two rows, the
  duplication is gone: `fixtures.ts` now derives each fixture's category from the block's own `admin.group`, so
  there is one assignment and it is the one the editor sees. The doc won on both.
- Category **order** in the picker is the `layoutBlocks` registration order, not the `BLOCK_CATEGORIES` order —
  Payload's `BlockSelector` groups by first encounter. `BLOCK_CATEGORIES` documented its order as load-bearing but
  nothing enforced it, and the two moves above broke it. `layoutBlocks` is now sorted by category with a test pinning it.

---

## Phase 5: User Story 3 — Lists answer "what's live?" and "which image is this?" (Priority: P2)

**Goal**: Publish state is a default column everywhere drafts exist; every image previews itself.

**Independent Test**: Load each list view and the media library and confirm both, including for records uploaded before this change.

### Tests for User Story 3 (MANDATORY) ⚠️

- [x] T039 [P] [US3] Wrote `tests/int/adminThumbnail.int.spec.ts` per contract C6, over the three fixtures: a record carrying the existing `mobile_webp` derivative (the state of all 78 current records), a record with no usable derivative at all, and a non-image record. 8 assertions, including that the resolver never falls back to the full-size original and that the size it reads is one the collection actually generates.
- [x] T040 [P] [US3] Extended `tests/int/adminMetadata.int.spec.ts` with contract C3's publish-state clause, asserted over `src/collections/index.ts` (new: the config's `collections` array lifted into a barrel) rather than a hand-listed ten, so a collection that gains drafts later cannot ship without the column. Also fails a non-draft collection that names `_status`, which would be a header over an empty cell. **The clause changed during T043** — see the amendment below.

### Implementation for User Story 3

- [x] T041 [US3] `src/collections/Media.ts` exports `mediaAdminThumbnail` and wires it as `upload.adminThumbnail`. No new `imageSize`, per the 2026-08-21 clarification. The size name is derived from the smallest entry in `BREAKPOINTS` rather than hard-coded, so adding a smaller breakpoint moves the thumbnail with it. **One decision the task did not anticipate**: it returns the derivative's stored `/api/media/file/<filename>` path, not the CloudFront `/media/*` URL — Payload's list view narrows its query to `{ mimeType, thumbnailURL, sizes.* }` (`appendUploadSelectFields`), so the doc's storage `prefix` is absent exactly where the thumbnails are needed and `mediaFileURL` cannot be built. Recorded in contract C6.
- [x] T042 [US3] `_status` added to `defaultColumns` in all 10 draft-enabled collections — **second, not first**. Payload makes the first active column the link to the record (`buildColumnState`: `isLinkedColumn && colIndex === activeColumnsIndices[0]`), so leading with `_status` turned every row into an underlined "Published" that opened the record while the title beside it went dead. Implemented as specified, screenshotted, reverted the same session; contract C3 carries the amendment and the E2E spec pins it.
- [x] T043 [US3] Verified in the running admin at 1600×1000, screenshots opened and judged: media list, the drawer a block's upload field opens, the upload field's own preview, and collapsed rows of four different media arrays. Thumbnails render everywhere (naturalWidth 640 on real photos, and the two 1×1 E2E fixture PNGs correctly render as 1×1 rather than as a broken image). **Array rows were still unidentifiable** — eight rows reading `Logo 01`…`Logo 08` — so the conditional in this task fired: `src/components/admin/MediaRowLabel.tsx` + `src/payload/fields/mediaRowLabel.ts` now label all six media arrays (`industries.clientLogos`, `gallery.items`, `timeline.items`, `logo-bar.logos`, `client-logo-grid.logos`, `nav-cards.cards`). They now read `Manufacturing / Healthcare / FinTech …` and, where the row is nothing but an upload, the media's alt text — each with a 20px thumbnail. `generate:importmap` regenerated; `generate:types` produced no diff, so no migration.

### Discovered during implementation (not in the original plan)

- [x] T042a [US3] Lifted the config's `collections` array into `src/collections/index.ts` and had `payload.config.ts` consume it. T040 and US6's T056 both need to assert over "every collection"; importing `payload.config.ts` for that would drag the Postgres adapter, the S3 plugin and sharp into a pure config assertion.
- [x] T043a [US3] Wrote `tests/e2e/admin/mediaThumbnails.e2e.spec.ts` (4 tests, green). The int specs prove the config; this proves Payload draws it — a thumbnail with non-zero `naturalWidth` in the list and in the picker drawer, `_status` present as a column with the title still carrying the row link, and collapsed array rows naming themselves. It creates its own 800×600 fixture image (wider than the 640px breakpoint, so a real derivative exists to find) and tears it down, because CI starts from an empty database.
- [x] T043b [US3] Added the FR-017 clause to `tests/int/adminMetadata.int.spec.ts`: a walk over every collection, global and block that fails any array field with an `upload` child and no `RowLabel`. Six arrays today; the seventh cannot ship without one.

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

- [x] T058 [P] Write `docs/decisions/0010-site-chrome-code-owned.md` recording the 2026-08-21 decision to withdraw Navigation and Site Settings rather than wire them up: the unvalidated-nav-URL and redirect-map-coupling rationale, the **full seven-value consumer inventory** that made the withdrawal wider than first specced, the once-a-decade edit frequency, and the revisit condition.
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
