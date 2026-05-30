# Implementation Plan: Phase 2 — Content Models, Block Library & Editorial Workflow

**Branch**: `003-phase-2-content-models` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-phase-2-content-models/spec.md`

## Summary

Phase 2 turns the Phase 1 scaffold (Next 16 + React 19 + Payload 3.84 + Postgres + Lexical, validated by spike D-13) into a fully composable CMS. Concretely we ship: **13 collections + 3 globals** per `docs/ARCHITECTURE.md` §2; the **block library** (35+ layout blocks + 7 inline rich-text blocks) per `docs/BLOCK_LIBRARY.md` §5 driven by a single `RenderBlocks` dispatcher; **live preview** for `pages`/`posts`/`caseStudies`/`services`; **role-based access** (admin/editor/public) per `docs/ARCHITECTURE.md` §6 including draft filtering on public reads; **on-change revalidation** (Payload `afterChange` → `revalidateTag()` → targeted CloudFront path invalidation); a **scheduled-publish invariant** (`beforeChange` forces draft when `publishedAt` is in the future); **S3 storage adapter** for `media` with EC2 instance-profile credentials and local filesystem fallback; and an **idempotent seed script** at `src/payload/seed/migrateFromAudit.ts` that ingests the audit JSON per `docs/CONTENT_MIGRATION.md`.

**Technical approach**: lean on Payload v3's first-party primitives (`admin.livePreview`, `versions: { drafts: true }`, `BlocksFeature`, `beforeChange`/`afterChange` hooks, `@payloadcms/storage-s3`) rather than custom plumbing — spec 001's auth pivot already absorbed the "custom integration" cost; Phase 2's collections/blocks path is well-trodden Payload territory. The render side is one dispatcher + one inline-block JSX converter; no per-page glue. Editorial UX (preview, drafts, scheduled publish, role gating) flows through Payload's defaults plus a thin `/api/revalidate` handler. The seed script reuses the shared `editorConfig` so admin and seed produce structurally identical Lexical JSON.

## Technical Context

**Language/Version**: TypeScript 5.7 (`strict`, no `any`), Node ≥ 22.0.0, ES modules (`"type": "module"`).

**Primary Dependencies** (all already pinned in `package.json` unless noted):

- `next@^16.2.6`, `react@19.2.4`, `react-dom@19.2.4`
- `payload@^3.84.0`, `@payloadcms/next@^3.84.0`, `@payloadcms/db-postgres@^3.84.0`, `@payloadcms/richtext-lexical@^3.84.0`, `@payloadcms/ui@^3.84.0`
- `tailwindcss@^3.4.17` + `@tailwindcss/typography@^0.5.16`
- `sharp@0.34.2` (image processing for `media`)
- `jose@6.2.3` (already in use for spec 001 auth)
- **New dep**: `@payloadcms/storage-s3@^3.85` (FR-022; not yet installed — Payload first-party, mirrors `payload` minor)
- **New dep**: `@aws-sdk/client-cloudfront@^3` (FR-027; not yet installed — for path invalidations from the `afterChange` hook; uses EC2 instance-profile credential chain)
- **New dev dep candidate**: `slugify@^1` or equivalent (FR-003 slug auto-generation) — alternatively a 10-line inline helper; decide in Phase 0.

**Storage**: PostgreSQL 16 (Docker Compose locally, RDS in prod per spec 002). Payload's Postgres adapter manages schema; `push: true` is still on for staging bootstrap (per `src/payload.config.ts:47` comment) and flips off in Phase 5.5 once `payload migrate:create` is in routine use.

**Testing**:

- **Vitest 4** (`test:int`) with `@testcontainers/postgresql` — real Postgres per test run, not mocks. Coverage targets: access functions, `beforeChange`/`afterChange` hooks, `RenderBlocks` dispatcher unknown-type branch, seed-script upsert + slug rewrite + dry-run, `/api/revalidate` secret check.
- **Playwright 1.58** (`test:e2e`) — admin auth, draft→preview→publish for each of the four preview-supported collections, public draft-leak check per draftable collection, media upload + alt-required + CloudFront-path resolution (staging), end-to-end "compose a 3-block page and publish" mapped to SC-001/SC-012.
- **axe-core/Playwright** — admin authoring forms and a representative rendered page per block-category surface a11y violations.
- **Lighthouse CI** — accessibility / best-practices / SEO gate at ≥ 0.95 from day one (per Constitution II + ARCHITECTURE.md §7); perf stays warning until Phase 5.

**Target Platform**: Linux (Node 22 LTS on EC2 t3.medium in staging/prod per spec 002); evergreen browsers for the admin (Payload v3 supports Chromium/Firefox/Safari latest).

**Project Type**: Web application — Next.js App Router (frontend route group `(frontend)`, Payload route group `(payload)`) backed by Payload CMS embedded in the same Next process; SSR + ISR rendering with on-demand revalidation.

**Performance Goals** (Phase 2 doesn't tune these but mustn't regress them): a11y / best-practices / SEO ≥ 0.95 from day one; perf budgets staged as warnings (LCP < 2.0s mobile, TBT < 100ms, CLS = 0 — flip to errors in Phase 5).

**Vercel react-best-practices alignment** (audit run 2026-05-29 against Phase 1 scaffold, follow-ups land in Phase 10 Polish): four items captured — (1) `server-cache-react` + `server-hoist-static-io`: introduce `src/lib/payload.ts` with a module-level `getPayload` singleton + `React.cache()`-wrapped global readers (`getSiteSettings`, `getNavigation`, `getHomepage`) so Phase 3 page templates dedupe cross-component reads without per-page glue; (2) `rendering-resource-hints`: `<link rel="preconnect">` for `www.googletagmanager.com`, `js.hs-scripts.com`, `forms.hubspot.com` in `src/app/(frontend)/layout.tsx`; (3) remove `export const dynamic = 'force-dynamic'` from `src/app/(frontend)/page.tsx` once `revalidateOnChange` (T010) is wired — spike holdover; (4) `MobileNav` backdrop close moves from `useEffect`+`getBoundingClientRect` to inline `onClick` on the `<dialog>` (`rerender-move-effect-to-event`). Items 1 and 2 are load-bearing for Phase 3 (Spec 004) templates; 3 and 4 are cosmetic but cheap to clear here.

**Constraints**:

- Public repo: no secrets in git; pre-commit `gitleaks` + CI re-scan (Constitution IV).
- TypeScript `strict`, no `any`; ESLint + Prettier (Constitution Additional Constraints).
- Single Next.js process — Payload runs in-process; the `afterChange` hook calls `revalidateTag()` directly. CloudFront `CreateInvalidation` is issued from the same process via the EC2 instance profile (no static AWS credentials).
- CloudFront free-tier path budget: 1,000 paths/month. Per save, target ≤ 3 paths (detail + index + sitemap), batched where possible.
- Admin reachable only by `admin`/`editor` roles (FR-018). Public unauthenticated reads return only `_status: 'published'` (FR-016).

**Scale/Scope**: ~50–80 published documents at launch (8 case studies + 5–6 generic pages + 6 post stubs + 8–12 services + 3 pillars + 3 workshops + 4–6 industries + 4 locations + 5–10 team members + 10–15 testimonials + ~30–40 media); editorial throughput ≈ 5–10 saves/day across the team; ~30 page templates in Phase 3 will consume this content via the `RenderBlocks` dispatcher.

**Payload source surfaces read** (per Constitution v1.1.0 Principle I — plans against framework internals MUST enumerate the source files read):

- `node_modules/payload/dist/config/types.d.ts` — `LivePreviewConfig`, `RootLivePreviewConfig`, `AccessResult`, `Access`, `AccessArgs`.
- `node_modules/payload/dist/collections/config/types.d.ts` — `admin.livePreview`, `versions`/`IncomingCollectionVersions`/`IncomingDrafts`, `hooks.beforeChange`/`afterChange` typings, per-collection `access`.
- `node_modules/payload/dist/versions/types.d.ts` — drafts shape; the auto-injected `_status` field's typing path.
- `node_modules/payload/dist/versions/drafts/{replaceWithDraftIfAvailable,getQueryDraftsSelect,appendVersionToQueryKey}.d.ts` — draft-aware query helpers (used by the public render path when `draft: true` is intentionally requested under an authenticated session).
- `node_modules/payload/dist/uploads/types.d.ts` — `UploadConfig.adapter`, `disableLocalStorage`, `staticDir`.
- `node_modules/@payloadcms/richtext-lexical/dist/features/blocks/server/index.d.ts` — `BlocksFeature`, `BlocksFeatureProps` (`blocks` + `inlineBlocks`).
- `node_modules/@payloadcms/richtext-lexical/dist/features/blocks/server/nodes/BlocksNode.d.ts` — `ServerBlockNode` / `ServerInlineBlockNode` for the JSX converter contract.
- `node_modules/payload/dist/bin/generateImportMap/` — drives the `npm run generate:importmap` step that's load-bearing whenever a `richText`/client-component field is added (per `project_payload_importmap_gotcha`).
- `node_modules/payload/dist/auth/operations/access.d.ts` — `admin` access vs CRUD access split.

**Key contracts these source reads pinned down** (so the plan's estimate is grounded):

1. **Live preview** is per-collection `admin.livePreview = { url, breakpoints }`; the `url` is an async function returning the preview URL given the document — Payload pushes draft data into the iframe via `postMessage`.
2. **Drafts** are `versions: { drafts: true, maxPerDoc: N }` — Payload injects `_status: 'draft' | 'published'`. Draft queries require explicit `draft: true` on the request; public access functions can return `{ _status: { equals: 'published' } }` to filter without touching code paths elsewhere.
3. **`afterChange`** fires on every save, draft or publish. To restrict revalidation to "draft → published" or "published → published with content change," guard on `doc._status === 'published'`. Errors in the hook don't roll the mutation back — so the hook must be defensive (catch + log; never throw a revalidation failure back to the editor).
4. **`BlocksFeature`** is registered at the editor (feature) level, not the field level — `editorConfig` ships the canonical block list; individual `richText` fields can narrow it. Inline blocks (`inlineBlocks` prop) render in-flow.
5. **`@payloadcms/storage-s3`** is **not yet in `package.json`** — Phase 2 adds it. It plugs into a collection's `upload` config; AWS SDK credential chain auto-detects the EC2 instance profile when no static credentials are passed.
6. **importMap regeneration** is triggered by `npm run generate:importmap` (script already present at `package.json:14`). Phase 2 documents this as the required follow-up to any `richText`/client-component field change (FR-039).

## Constitution Check

_Gate evaluated against `.specify/memory/constitution.md` v1.1.0._

| Principle                                            | Result  | Notes                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Spec Before Code**                              | ✅ Pass | `spec.md` is the gate. Plan cites `ARCHITECTURE.md` §2/§3/§5/§6/§7, `BLOCK_LIBRARY.md` §1/§3/§5/§5.2/§6/§8/§9, and `CONTENT_MIGRATION.md` §1–§12 by section rather than re-deriving. Payload source files read are enumerated above per the v1.1.0 amendment.                                         |
| **II. Tests Gate Merge; Coverage Does Not**          | ✅ Pass | Each P1 user story gets at least one Vitest integration or Playwright E2E test (see Testing above). Access control + revalidation hooks + seed upserts are the load-bearing paths and get explicit coverage. No coverage-percentage gate proposed. Lighthouse a11y/SEO/best-practices stay at ≥ 0.95. |
| **III. Docs Are Code; Reconcile in the Same Commit** | ✅ Pass | Any divergence from `ARCHITECTURE.md` §2 or `BLOCK_LIBRARY.md` §5 lands as a doc update in the same PR (FR-001 / FR-007 / FR-012). ROADMAP §4 Phase 2 deliverables flip to PROJECT_HISTORY when shipped (not just checked off). ADR not currently anticipated — see Complexity Tracking.              |
| **IV. Security Baseline Is Non-Negotiable**          | ✅ Pass | Public read filtered to `_status: 'published'` (FR-016); `users` local-strategy stays disabled (FR-017, regression check); `/api/revalidate` requires shared secret. **Dep trust review** for the two new prod deps below. CI `npm audit --omit=dev --audit-level=high` gate continues to apply.      |
| **V. Bleeding-Edge Stack, Pinned and Defensive**     | ✅ Pass | All new versions track Payload's minor: `@payloadcms/storage-s3@^3.85` aligns with `payload@^3.84`. `@aws-sdk/client-cloudfront@^3` is mainline AWS. No upgrades to Next / React / Payload. Deprecation warnings (if any surface) are addressed in-PR per Constitution V.                             |

**Dep trust review (Constitution IV, new prod deps)**:

- `@payloadcms/storage-s3` — first-party Payload package, maintained by the Payload core team (same org as `payload`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical` all in use). Trust surface ≡ Payload itself. No separate bus-factor concern. `npm audit` clean expected at install.
- `@aws-sdk/client-cloudfront` — official AWS SDK v3 modular client. Trust surface ≡ AWS SDK itself (already transitively present via Payload's S3 ecosystem). No bus-factor concern.

Neither dep triggers the "prefer custom integration" guidance — both are first-party to their respective platforms and on the load-bearing path is conventional.

**Outcome**: **No violations**. Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-phase-2-content-models/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── render-blocks.md
│   ├── inline-block-converter.md
│   ├── revalidate-route.md
│   ├── seed-cli.md
│   ├── live-preview-urls.md
│   └── public-api-draft-filter.md
└── tasks.md             # Phase 2 output (/speckit-tasks command — NOT created here)
```

### Source Code (repository root)

The project is a single Next.js app with Payload embedded — Option 1 (single project) in template terms. Phase 2 adds a `src/payload/` subtree alongside the existing flat `src/collections/` directory (which stays as-is to avoid churning Phase 1 import paths). New collection files added by Phase 2 also land in `src/collections/` for consistency with the existing pattern.

```text
src/
├── app/                                  # Next.js App Router (existing)
│   ├── (frontend)/                       # Public site routes — Phase 3 fills these in
│   │   ├── layout.tsx                    # Existing
│   │   └── api/
│   │       └── revalidate/route.ts       # NEW — POST handler (FR-026 surface)
│   └── (payload)/                        # Payload admin + admin API (existing)
│       ├── admin/[[...segments]]/        # Existing
│       └── api/                          # Existing
├── collections/                          # Payload collection configs (existing pattern preserved)
│   ├── Users.ts                          # EXISTING — spec 001
│   ├── Media.ts                          # MODIFY — add S3 adapter wiring + size cap + alt validate
│   ├── Pages.ts                          # MODIFY — add status, slug, layout (blocks), live preview, hooks
│   ├── Posts.ts                          # NEW
│   ├── CaseStudies.ts                    # NEW
│   ├── Services.ts                       # NEW
│   ├── ServicePillars.ts                 # NEW
│   ├── TeamMembers.ts                    # NEW
│   ├── Testimonials.ts                   # NEW
│   ├── Workshops.ts                      # NEW
│   ├── Industries.ts                     # NEW
│   ├── Locations.ts                      # NEW
│   └── Categories.ts                     # NEW
├── globals/                              # NEW — Payload globals
│   ├── SiteSettings.ts
│   ├── Navigation.ts
│   └── Homepage.ts
├── payload/                              # NEW subtree for cross-cutting Payload code
│   ├── editor/
│   │   └── editorConfig.ts               # Shared Lexical config (FR-013) — exported for seed + admin
│   ├── blocks/                           # One file per block config (BLOCK_LIBRARY.md §9 rule 6)
│   │   ├── layout/                       # Layout blocks per BLOCK_LIBRARY.md §5.1–§5.6
│   │   │   ├── Hero.ts
│   │   │   ├── CaseStudyHero.ts
│   │   │   ├── Content.ts                # Holds the inline blocks via BlocksFeature inlineBlocks
│   │   │   ├── TwoColumn.ts
│   │   │   ├── ProcessSteps.ts
│   │   │   ├── … (≈30 more — full list in BLOCK_LIBRARY.md §5)
│   │   │   └── index.ts                  # Re-exports for payload.config.ts + RenderBlocks registry
│   │   └── inline/                       # Inline blocks per BLOCK_LIBRARY.md §5.2
│   │       ├── InlineCta.ts
│   │       ├── TestimonialEmbed.ts
│   │       ├── Callout.ts
│   │       ├── ImageWithCaption.ts
│   │       ├── Figure.ts
│   │       ├── QuotePullquote.ts
│   │       ├── Disclosure.ts
│   │       └── index.ts
│   ├── hooks/
│   │   ├── enforceDraftWhenScheduled.ts  # beforeChange (FR-028)
│   │   ├── revalidateOnChange.ts         # afterChange → revalidateTag + CloudFront (FR-026/FR-027)
│   │   └── slugFromTitle.ts              # beforeChange (FR-003)
│   ├── access/
│   │   ├── byRole.ts                     # Reusable admin/editor/public access helpers (FR-015)
│   │   └── publishedOrAuthed.ts          # The Where-clause builder for FR-016 draft filter
│   ├── livePreview/
│   │   └── url.ts                        # admin.livePreview.url builder for the 4 preview collections (FR-019)
│   ├── storage/
│   │   └── s3.ts                         # @payloadcms/storage-s3 wiring (FR-022/FR-024/FR-025)
│   └── seed/
│       ├── migrateFromAudit.ts           # CLI entry (FR-029)
│       ├── parsers/                      # Per-collection audit→Payload mappers (CONTENT_MIGRATION.md §3)
│       │   ├── caseStudies.ts
│       │   ├── pages.ts
│       │   ├── posts.ts
│       │   ├── homepage.ts
│       │   └── siteSettings.ts
│       ├── upsert.ts                     # Idempotent upsert-by-slug helper (FR-030)
│       ├── slugRewrites.ts               # INTEGRATIONS.md §9 redirect map constant (FR-031)
│       ├── htmlToLexical.ts              # Heuristic transformer per CONTENT_MIGRATION.md §4
│       └── log.ts                        # migration-errors.log writer (FR-032)
├── components/                           # React components
│   ├── admin/                            # Existing (spec 001 login UI)
│   ├── integrations/                     # Existing
│   ├── layout/                           # Existing
│   ├── sections/                         # NEW — one file per layout block renderer
│   │   ├── RenderBlocks.tsx              # The dispatcher (FR-010)
│   │   ├── Hero.tsx
│   │   ├── CaseStudyHero.tsx
│   │   ├── … (one per layout block in src/payload/blocks/layout)
│   │   └── registry.ts                   # blockType → component map
│   ├── richText/
│   │   ├── RichText.tsx                  # Lexical → JSX converter (server)
│   │   └── inline/                       # One renderer per inline block
│   │       ├── InlineCta.tsx
│   │       ├── Callout.tsx
│   │       └── …
│   └── ui/                               # Existing primitives
├── lib/                                  # Existing
│   ├── auth/                             # Existing (spec 001)
│   ├── cloudfront/
│   │   └── invalidate.ts                 # NEW — thin wrapper around @aws-sdk/client-cloudfront (FR-027)
│   └── site-content.ts                   # Existing placeholder — replaced/updated by Phase 2 globals
├── migrations/                           # Existing Payload migrations
├── payload-types.ts                      # Auto-regenerated via `npm run generate:types` (FR-038)
├── payload.config.ts                     # MODIFY — register collections, globals, editor, plugins[storage-s3]
└── proxy.ts                              # Existing (CSP)

tests/
├── int/                                  # Vitest integration tests against real Postgres
│   ├── collections/
│   │   ├── access.test.ts                # SC-005 — role × op × collection matrix
│   │   ├── draftLeak.test.ts             # SC-006 — public draft-leak check per draftable collection
│   │   ├── slugFromTitle.test.ts
│   │   └── enforceDraftWhenScheduled.test.ts
│   ├── seed/
│   │   ├── upsertIdempotency.test.ts     # SC-004
│   │   ├── slugRewrites.test.ts          # FR-031
│   │   ├── dryRun.test.ts                # FR-033
│   │   └── migrationErrorsLog.test.ts    # SC-011
│   ├── hooks/
│   │   └── revalidateOnChange.test.ts    # Hook calls revalidateTag + invalidate with expected paths
│   └── render/
│       └── renderBlocksUnknownType.test.ts
├── e2e/                                  # Playwright
│   ├── authoring/
│   │   ├── composeThreeBlockPage.spec.ts # SC-001 / SC-012
│   │   └── inlineBlocksInRichText.spec.ts
│   ├── preview/
│   │   ├── pagesPreview.spec.ts          # SC-003
│   │   ├── postsPreview.spec.ts
│   │   ├── caseStudiesPreview.spec.ts
│   │   └── servicesPreview.spec.ts
│   ├── publish/
│   │   └── revalidationOnPublish.spec.ts # SC-007 (staging)
│   ├── media/
│   │   └── altRequired.spec.ts           # FR-023 + SC-010
│   └── auth/
│       └── firstSignInBootstrap.spec.ts  # SC-009
└── a11y/                                 # axe-core via Playwright assertions
    └── adminAuthoring.spec.ts
```

**Structure Decision**:

- **Single Next.js project** with Payload embedded — confirmed by Phase 1; no monorepo or backend split.
- **`src/payload/`** holds cross-cutting Payload code (blocks, hooks, access helpers, seed, storage adapter wiring, livePreview URL builder, editorConfig). This matches the spec's explicit path mentions (`src/payload/blocks/`, `src/payload/seed/migrateFromAudit.ts`) and the "tooling in subdirectories" Additional Constraint.
- **`src/collections/`** stays as the home for collection configs (consistent with the existing `Users.ts`, `Media.ts`, `Pages.ts` pattern from Phase 1; not moved to `src/payload/collections/` to avoid churning the spec 001 import path in `payload.config.ts`).
- **`src/components/sections/`** holds block renderers + the `RenderBlocks` dispatcher (spec's "Block" entity definition).
- **`src/components/richText/`** holds the Lexical→JSX converter + the inline-block renderers.
- **`tests/`** mirrors the spec's user stories — every P1 story gets at least one integration or E2E test (Constitution II).

## Complexity Tracking

> No constitutional violations identified. Section intentionally empty.
