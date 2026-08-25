# Implementation Plan: Payload admin UX for content self-serve

**Branch**: `feat/011-payload-admin-ux` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-payload-admin-ux/spec.md` (clarified 2026-08-21, five decisions recorded); research findings in [research.md](./research.md).

## Summary

Make the Payload admin usable by a non-engineer editor by fixing the presentation layer that specs 003 and 010 never designed. Two movements, in order:

**First, stop the admin from lying.** Delete `Pages.hero` (verified empty, no consumers), withdraw the Navigation and Site Settings globals after relocating **all seven** of Site Settings' live render-path reads into the existing hard-coded chrome constant, strip the dead page-composition body from the unrouted Services / Service Pillars collections, and finish the ADR 0009 expand/contract by dropping the retained legacy body columns — with one correction the research surfaced: `teamMembers.expertise` is **not** legacy (it feeds `knowsAbout` in the Person JSON-LD) and becomes a visible, editable field instead of a dropped one. A field-consumer registry test then makes this class of defect fail CI rather than accumulate silently.

**Second, make the remaining surface legible.** Give all 45 blocks a category, a committed WebP preview, and a description so the picker can be used to pick blocks; put publish state in every draftable list; make every image show a thumbnail via the function form of `adminThumbnail` against derivatives that already exist; replace mechanically title-cased labels and add help text where effect is non-obvious; hide variant-irrelevant fields behind the existing `requiredWhen` helper; identify collapsed block rows by content; fix slug creation so a title alone produces a valid slug and a collision fails legibly; and group the dashboard by purpose.

No public route, template, or rendered byte changes. The committed seeder and the gitignored content-drafts files must keep working across every schema change.

### What the 2026-08-21 clarifications changed in this plan

| Clarification                                                     | Effect on the plan                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Block previews are committed WebP under `public/block-previews/`  | Confirms the prior approach and pins the path. Build-time generation and a separate S3 bucket are rejected on the record, so `tools/block-thumbnails` stays an explicit command, never a build step.                                                              |
| SC-001 / SC-003 demoted to targets                                | **Removes the Constitution Check carve-out entirely.** The prior plan declared an external-verification substitution for SC-003 (a recorded walkthrough with the marketing lead). No substitution is needed now — every acceptance gate is a real code-path test. |
| Slug collisions reject with a named conflict and a suggested slug | New work in US5 beyond the auto-generation fix: a collision-aware validator plus its own test. Previously unspecified.                                                                                                                                            |
| No dedicated admin thumbnail derivative                           | Simplifies R7 — **no new `imageSize` is added at all.** The prior plan added a small size for new uploads and preferred it in the resolver; that half is dropped.                                                                                                 |
| Site Settings has **seven** render-path consumers, not two        | The largest change. `structured-data.ts` moves from "unchanged" to a modified file, the `Organization` JSON-LD gains a regression test, and the PR #105 runbook cutover step retires in the same change (FR-005a).                                                |

## Technical Context

**Language/Version**: TypeScript 5 (strict, no `any`), Node 24, React 19

**Primary Dependencies**: Payload CMS 3.85.0 (installed; `^3.87.1` declared), Next.js 16.2.12 (App Router, Turbopack dev), `@payloadcms/db-postgres` + Drizzle, `@payloadcms/richtext-lexical`, `sharp`

**Storage**: PostgreSQL 18 (local `seqtek_dev` on :5433 via Docker Compose). Schema is push-managed locally and migration-managed on deployed lanes (`push: false` in production — see `src/payload.config.ts`). This feature is **migration-bearing**: it drops columns and tables.

**Testing**: Vitest (integration) + Playwright (E2E, incl. admin-session specs) + axe-core + Lighthouse. Admin-authenticated browser tests mint a session via `tests/sessions/editorSession.ts` (`attachEditorSessionToContext`), the pattern already used by `tests/e2e/admin/editorDeleteForbidden.e2e.spec.ts`. Visual capture via `npm run visual:capture`.

**Target Platform**: Server-rendered Next.js on AWS — ECS Fargate behind an ALB and CloudFront since PR #100/#103. The admin panel is served from the same origin at `/admin`.

**Project Type**: Web application — single Next.js app with Payload embedded.

**Performance Goals**: No public-render performance change is expected or accepted; existing Lighthouse budgets (a11y / best-practices / SEO ≥ 0.95) continue to gate. Committed block previews carry a **400 KB total budget** — measured 2026-08-21 at 480px wide, WebP q78 averages 7.8 KB per block, so the full set of 45 lands near 340 KB with headroom.

**Constraints**:

- Admin-only change. Every public route must render identically at both viewports (FR-028), proven by `visual:capture` before/after.
- The committed `tools/payload-seed` pipeline and the gitignored `docs/content-drafts/*.json` files must load with zero unresolved references after every schema change (FR-029). Those files are outside CI, so this is a local gate on the PR author.
- Destructive migrations are gated on a content-equivalence check, not a row count (FR-031, research R2).
- **No rehearsal environment.** The separate staging account was retired 2026-08-14; `preview.seqtek.com` (primary lane) and `ww3.seqtek.com` (secondary lane) are two services in the same stack in the same account. Verification runs against the local mirror and CI, and the drop migrations reach a lane holding real content with no isolated environment to rehearse in first. See Risks.
- CSP needs no change: `img-src` already allows `'self'`, and `src/proxy.ts`'s matcher excludes static image extensions.

**Scale/Scope**: 14 collections + 3 globals; 45 layout blocks + 7 inline blocks; 220 block fields; 49 camelCase field names needing labels; 78 media records; 57 pages. 14 route files call `getSiteSettings`. Roughly 6 user stories across two shippable movements.

**Framework internals read** (Constitution Principle I): enumerated in [research.md §R9](./research.md) — `payload/dist/fields/config/types.d.ts`, `payload/dist/collections/config/types.d.ts`, `payload/dist/collections/operations/create.js`, `payload/dist/fields/hooks/beforeChange/promise.js`. The hook-ordering read corrected a wrong assumption (that `slugFromTitle` was dead code) and produced the one-line fix in R10.

## Constitution Check

_GATE: evaluated before Phase 0 research; re-evaluated after Phase 1 design. Result: **PASS**, no carve-out required._

| Principle                          | Assessment                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Spec Before Code**            | Spec written, clarified, and validated before any code. Cites `docs/ARCHITECTURE.md` §2, `docs/BLOCK_LIBRARY.md` §5, `docs/decisions/0009-block-first-composition.md`, `docs/CONTENT-REQUIREMENTS.md` §8, `CLAUDE.md` "Content loading & deploys". Framework-internals source files enumerated in Technical Context and research R9. **PASS**                                                                                            |
| **II. Tests Gate Merge**           | Every user story ships an automated test (mapping below). **No external-verification carve-out is claimed.** The prior draft substituted a recorded walkthrough for SC-003; the 2026-08-21 clarification demoted SC-001 and SC-003 to targets rather than gates, so every remaining acceptance criterion has an in-repo path and is CI-covered. **PASS**                                                                                 |
| **III. Docs Are Code**             | Reconciled in the same commits: `docs/BLOCK_LIBRARY.md` (categories become load-bearing metadata), `docs/PAYLOAD_DEVELOPMENT.md` (required block/field metadata conventions), `docs/ARCHITECTURE.md` §2 (globals withdrawn), `docs/INFRASTRUCTURE_RUNBOOK.md` (the PR #105 seed-the-NAP cutover step retires — FR-005a), `CLAUDE.md`. Two non-obvious decisions get ADRs. One pre-existing defect to fix in passing: see below. **PASS** |
| **IV. Security Baseline**          | No new runtime dependencies on the auth/session/render path. No secrets. CSP unchanged (research R3 confirms `img-src 'self'` already covers committed admin assets). Access control untouched — this feature changes what editors _see_, never what they may _do_; the access-matrix invariant and its tests stand. Committed previews are static images under `public/`, not executable. **PASS**                                      |
| **V. Bleeding-Edge Stack, Pinned** | Uses only Payload 3.85 APIs verified against the installed type definitions (`admin.group` and `admin.images` on Blocks are 3.85-era; the older `imageURL`/`imageAltText` form is deliberately not used). No version bumps. No new deprecation warnings introduced. **PASS**                                                                                                                                                             |

**Pre-existing doc defect found during this gate.** The constitution's own Additional Constraints say _"Phase boundaries: Phase N items do not ship before Phase N-1 prerequisites; see ROADMAP.md §4."_ The roadmap was restructured on 2026-08-21 into a prioritized P1–P4 punch list with no numbered sections, so that reference no longer resolves. Principle III requires reconciling references when a shared doc changes; fix the pointer in this feature's doc-reconciliation commit.

**New ADRs required** (Principle III — non-obvious decisions are numbered ADRs, not inline rationale):

- **ADR 0010 — Site chrome stays code-owned.** Records the 2026-08-21 decision to withdraw Navigation and Site Settings rather than wire them up, the unvalidated-nav-URL / redirect-map-coupling rationale, the full seven-value consumer inventory that made the withdrawal wider than first specced, and the revisit condition (edit frequency changes).
- **ADR 0011 — Block previews are committed, derived rasters.** Records the measured size basis (7.8 KB × 45 ≈ 340 KB), why build-time generation was rejected (Playwright plus Postgres in the image build), why a separate asset bucket was rejected (previews become environment state, absent in local dev and CI), and the SVG fallback for blocks that photograph badly.

**Complexity**: no violations to justify. The Complexity Tracking table is omitted.

### Test mapping per user story (Principle II)

| Story                   | Load-bearing path                                                                                                 | Test                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1 — no inert controls | Field-consumer registry; metadata **and `Organization` JSON-LD** output after chrome relocation; migration safety | Vitest integration: registry completeness over the flattened config field tree; metadata assertions for every public route after `buildMetadata` loses its `siteSettings` argument; **a golden-object assertion on `organizationLd` covering all seven relocated values**; equivalence check gating the drop migration |
| US2 — block picker      | Block metadata completeness                                                                                       | Vitest integration over `layoutBlocks` + `richTextBlocks`: every block has a group, a description, and a preview path that resolves on disk and is within budget                                                                                                                                                       |
| US3 — lists             | `defaultColumns` + `adminThumbnail` resolution                                                                    | Vitest integration asserting `_status` present on every draftable collection's `defaultColumns`; unit test of the `adminThumbnail` function across a record with `mobile_webp`, a record with no derivatives, and a non-image record                                                                                   |
| US4 — form legibility   | Label + description coverage; conditional visibility                                                              | Vitest integration asserting no label is a mechanical title-case of its field name and that flagged fields carry descriptions; Playwright admin spec selecting each variant of a multi-variant block and asserting other-variant fields are hidden                                                                     |
| US5 — record creation   | Slug generation and collision handling through the admin form                                                     | Playwright admin spec: create a Page with only a title, save, assert the derived slug; assert rename does not rewrite the slug; assert invalid slug shows a plain-language error; **assert a colliding title is rejected with a message naming the conflicting record and offering a free slug**                       |
| US6 — dashboard         | Collection admin metadata                                                                                         | Vitest integration asserting every collection and global has a `group` and a `description`                                                                                                                                                                                                                             |

Plus the cross-cutting non-regression gates: `visual:capture` before/after over every public route at both viewports (FR-028), and a local seed replay of every `docs/content-drafts/*.json` file (FR-029).

## Project Structure

### Documentation (this feature)

```text
specs/011-payload-admin-ux/
├── plan.md              # This file
├── research.md          # Phase 0 output — R1..R12
├── data-model.md        # Phase 1 output — schema deltas + migration sequence
├── quickstart.md        # Phase 1 output — how to run and verify this feature
├── contracts/
│   └── admin-metadata.md  # Phase 1 output — the admin presentation contract new code must satisfy
├── checklists/
│   └── requirements.md    # Spec-quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── collections/                    # Pages (drop hero), Services + ServicePillars (strip layout/preview),
│   │                               # TeamMembers (expertise becomes visible), Media (adminThumbnail fn),
│   │                               # all: admin.group + description + _status in defaultColumns
│   ├── Pages.ts  Posts.ts  CaseStudies.ts  Workshops.ts  TeamMembers.ts
│   ├── Partners.ts  Media.ts  Services.ts  ServicePillars.ts
│   └── Testimonials.ts  Industries.ts  Locations.ts  Categories.ts  Users.ts
├── globals/
│   ├── Navigation.ts  SiteSettings.ts   # DELETED from the config (not hidden) — see R5
│   └── Homepage.ts                      # drop retained legacy fields
├── payload/
│   ├── blocks/layout/*.ts               # 45 files: admin.group, admin.images, description,
│   │                                    # disableBlockName, components.Label, requiredWhen audit
│   ├── blocks/inline/*.ts               # 7 files: admin.images.icon for the Lexical menu
│   ├── fields/
│   │   ├── seo.ts                       # NEW — the 10x-repeated seo group, extracted once
│   │   ├── cta.ts                       # NEW — the repeated cta group shape, extracted once
│   │   └── url.ts                       # existing
│   ├── hooks/slugFromTitle.ts           # validateSlug tolerates empty on create; collision-aware
│   └── admin/
│       └── BlockRowLabel.tsx            # NEW — content-derived collapsed row label
├── lib/
│   ├── site-content.ts                  # already holds all seven values — becomes their only home
│   ├── metadata.ts                      # buildMetadata drops its siteSettings argument
│   ├── structured-data.ts               # organizationLd reads the constant, not the global
│   ├── payload.ts                       # getNavigation + getSiteSettings removed
│   └── ...
├── app/(frontend)/**/page.tsx           # 14 route files: generateMetadata + organizationLd call sites
└── migrations/                          # NEW: drop hero, drop legacy bodies, drop services layout,
                                         #      drop navigation + site_settings tables

tools/
└── block-thumbnails/                    # NEW — derives 480px webp previews from showcase captures

public/
└── block-previews/<blockType>.webp      # NEW — committed, 400 KB total budget

tests/
├── e2e/
│   ├── admin/                           # NEW specs: variant-conditional fields, slug-from-title,
│   │                                    # slug collision, block picker grouping — via editorSession
│   └── visual/                          # existing capture harness; feeds tools/block-thumbnails
└── int/
    ├── adminMetadata.int.spec.ts         # NEW — block + collection metadata completeness
    ├── fieldConsumerRegistry.int.spec.ts # NEW — FR-008 registry gate
    ├── adminThumbnail.int.spec.ts        # NEW — thumbnail resolution fallbacks
    └── organizationLd.int.spec.ts        # NEW — all seven relocated values survive (FR-004)

docs/
├── decisions/0010-site-chrome-code-owned.md    # NEW ADR
├── decisions/0011-committed-block-previews.md  # NEW ADR
├── BLOCK_LIBRARY.md  PAYLOAD_DEVELOPMENT.md  ARCHITECTURE.md   # reconciled in-commit
├── INFRASTRUCTURE_RUNBOOK.md                    # the seed-the-NAP cutover step retires (FR-005a)
└── content-drafts/*.json                        # gitignored — replayed locally, not committed
```

**Structure Decision**: single Next.js application with Payload embedded, matching the existing layout. No new top-level structure. Two additions follow existing repo conventions: `tools/block-thumbnails/` (tooling lives in subdirectories, never the repo root) and `src/payload/fields/` gains shared field factories alongside the existing `url.ts`, which is the established pattern for cross-collection field shapes.

## Implementation Sequencing

The two movements are independently shippable, and the destructive work is gated.

**Movement A — truthfulness (US1).** Order matters: the equivalence check runs first and gates everything after it.

1. Inventory + equivalence check over legacy prose vs composed layouts (research R2). Blocks the migrations if it fails.
2. **Relocate all seven Site Settings reads.** Every value already exists on the hard-coded `siteSettings` constant in `src/lib/site-content.ts:141-152`, so this is a read-site swap with no new data authored: `buildMetadata` drops its `siteSettings` argument (14 route files), `organizationLd` reads the constant directly, and `getNavigation` / `getSiteSettings` are deleted from `src/lib/payload.ts`. The metadata assertion suite and the new `organizationLd` golden test must both stay green.
3. Make `teamMembers.expertise` visible and editable — **before** the drop migration, so the field is never simultaneously invisible and load-bearing.
4. Delete the Navigation and Site Settings globals from the Payload config; strip `Services` / `ServicePillars` layout + live preview.
5. Migrations: drop `Pages.hero` columns, drop the retained legacy body columns and their array tables, drop `services.layout`, drop the `navigation` and `site_settings` tables.
6. Retire the `INFRASTRUCTURE_RUNBOOK.md` cutover step that seeds the site-settings NAP (FR-005a) — the values are code-owned now and can no longer go dormant by being left unseeded.
7. Field-consumer registry test.
8. Replay every `docs/content-drafts/*.json` locally; reconcile any file referencing a removed field. Note `global-*` request files targeting the withdrawn globals must be deleted, not just edited.

**Movement B — legibility (US2–US6).** Parallelisable after A lands, except that previews depend on the showcase capture.

1. `npm run seed:showcase` → `npm run visual:capture` → `tools/block-thumbnails` → committed webp under `public/block-previews/`; hand-authored SVG for the blocks that photograph badly.
2. Block metadata sweep across 45 files: group, images, description, `disableBlockName`, row label.
3. Extract the shared `seo` and `cta` field factories with labels and help text authored once; apply across the 10 and 5+4+3 call sites respectively.
4. Label and help-text pass over the remaining 49 camelCase names.
5. `requiredWhen` audit across the 37 blocks not yet using it.
6. `_status` into `defaultColumns`; `adminThumbnail` function form; media picker verification. **No new `imageSize` is added** — the resolver returns the existing `mobile_webp` derivative, `null` for non-images.
7. Slug work: drop the redundant `required` so the auto-generation hook reaches the UI, tolerate empty in `validateSlug` on create, and add collision handling that rejects with the conflicting record's name plus an available alternative (FR-024a).
8. Page starter skeleton, mirroring the existing `caseStudySkeleton` pattern.
9. Collection/global `group` + `description`; dashboard grouping.

**Closing gates (both movements).** `visual:capture` diff over every public route at both viewports; full local E2E run (route-restructuring precedent: content Pages 404 in CI because CI reseeds fresh, so route-adjacent changes need a local full run before push); CI green.

## Risks

| Risk                                                                                                                                                                                                    | Mitigation                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Withdrawing Site Settings silently strips the `Organization` JSON-LD.** The spec as first written named two consumers; the code has seven — address, phone, email and three social profiles included. | Caught at clarification. `organizationLd` gets a golden-object test asserting all seven values survive relocation, and it runs before the global is deleted. This is the single highest-value gate in Movement A                  |
| The drop migration destroys prose that was never actually composed into blocks                                                                                                                          | Equivalence check gates the migration (Movement A step 1); it compares content, not row counts                                                                                                                                    |
| **No isolated environment to rehearse the drops in.** Staging was retired 2026-08-14, and the two remaining lanes share one stack and account.                                                          | The equivalence check plus a pre-migration DB snapshot of the target lane are the substitutes. Take the snapshot as an explicit, named step — not as an assumption that one exists                                                |
| `expertise` drop silently degrades JSON-LD                                                                                                                                                              | Caught in research R2; the field is promoted to visible before any drop runs, and `structured-data` keeps its consumer                                                                                                            |
| `buildMetadata` refactor changes metadata output on some route                                                                                                                                          | Full metadata assertion suite across all public routes runs before and after; `visual:capture` will not catch this, so it is an explicit test gate                                                                                |
| Gitignored content-drafts files break on the next seed                                                                                                                                                  | Local replay of every file is a merge gate (FR-029); those files are outside CI so this cannot be automated. `global-navigation` / `global-site-settings` request files are deleted outright                                      |
| 45 committed rasters bloat the repo                                                                                                                                                                     | 400 KB total budget against a measured ~340 KB, enforced by a check in the thumbnail tool; regeneration is an explicit command, not a build step                                                                                  |
| Block previews drift from what blocks render                                                                                                                                                            | They are derived from the live showcase render, so drift requires the showcase to be stale; regeneration is documented in quickstart                                                                                              |
| Deleting the globals discards their version history                                                                                                                                                     | Accepted deliberately. Only seven values were ever read and all seven already exist verbatim in code, so the versions record content that never reached a visitor. ADR 0010 carries the reversal path if chrome ownership changes |
