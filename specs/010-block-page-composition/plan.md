# Implementation Plan: Block-composed pages (two content primitives)

**Branch**: `feat/010-block-page-composition` | **Date**: 2026-06-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-block-page-composition/spec.md`; implements ADR [`docs/decisions/0009-block-first-composition.md`](../../docs/decisions/0009-block-first-composition.md).

## Summary

Retire every bespoke per-type render template and collapse the site to two content primitives: **Page** (a `layout` blocks array rendered by `RenderBlocks` — the proven Shape A already used by `/about`) and **Post** (the blog, the single sanctioned rich-text article template, untouched here). Each specialized type (workshops, case studies, services, team) keeps its collection and typed metadata (slug, listing image, order, SEO, relationships) but trades its discrete richText/array **body** fields for a `layout` blocks array. After this, rearranging/swapping/enriching any page is a content edit with no deploy; the only change requiring code is creating or fixing a **block type**.

Technical approach: extend the existing block library to close its gaps (`image` + `gallery` blocks per the FR-005 audit), make the cross-cutting wiring (live preview, cache-tag parity per ADR 0005, sitemap, draft) type-generic, then migrate one type per phase (workshops → case studies → services → team → homepage). Each migration is two coordinated changes: a Payload DB migration that adds the `layout` blocks tables (expand/contract — old body columns are hidden, kept one release, dropped in a follow-up migration), and an idempotent, slug-keyed content composer (an extension of the seed/upsert tooling) that transforms each record's previously published discrete fields into an equivalent block layout with full fidelity. Two skills (authoring + conversion) and a documented block-curation loop make the model usable at speed.

## Technical Context

**Language/Version**: TypeScript (strict, no `any`), Next.js 16 + React 19 (App Router), Payload CMS v3.84+, Tailwind v3, Lexical. Versions are load-bearing (Constitution V) — no bumps in this feature.

**Primary Dependencies**: Payload `blocks` field + `RenderBlocks` dispatcher; `@payloadcms/db-postgres` migrations; `unstable_cache` + `React.cache` + `withReadTimeout` reader stack; `draftMode()` live preview; existing 43-block library. **No new runtime dependencies** (Constitution IV dep-trust review therefore N/A).

**Storage**: PostgreSQL (Payload-owned schema; migrations under `src/migrations/`, run via `payload migrate`, not drizzle-kit push). Media on S3 + CloudFront (ADR 0008).

**Testing**: Vitest integration (`tests/int/**`, single-worker testcontainer Postgres), Playwright E2E (`tests/e2e/**`), axe-core a11y, Lighthouse (a11y/best-practices/SEO ≥ 0.95), the `npm run visual:capture` harness. Per Constitution II every user story ships a load-bearing test; all paths here are in-repo code, so **no external-verification carve-out is claimed**.

**Target Platform**: Linux server (EC2 + ALB + CloudFront), staging at `seqtek-preview.com`.

**Project Type**: Web application — Next.js + embedded Payload, single repo.

**Performance Goals**: No regression to ISR/cache behavior (ADR 0005); reads stay within the 5s `withReadTimeout` budget; Lighthouse a11y/best-practices/SEO budgets gate from day one (Constitution II).

**Constraints**: Cache-tag parity invariant C1 (`tests/int/lib/payload-cache-tags.int.spec.ts`) must continue to hold; the access-matrix invariant (`tests/int/collections/access.int.spec.ts`) must continue to hold; JSON-LD stays nonce-safe (`JsonLd.tsx`, Constitution IV); reading-column rule (DESIGN_SYSTEM §11.4) enforced centrally in blocks (FR-009); no em dashes in public copy.

**Scale/Scope**: 4 specialized collections + 1 global migrated; ~5 records/type today; 2 new blocks; 2 skills; 1 curation-loop doc. Each phase independently shippable (FR-013).

**Framework-internal source files read at plan time** (Constitution I — "Plans against framework internals MUST enumerate the source files read"):

- `src/collections/Pages.ts` — the `layout` blocks field config to replicate (incl. `versions.drafts`, `livePreviewFor('pages')`).
- `src/payload/blocks/layout/index.ts` — the assembled blocks array (43 blocks) attached to `Pages.layout`.
- `src/components/sections/registry.ts` + `src/components/sections/RenderBlocks.tsx` — slug→component dispatch; null/empty → `<></>`; unknown blockType → silent in prod, warn-once in dev (the resilience contract behind edge cases in spec §Edge Cases).
- `src/lib/payload.ts` — `withReadTimeout(React.cache(unstable_cache(...)))` reader stack; `detailCacheTags`/`listCacheTags`/`globalCacheTags`; `publishedSlugsFor`; `draft:false, overrideAccess:false`.
- `src/payload/hooks/revalidateOnChange.ts` — `buildRevalidatePlan` (tags + CloudFront paths); services pillar-slug enrichment + pillar-move dual invalidation.
- `src/payload/livePreview/url.ts` — `PREVIEW_COLLECTIONS` (currently `pages|posts|caseStudies|services` — **workshops and teamMembers are absent and must be added**), `publicPathFor`, `livePreviewFor`, cookie-gated (no secret in URL).
- `src/lib/preview.ts` — `getDraftBySlug` (bypasses `unstable_cache`, `draft:true, overrideAccess:true`); the "cached read first, then `draftMode()`" ordering that avoids `DYNAMIC_SERVER_USAGE`.
- `src/migrations/20260612_233107_add_video_embed_eyebrow.ts` — the canonical add-block-column migration shape: raw `sql` ALTER against **both** `<collection>_blocks_*` and `_<collection>_v_blocks_*` (versions) tables. Adding a `layout` array generates a family of `<collection>_blocks_*` + `_<collection>_v_blocks_*` tables — a substantial generated migration per type.
- `src/payload/seed/upsert.ts`, `migrateFromAudit.ts`, `showcase/index.ts`, `showcase/fixtures.ts`, `showcase/lexical.ts`; `docs/content-drafts/seed-about-api.mts` — the idempotent slug-keyed compose-a-`layout` pattern (Local API + `overrideAccess`, `draft:true` so required-field gaps log rather than fail) the field→block composer extends.

## Constitution Check

_GATE: evaluated against `.specify/memory/constitution.md` v1.2.0. Re-checked after Phase 1 design — still passing._

- **I. Spec Before Code** — PASS. Spec + ADR 0009 exist; this plan cites canonical docs by section (BLOCK_LIBRARY §5/§6/§8, DESIGN_SYSTEM §11.4, PAYLOAD_DEVELOPMENT §6, ARCHITECTURE §2/§3/§14, CONTENT-REQUIREMENTS §8, ADR 0005) rather than re-deriving; framework-internal files read are enumerated above. Doc gaps fixed in the same change (BLOCK_LIBRARY new blocks + curation loop; DESIGN_SYSTEM §11.4 reconciled to "lives in blocks").
- **II. Tests Gate Merge** — PASS. Each user story ships a Vitest/Playwright test on its load-bearing path (US→test map in [quickstart.md](./quickstart.md)); the cache-tag-parity and access-matrix keystone tests are extended, not weakened. No coverage padding. No external-verification carve-out claimed (all paths in-repo). Migration fidelity is asserted by an idempotency + field→block round-trip integration test (SC-003).
- **III. Docs Are Code** — PASS. BLOCK_LIBRARY.md gains the `image`/`gallery` blocks and the block-curation loop (FR-011) and is reconciled to 45 blocks; DESIGN_SYSTEM §11.4 reconciled to centralized-in-blocks enforcement (FR-009); ARCHITECTURE §2 content-model section updated; ROADMAP item moved to PROJECT_HISTORY on ship (not checkbox-flipped); decisions trace to ADR 0009.
- **IV. Security Baseline** — PASS. No new runtime deps (dep-trust review N/A); no new third-party scripts; JSON-LD stays nonce-safe via `JsonLd.tsx`; `image`/`gallery` blocks reuse the existing Media collection + CloudFront serving + alt-text requirement; no secrets touched; gitleaks unaffected.
- **V. Bleeding-Edge, Pinned** — PASS. No version bumps; schema evolves only via `payload migrate`; no new deprecation warnings introduced.

**Result: no violations. Complexity Tracking left empty.** The deliberate carry of hidden-but-not-dropped body columns for one release is the standard expand/contract migration pattern (data-fidelity safety net), not a constitution deviation.

## Project Structure

### Documentation (this feature)

```text
specs/010-block-page-composition/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions (collections-vs-fold, expand/contract, gap-fill, skeleton, skills)
├── data-model.md        # Phase 1 — per-type field changes, new blocks, homepage global, migration tables
├── quickstart.md        # Phase 1 — per-phase verification recipe + US→test map
├── contracts/           # Phase 1 — migration-fidelity, render-and-cache invariants, the two skill IO contracts
│   ├── migration-fidelity.md
│   ├── render-and-cache.md
│   ├── authoring-skill.md
│   └── conversion-skill.md
├── checklists/
│   └── requirements.md  # (exists, all green)
└── tasks.md             # Phase 2 — created by /speckit-tasks, NOT here
```

### Source Code (repository root)

```text
src/
├── payload/
│   ├── blocks/layout/
│   │   ├── Image.ts                 # NEW — single-image/figure block (gap-fill)
│   │   ├── Gallery.ts               # NEW — multi-image gallery block (gap-fill)
│   │   └── index.ts                 # register Image, Gallery
│   ├── seed/
│   │   ├── compose/                 # NEW — field→layout composers, one per type, idempotent by slug
│   │   │   ├── workshopToLayout.ts
│   │   │   ├── caseStudyToLayout.ts
│   │   │   ├── serviceToLayout.ts
│   │   │   ├── teamMemberToLayout.ts
│   │   │   └── homepageToLayout.ts
│   │   └── skeletons/               # NEW — default block skeletons (defaultValue source) per type
│   ├── livePreview/url.ts           # EDIT — add 'workshops','teamMembers' to PREVIEW_COLLECTIONS + path builders
│   └── hooks/revalidateOnChange.ts  # (unchanged contract; verify team/workshop tags+paths)
├── collections/
│   ├── Workshops.ts                 # EDIT — add layout(+skeleton)+livePreview; deprecate body fields
│   ├── CaseStudies.ts               # EDIT — add layout(+skeleton); deprecate body fields
│   ├── Services.ts                  # EDIT — add layout(+skeleton); deprecate body fields
│   └── TeamMembers.ts               # EDIT — add layout(+skeleton)+versions/drafts+livePreview; deprecate body fields
├── globals/Homepage.ts              # EDIT — add layout; deprecate discrete section fields (Phase F)
├── components/sections/
│   ├── Image.tsx                    # NEW render component
│   ├── Gallery.tsx                  # NEW render component
│   └── registry.ts                  # EDIT — register image, gallery
├── app/(frontend)/
│   ├── workshops/[slug]/page.tsx    # EDIT — body → <RenderBlocks/>; keep metadata/JSON-LD/draft
│   ├── case-studies/[slug]/page.tsx # EDIT — body → <RenderBlocks/>
│   ├── services/[pillar]/[slug]/page.tsx # EDIT — body → <RenderBlocks/>; preserve nested URL/breadcrumb
│   ├── team/[slug]/page.tsx         # NEW — block-composed team detail + Person JSON-LD
│   ├── team/page.tsx                # EDIT — link cards to /team/[slug]
│   └── page.tsx                     # EDIT (Phase F) — homepage via <RenderBlocks/>
├── lib/
│   ├── payload.ts                   # EDIT — add getWorkshopBySlug already exists; add getTeamMemberBySlug; ensure detail readers return layout
│   └── structured-data.ts           # EDIT — add personLd(member)
└── migrations/
    ├── <ts>_add_layout_workshops.ts        # NEW (Payload-generated) per type
    ├── <ts>_add_layout_case_studies.ts
    ├── <ts>_add_layout_services.ts
    ├── <ts>_add_layout_team_members.ts
    ├── <ts>_add_layout_homepage.ts
    └── <ts>_drop_legacy_body_columns.ts    # NEW — contract step, follow-up release

.claude/skills/
├── compose-page/SKILL.md            # NEW — authoring skill (FR-010, US3)
└── convert-to-blocks/SKILL.md       # NEW — conversion skill (FR-014, US6)

tests/
├── int/seed/composeFidelity.int.spec.ts   # NEW — field→layout fidelity + idempotency (SC-003)
├── int/blocks/imageGallery.int.spec.ts     # NEW — new blocks render + registry coverage
├── int/lib/payload-cache-tags.int.spec.ts  # EXTEND — workshops/team tag parity (C1)
├── int/collections/access.int.spec.ts      # EXTEND — teamMembers now draftable tier
└── e2e/visual/pages.e2e.spec.ts            # EDIT — add /team/[slug]; verify migrated detail routes
```

**Structure Decision**: Single Next.js + Payload app (existing layout). Specialized types **stay as collections** ("Page + metadata") rather than folding into `pages`, to preserve typed listings, relationships, nested URLs, and per-type SEO/JSON-LD (research.md R1). The block library is the single place layout lives; `RenderBlocks` is the single render path for every non-blog page.

## Phasing (FR-013 — each independently shippable)

- **Phase A — Foundation (no type migrated yet).** Build `image` + `gallery` blocks (FR-005) and run the full block-coverage audit against the retired templates (SC-005). Move reading-column enforcement fully into the block components and reconcile DESIGN_SYSTEM §11.4 (FR-009). Make wiring type-generic: add `workshops`/`teamMembers` to `PREVIEW_COLLECTIONS` + `publicPathFor`; confirm sitemap/cache-tag/revalidate cover every migrated detail route. Add the field→layout composer scaffold + its fidelity/idempotency test. Gate: showcase + visual capture of new blocks; cache-tag parity green.
- **Phase B — Workshops pilot (US1/P1).** The acceptance gate for the whole feature. Add `layout` + default skeleton + draft/live-preview to Workshops; compose `description/format/audience/deliverables/photos/video/facilitator/testimonial` → blocks (gallery for photos, video-embed, deliverables, testimonial-block, content); switch `/workshops/[slug]` body to `RenderBlocks`; hide legacy body columns. Verify reorder-without-deploy, listing + JSON-LD + redirect parity.
- **Phase C — Case studies (US2/P2).** `case-study-hero` + `content`(problem/solution/impact) + `metric-display`/`stats-bar` (metrics) + `tech-stack` (technologies) + `key-takeaways` + `testimonial-block`. Preserve case-study grid/listing + breadcrumb.
- **Phase D — Services (US2/P2).** `content`(description/approach) + `deliverables` + `faq`. Preserve nested `/services/[pillar]/[slug]`, breadcrumb, and the pillar-move dual revalidation.
- **Phase E — Team (US2/P2).** Add `layout` + default skeleton + **versions/drafts + live-preview** to teamMembers (today non-versioned); build block-composed `/team/[slug]` detail + `personLd`; compose `bio/expertise/certifications/education/personalFacts/quote` → blocks; preserve `/team` listing.
- **Phase F — Homepage (US5/P3).** Add `layout` to the Homepage global; compose `hero/stats/featuredCaseStudy/brandTeaser/clientLogos/featuredTestimonials` → blocks; render `/` via `RenderBlocks`; preserve Organization JSON-LD + analytics signals.
- **Phase G — Skills + curation loop (US3/US4/US6).** Ship the `compose-page` authoring skill (FR-010), the `convert-to-blocks` conversion skill (FR-014), and document the block-curation loop in BLOCK_LIBRARY.md (FR-011).
- **Contract step (follow-up release).** `drop_legacy_body_columns` migration once each migrated type has soaked one release (expand/contract close-out; research.md R2).

## Complexity Tracking

> No constitution violations to justify. (Left intentionally empty.)
