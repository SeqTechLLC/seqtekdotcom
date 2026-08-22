# Implementation Plan: Payload admin UX for content self-serve

**Branch**: `feat/011-payload-admin-ux` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-payload-admin-ux/spec.md`; research findings in [research.md](./research.md).

## Summary

Make the Payload admin usable by a non-engineer editor by fixing the presentation layer that specs 003 and 010 never designed. Two movements, in order:

**First, stop the admin from lying.** Delete `Pages.hero` (verified empty, no consumers), withdraw the Navigation and Site Settings globals after relocating their two live metadata reads into the existing hard-coded chrome constant, strip the dead page-composition body from the unrouted Services / Service Pillars collections, and finish the ADR 0009 expand/contract by dropping the retained legacy body columns — with one correction the research surfaced: `teamMembers.expertise` is **not** legacy (it feeds `knowsAbout` in the Person JSON-LD) and becomes a visible, editable field instead of a dropped one. A field-consumer registry test then makes this class of defect fail CI rather than accumulate silently.

**Second, make the remaining surface legible.** Give all 45 blocks a category, a derived 3:2 preview, and a description so the picker can be used to pick blocks; put publish state in every draftable list; make every image show a thumbnail via the function form of `adminThumbnail` (which avoids a 78-record backfill entirely); replace mechanically title-cased labels and add help text where effect is non-obvious; hide variant-irrelevant fields behind the existing `requiredWhen` helper; identify collapsed block rows by content; drop the redundant `required` on slugs so the working auto-generation hook reaches the UI; and group the dashboard by purpose.

No public route, template, or rendered byte changes. The committed seeder and the gitignored content-drafts files must keep working across every schema change.

## Technical Context

**Language/Version**: TypeScript 5 (strict, no `any`), Node 24, React 19

**Primary Dependencies**: Payload CMS 3.85.0 (installed; `^3.87.1` declared), Next.js 16.2.12 (App Router, Turbopack dev), `@payloadcms/db-postgres` + Drizzle, `@payloadcms/richtext-lexical`, `sharp`

**Storage**: PostgreSQL 18 (local `seqtek_dev` on :5433 via Docker Compose). Schema is push-managed locally and migration-managed in staging/prod (`push: false` in production — see `src/payload.config.ts`). This feature is **migration-bearing**: it drops columns and tables.

**Testing**: Vitest (integration) + Playwright (E2E, incl. admin-session specs) + axe-core + Lighthouse. Admin-authenticated browser tests mint a session via `tests/sessions/editorSession.ts` (`attachEditorSessionToContext`), the pattern already used by `tests/e2e/admin/editorDeleteForbidden.e2e.spec.ts`. Visual capture via `npm run visual:capture`.

**Target Platform**: Server-rendered Next.js on AWS (EC2 + ALB + CloudFront); admin panel served from the same origin at `/admin`.

**Project Type**: Web application — single Next.js app with Payload embedded.

**Performance Goals**: No public-render performance change is expected or accepted; existing Lighthouse budgets (a11y / best-practices / SEO ≥ 0.95) continue to gate. Committed block-thumbnail assets carry a **400 KB total budget** (≈9 KB × 45 at 480×320 webp).

**Constraints**:

- Admin-only change. Every public route must render identically at both viewports (FR-028), proven by `visual:capture` before/after.
- The committed `tools/payload-seed` pipeline and the gitignored `docs/content-drafts/*.json` files must load with zero unresolved references after every schema change (FR-029). Those files are outside CI, so this is a local gate on the PR author.
- Destructive migrations are gated on a content-equivalence check, not a row count (FR-031, research R2).
- Staging is torn down (2026-08-14), so verification runs against the local mirror and CI.
- CSP needs no change: `img-src` already allows `'self'`, and `src/proxy.ts`'s matcher excludes static image extensions.

**Scale/Scope**: 14 collections + 3 globals; 45 layout blocks + 7 inline blocks; 220 block fields; 49 camelCase field names needing labels; 78 media records; 57 pages. Roughly 6 user stories across two shippable movements.

**Framework internals read** (Constitution Principle I): enumerated in [research.md §R9](./research.md) — `payload/dist/fields/config/types.d.ts`, `payload/dist/collections/config/types.d.ts`, `payload/dist/collections/operations/create.js`, `payload/dist/fields/hooks/beforeChange/promise.js`. The hook-ordering read corrected a wrong assumption (that `slugFromTitle` was dead code) and produced the one-line fix in R10.

## Constitution Check

_GATE: evaluated before Phase 0 research; re-evaluated after Phase 1 design. Result: **PASS**, with one declared carve-out._

| Principle                          | Assessment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Spec Before Code**            | Spec written and validated before any code. Cites `docs/ARCHITECTURE.md` §2, `docs/BLOCK_LIBRARY.md` §5, `docs/decisions/0009-block-first-composition.md`, `docs/CONTENT-REQUIREMENTS.md` §8, `CLAUDE.md` "Content loading & deploys". Framework-internals source files enumerated in Technical Context and research R9. **PASS**                                                                                                                                                                                                                                                      |
| **II. Tests Gate Merge**           | Every user story ships an automated test (see per-story mapping below). One declared carve-out: **SC-003** (an editor picks the right block in 9 of 10 trials under 30 seconds) is a usability outcome with no in-repo path to exercise without padding. Verified instead as a **recorded walkthrough with the marketing lead**, per the external-verification carve-out; its CI-side proxy is FR-013's block-metadata completeness test, which is a real code-path test. Every other requirement in this spec is CI-covered. **PASS (carve-out declared)**                            |
| **III. Docs Are Code**             | This feature changes documented surfaces and must reconcile in the same commits: `docs/BLOCK_LIBRARY.md` (block categories become load-bearing metadata, not just doc structure), `docs/PAYLOAD_DEVELOPMENT.md` (new required block/field metadata conventions), `docs/ARCHITECTURE.md` §2 (globals withdrawn from the admin), `CLAUDE.md` (Current phase + the site-chrome ownership decision). The site-chrome decision and the block-preview approach are **non-obvious and get an ADR** (see below). ROADMAP items move to PROJECT_HISTORY on ship, not checkbox-flipped. **PASS** |
| **IV. Security Baseline**          | No new runtime dependencies on the auth/session/render path. No secrets. CSP unchanged (research R3 confirms `img-src 'self'` already covers committed admin assets). Access control is untouched — this feature changes what editors _see_, never what they may _do_; the access-matrix invariant and its existing tests stand. Committed thumbnails are static images under `public/`, not executable. **PASS**                                                                                                                                                                      |
| **V. Bleeding-Edge Stack, Pinned** | Uses only Payload 3.85 APIs verified against the installed type definitions (`admin.group` and `admin.images` on Blocks are 3.85-era; the older `imageURL`/`imageAltText` form is deliberately not used). No version bumps. No new deprecation warnings introduced. **PASS**                                                                                                                                                                                                                                                                                                           |

**New ADRs required** (Principle III — non-obvious decisions are numbered ADRs, not inline rationale):

- **ADR 0010 — Site chrome stays code-owned.** Records the 2026-08-21 decision to withdraw Navigation and Site Settings from the admin rather than wire them up, with the unvalidated-nav-URL / redirect-map-coupling rationale and the revisit condition (edit frequency changes).
- **ADR 0011 — Block previews are derived, not authored.** Records the committed-raster tradeoff, the size budget, the SVG fallback for blocks that photograph badly, and why build-time generation was rejected.

**Complexity**: no violations to justify. The Complexity Tracking table is omitted.

### Test mapping per user story (Principle II)

| Story                   | Load-bearing path                                                                  | Test                                                                                                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1 — no inert controls | Field-consumer registry; metadata output after chrome relocation; migration safety | Vitest integration: registry completeness over the flattened config field tree; metadata assertions for every public route after `buildMetadata` loses its `siteSettings` argument; equivalence check gating the drop migration                    |
| US2 — block picker      | Block metadata completeness                                                        | Vitest integration over `layoutBlocks` + `richTextBlocks`: every block has a group, a description, and a thumbnail path that resolves on disk                                                                                                      |
| US3 — lists             | `defaultColumns` + `adminThumbnail` resolution                                     | Vitest integration asserting `_status` present on every draftable collection's `defaultColumns`; unit test of the `adminThumbnail` function across a record with the new size, a record with only `mobile_webp`, and a non-image record            |
| US4 — form legibility   | Label + description coverage; conditional visibility                               | Vitest integration asserting no label is a mechanical title-case of its field name and that flagged fields carry descriptions; Playwright admin spec selecting each variant of a multi-variant block and asserting other-variant fields are hidden |
| US5 — record creation   | Slug generation through the admin form                                             | Playwright admin spec: create a Page with only a title, save, assert the derived slug; assert rename does not rewrite the slug; assert invalid slug shows a plain-language error                                                                   |
| US6 — dashboard         | Collection admin metadata                                                          | Vitest integration asserting every collection and global has a `group` and a `description`                                                                                                                                                         |

Plus the cross-cutting non-regression gates: `visual:capture` before/after over every public route at both viewports (FR-028), and a local seed replay of every `docs/content-drafts/*.json` file (FR-029).

## Project Structure

### Documentation (this feature)

```text
specs/011-payload-admin-ux/
├── plan.md              # This file
├── research.md          # Phase 0 output — R1..R11
├── data-model.md        # Phase 1 output — schema deltas + migration sequence
├── quickstart.md        # Phase 1 output — how to run and verify this feature
├── contracts/
│   └── admin-metadata.md  # Phase 1 output — the admin presentation contract new code must satisfy
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── collections/                    # Pages (drop hero), Services + ServicePillars (strip layout/preview),
│   │                               # TeamMembers (expertise becomes visible), Media (adminThumbnail),
│   │                               # all: admin.group + description + _status in defaultColumns
│   ├── Pages.ts  Posts.ts  CaseStudies.ts  Workshops.ts  TeamMembers.ts
│   ├── Partners.ts  Media.ts  Services.ts  ServicePillars.ts
│   └── Testimonials.ts  Industries.ts  Locations.ts  Categories.ts  Users.ts
├── globals/
│   ├── Navigation.ts  SiteSettings.ts   # admin.hidden: true
│   └── Homepage.ts                      # drop retained legacy fields
├── payload/
│   ├── blocks/layout/*.ts               # 45 files: admin.group, admin.images, description,
│   │                                    # disableBlockName, components.Label, requiredWhen audit
│   ├── blocks/inline/*.ts               # 7 files: admin.images.icon for the Lexical menu
│   ├── fields/
│   │   ├── seo.ts                       # NEW — the 10x-repeated seo group, extracted once
│   │   ├── cta.ts                       # NEW — the repeated cta group shape, extracted once
│   │   └── url.ts                       # existing
│   ├── hooks/slugFromTitle.ts           # validateSlug tolerates empty on create
│   └── admin/
│       └── BlockRowLabel.tsx            # NEW — content-derived collapsed row label
├── lib/
│   ├── site-content.ts                  # absorbs tagline + companyName; nav/settings stay here
│   ├── metadata.ts                      # buildMetadata drops its siteSettings argument
│   ├── payload.ts                       # getNavigation removed; getSiteSettings callers unwound
│   └── structured-data.ts               # unchanged — but pins expertise as a live consumer
├── app/(frontend)/**/page.tsx           # generateMetadata call sites updated (~10 files)
└── migrations/                          # NEW migrations: drop hero, drop legacy bodies, drop services layout

tools/
└── block-thumbnails/                    # NEW — derives 3:2 webp previews from showcase captures

public/
└── admin/blocks/<blockType>.webp        # NEW — committed, 400 KB total budget

tests/
├── e2e/
│   ├── admin/                           # NEW specs: variant-conditional fields, slug-from-title,
│   │                                    # block picker grouping — all via editorSession
│   └── visual/                          # existing capture harness; feeds tools/block-thumbnails
└── int/
    ├── adminMetadata.int.spec.ts         # NEW — block + collection metadata completeness
    ├── fieldConsumerRegistry.int.spec.ts # NEW — FR-008 registry gate
    └── adminThumbnail.int.spec.ts        # NEW — thumbnail resolution fallbacks

docs/
├── decisions/0010-site-chrome-code-owned.md    # NEW ADR
├── decisions/0011-derived-block-previews.md    # NEW ADR
├── BLOCK_LIBRARY.md  PAYLOAD_DEVELOPMENT.md  ARCHITECTURE.md   # reconciled in-commit
└── content-drafts/*.json                        # gitignored — replayed locally, not committed
```

**Structure Decision**: single Next.js application with Payload embedded, matching the existing layout. No new top-level structure. Two additions follow existing repo conventions: `tools/block-thumbnails/` (tooling lives in subdirectories, never the repo root) and `src/payload/fields/` gains shared field factories alongside the existing `url.ts`, which is the established pattern for cross-collection field shapes.

## Implementation Sequencing

The two movements are independently shippable, and the destructive work is gated.

**Movement A — truthfulness (US1).** Order matters: the equivalence check runs first and gates everything after it.

1. Inventory + equivalence check over legacy prose vs composed layouts (research R2). Blocks the migrations if it fails.
2. Relocate `tagline` / `companyName` into `site-content.ts`; unwind `buildMetadata`'s `siteSettings` argument across ~10 route files; delete `getNavigation`. Metadata assertions must stay green.
3. Make `teamMembers.expertise` visible and editable — **before** the drop migration, so the field is never simultaneously invisible and load-bearing.
4. Hide Navigation + Site Settings; strip `Services` / `ServicePillars` layout + live preview.
5. Migrations: drop `Pages.hero` columns, drop the retained legacy body columns and their array tables, drop `services.layout`.
6. Field-consumer registry test.
7. Replay every `docs/content-drafts/*.json` locally; reconcile any file referencing a removed field.

**Movement B — legibility (US2–US6).** Parallelisable after A lands, except that thumbnails depend on the showcase capture.

1. `npm run seed:showcase` → `npm run visual:capture` → `tools/block-thumbnails` → committed webp; hand-authored SVG for the blocks that photograph badly.
2. Block metadata sweep across 45 files: group, images, description, `disableBlockName`, row label.
3. Extract the shared `seo` and `cta` field factories with labels and help text authored once; apply across the 10 and 5+4+3 call sites respectively.
4. Label and help-text pass over the remaining 49 camelCase names.
5. `requiredWhen` audit across the 37 blocks not yet using it.
6. `_status` into `defaultColumns`; `adminThumbnail` function; media picker verification.
7. Slug `required` removal + `validateSlug` empty tolerance + regression tests.
8. Page starter skeleton, mirroring the existing `caseStudySkeleton` pattern.
9. Collection/global `group` + `description`; dashboard grouping.

**Closing gates (both movements).** `visual:capture` diff over every public route at both viewports; full local E2E run (route-restructuring precedent: content Pages 404 in CI because CI reseeds fresh, so route-adjacent changes need a local full run before push); CI green.

## Risks

| Risk                                                                           | Mitigation                                                                                                                                         |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| The drop migration destroys prose that was never actually composed into blocks | Equivalence check gates the migration (Movement A step 1); it compares content, not row counts                                                     |
| `expertise` drop silently degrades JSON-LD                                     | Caught in research R2; the field is promoted to visible before any drop runs, and `structured-data` keeps its consumer                             |
| `buildMetadata` refactor changes metadata output on some route                 | Full metadata assertion suite across all public routes runs before and after; `visual:capture` will not catch this, so it is an explicit test gate |
| Gitignored content-drafts files break on the next seed                         | Local replay of every file is a merge gate (FR-029); those files are outside CI so this cannot be automated                                        |
| 45 committed rasters bloat the repo                                            | 400 KB total budget, enforced by a check in the thumbnail tool; regeneration is an explicit command, not a build step                              |
| Block thumbnails drift from what blocks render                                 | They are derived from the live showcase render, so drift requires the showcase to be stale; regeneration is documented in quickstart               |
| Hiding globals strands 50 versions of prior content                            | `admin.hidden` retains tables and versions; nothing is dropped, and the decision is reversible per ADR 0010                                        |
