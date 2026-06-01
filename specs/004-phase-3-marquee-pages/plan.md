# Implementation Plan: Phase 3 — Public Render Foundation + Marquee Pages

**Branch**: `feat/004-phase-3-marquee-pages` | **Date**: 2026-05-31 | **Spec**: [`spec.md`](./spec.md)

**Input**: Feature specification from `specs/004-phase-3-marquee-pages/spec.md`

## Summary

Spec 003 shipped the content infrastructure (13 collections + 3 globals, 43 layout-block React renderers, the `RenderBlocks` dispatcher, live preview, the `revalidateOnChange` hook, and `src/lib/payload.ts` cached readers) but left `src/app/(frontend)/page.tsx` as the spike-era "No page yet" placeholder and shipped **no** public templates for the collection routes. Spec 004 builds the public render layer on top of that infrastructure and ships the first round of marquee content (homepage, one flagship case study, team, Touchstone AI workshop, localshoring).

**Technical approach** (validated against the installed Next 16.2.6 / Payload 3.85 source — see Technical Context):

1. **ISR + tag-coherent caching.** Every public route sets `export const revalidate = 3600` (ARCHITECTURE.md §3 fallback) and reads Payload through `unstable_cache`-wrapped readers in `src/lib/payload.ts` whose `tags` array **exactly mirrors** `buildRevalidatePlan`'s output (`${collection}_${slug}`, `${collection}_list`). The `revalidateOnChange` hook already calls `revalidateTag(...)` with those tags — but `revalidateTag` only invalidates tagged caches, and the Payload Local API queries Postgres directly (no `fetch`), so today's `React.cache`-only readers are **not** wired to it. Closing that gap is the load-bearing technical work of this spec.
2. **Two render shapes.** Layout-bearing surfaces (`pages`, which carry a `layout` blocks array) render through `RenderBlocks`. Structured collections (`caseStudies`, `services`, `workshops`) and the `homepage` global render through bespoke templates that compose the existing `src/components/sections/*` components from their structured fields.
3. **Draft preview.** Templates branch on `draftMode().isEnabled`: published → the `unstable_cache` reader; draft → a direct Payload read with `draft: true` (the `/preview/[collection]/[slug]` route already authenticates and enables draft mode). `unstable_cache` auto-bypasses under draft mode, so there is no stale-cache risk, but the explicit `draft` arg is still required to lift the published-status filter.
4. **Dynamic params.** Collection detail routes use `generateStaticParams` (prebuild published slugs) + `dynamicParams = true` so newly-published docs render on-demand instead of 404-ing; `notFound()` for unresolved slugs.
5. **Metadata + structured data.** `generateMetadata` per route from each doc's `seo` group with `siteSettings` fallbacks; JSON-LD (`Organization`, `Article`, `BreadcrumbList`) via `src/lib/structured-data.ts`; OG via `src/lib/metadata.ts`.
6. **301 redirects + error/maintenance pages.** `async redirects()` in `next.config.ts` sourced from INTEGRATIONS.md §9; `not-found.tsx` / `error.tsx` / `global-error.tsx` per ERROR_PAGES.md; maintenance short-circuit + `x-request-id` in `src/proxy.ts`.

This spec **consumes** the block library and revalidate hook; it does not extend them unless a marquee page surfaces a genuine block gap (BLOCK_LIBRARY.md §5.7 confirms none for the in-scope pages).

## Technical Context

**Language/Version**: TypeScript 5.x (strict, no `any`), Next.js 16.2.6 (App Router, RSC), React 19.2.4, Node 22.

**Primary Dependencies**: Payload 3.85 Local API (`getPayload`, `find`/`findGlobal` with `draft`), `@payloadcms/next` 3.85, `@payloadcms/db-postgres`, `next/cache` (`unstable_cache`, `revalidateTag`), `next/headers` (`draftMode`), Tailwind v3, Lexical. **No new runtime dependencies anticipated** — the render layer is built entirely from existing block renderers + Next/Payload primitives. If a marquee page surfaces a need on the public-render path (e.g. a client-side carousel lib), it triggers the Constitution §IV dependency-trust review at that point, not pre-emptively.

**Storage**: PostgreSQL 18 (Payload, Drizzle). Media via S3 (`@payloadcms/storage-s3`) — **prereq US6 (spec 003) must ship before bulk team-photo ingest**; route templates do not block on it (they render whatever media exists).

**Testing**: Vitest integration (route handlers, `unstable_cache` reader tag-parity against `buildRevalidatePlan`, redirect-map shape, `generateStaticParams` output, `notFound` paths); Playwright E2E + axe-core (each marquee page renders 200 with real blocks; the admin→preview→public draft round-trip); Lighthouse CI (a11y / best-practices / SEO ≥ 0.95 gate from day one; Performance staged as `warn` per Constitution §II until Phase 5).

**Target Platform**: Linux EC2 behind ALB + CloudFront; ISR cache persisted to instance disk; on-demand revalidation in-process via the afterChange hook + targeted CloudFront invalidation.

**Project Type**: Web application — Next.js 16 App Router with embedded Payload CMS (single deployable).

**Performance Goals** (ARCHITECTURE.md §7): Mobile LCP < 2.0s, Desktop LCP < 500ms, TBT < 100ms, CLS 0, Lighthouse Performance 95+. Per Constitution §II the Performance/LCP/TBT/CLS budgets stay `warn` until Phase 5; a11y / best-practices / SEO gate at ≥ 0.95 now.

**Constraints**: ISR strategy per ARCHITECTURE.md §3 (revalidate 3600 + on-demand tag invalidation); draft preview must bypass cache (verified below); reader cache tags MUST stay identical to `buildRevalidatePlan` output (drift = silent stale pages); no em dashes in public-facing copy (project convention); CSP nonce propagation for any newly-activated third-party script (HubSpot form) per Constitution §IV + INTEGRATIONS.md §8.

**Scale/Scope**: ~5 marquee pages over ~11 route templates (homepage; generic `pages`; 4 collection detail routes — caseStudies, posts/insights, services, workshops; 4–5 listing routes — case-studies, insights, services, team, touchstone-workshops; error/maintenance). ~6 new cached readers, 2 metadata/JSON-LD helpers, 1 redirect map, proxy additions. Estimated ~12–16 new files under `src/app/(frontend)` + `src/lib`.

**Framework-internals source files read at plan time** (Constitution §I — "plans against framework internals MUST enumerate the source files read"):

- `node_modules/next/dist/server/web/spec-extension/unstable-cache.js` — confirmed `unstable_cache` guards **both** the cache read (line 146: `… && !workStore.isDraftMode`) and the cache write (line 207: `if (!workStore.isDraftMode)`) on draft mode. It also raises the route's `revalidate` to the option value and collects `tags` onto the work-unit store (lines 113–122). **Design consequence**: draft preview never serves or pollutes the published cache, but the wrapped reader still applies its own published filter, so templates must pass `draft: true` explicitly when `draftMode().isEnabled`.
- `node_modules/next/dist/server/request/draft-mode.js` — `draftMode()` async accessor; enabling it opts the route into dynamic rendering and sets `private, no-cache, no-store` response headers (corroborated by Next docs via context7).
- `node_modules/payload/dist/collections/operations/find.d.ts` — Local API `find` accepts `draft?: boolean`; confirms the published-vs-draft toggle the templates depend on.
- `next/cache` runtime exports (verified empirically): `unstable_cache`, `revalidateTag`, `revalidatePath`, `cacheTag`, `cacheLife` (+ `unstable_*` variants) are all present in 16.2.6 — i.e. both the stable `unstable_cache` model and the newer `'use cache'` Cache Components model are available. Decision to use `unstable_cache` is recorded in research.md §D1 (and is an ADR candidate).
- In-repo contracts read: `src/payload/hooks/revalidateOnChange.ts` (`buildRevalidatePlan` tag/path map), `src/lib/payload.ts` (existing readers), `src/app/(frontend)/showcase/[slug]/page.tsx` (the working `draftMode` + `RenderBlocks` reference template), `src/payload/livePreview/url.ts` (public-path builders), `src/app/(frontend)/preview/[collection]/[slug]/route.ts` (draft-mode enabler), `src/globals/Homepage.ts` (structured-field shape, no `layout` array).

## Constitution Check

_GATE: evaluated against `.specify/memory/constitution.md` v1.1.0. Re-checked after Phase 1 design — still passing._

### I. Spec Before Code — PASS

Spec exists (`spec.md`). This plan cites canonical docs by section (ARCHITECTURE §3/§7, ERROR_PAGES, INTEGRATIONS §8/§9, BLOCK_LIBRARY §5.7/§6, DESIGN_SYSTEM) rather than re-deriving. Framework-internals source files enumerated above per the §I "read the source" mandate — the load-bearing unknown (does `unstable_cache` bypass under draft mode?) was resolved from source, not guessed, before the template design was settled.

### II. Tests Gate Merge; Coverage Does Not — PASS

Each user story ships ≥1 integration or E2E test on the load-bearing path (see research.md §Testing strategy and the per-US mapping in data-model.md §4):

- US1 homepage: E2E `GET /` 200 renders homepage-global sections (no placeholder); integration test that the homepage reader's cache tags equal `buildRevalidatePlan('homepage', …).tags`.
- US2 case study: E2E `/case-studies/[slug]` renders structured fields; integration `generateStaticParams` returns published slugs only.
- US3 team: E2E `/team` renders `TeamGrid` with real members.
- US4 workshop: E2E `/touchstone-workshops/[slug]` renders + the placeholder `hubspot-form` block mounts (live submission deferred, research §D10).
- US5 localshoring: E2E page renders comparison-table narrative.
- Cross-cutting: redirect-map integration test (old Wix slug → 301 → canonical); `notFound()` path test; preview round-trip E2E. Performance budgets stay `warn` (Constitution §II); a11y/bp/SEO gate now.

### III. Docs Are Code; Reconcile in the Same Commit — PASS (with required reconciliations tracked)

This spec uncovered three doc/code drifts that MUST be reconciled in the same commits that touch them (enumerated in research.md §Drift register):

1. **Services URL** — `revalidateOnChange.ts` emits flat `/services/${slug}`; data-model.md §1.5 and ARCHITECTURE §3 + the live-preview builder say nested `/services/${pillar}/${slug}`. Resolution: nested wins (services.pillar is required). The hook's `services` case is corrected in the same PR as the services route.
2. **Homepage source** — `(frontend)/page.tsx` queries `pages` slug `home`; the `homepage` global is the real source. Resolution: drive `/` from the global; retire the placeholder + the `pages`-slug-`home` query.
3. **Spike route placeholders** — `/about/[slug]`, `/services/[slug]` placeholders predate the final IA; reconciled when the real routes land.

ROADMAP Phase 2 items closed by PR #19 (US6/US7/Polish) move to PROJECT_HISTORY per §III when this branch updates the roadmap (separate bookkeeping, noted so it isn't lost).

### IV. Security Baseline Is Non-Negotiable — PASS

No new runtime dependencies (no dep-trust review triggered). The `/preview` route is already editorial-auth-gated. **No newly-activated third-party surface in spec 004** — the US4 workshop form stays the Phase-2 placeholder (research §D10, confirmed 2026-05-31); the live HubSpot Forms API (and its nonce + consent wiring per INTEGRATIONS.md §8/§1.2) is a deferred follow-up. Redirect map carries no secrets. CSP stays report-only (Constitution §IV; enforce is Phase 5).

### V. Bleeding-Edge Stack, Pinned and Defensive — PASS

Uses the **stable** `unstable_cache` tag model, not the newer `'use cache'` Cache Components (`cacheComponents`/`dynamicIO`) model — the latter is unvalidated against Payload's Local API in this stack and would be a config-level change to rendering semantics. Rationale + revisit trigger recorded in research.md §D1 → ADR 0004 candidate. No Next/Payload version bump. Any deprecation surfaced during implementation is migrated same-change per §V.

**Result: no Constitution violations. Complexity Tracking below is empty.**

## Project Structure

### Documentation (this feature)

```text
specs/004-phase-3-marquee-pages/
├── spec.md              # Feature spec (pre-existing stub, expanded by /speckit-specify if run)
├── plan.md              # This file
├── research.md          # Phase 0 — decisions D1–D10 + drift register
├── data-model.md        # Phase 1 — route↔collection map, render shapes, cache-tag contract
├── quickstart.md        # Phase 1 — run/verify the render layer locally
├── contracts/           # Phase 1 — route-render, cached-readers, redirect-map, error-pages, metadata-jsonld
└── tasks.md             # Phase 2 — created by /speckit-tasks (NOT this command)
```

### Source Code (repository root)

```text
src/
├── app/(frontend)/
│   ├── page.tsx                       # REPLACE spike placeholder → homepage global template
│   ├── layout.tsx                     # (exists) shared chrome; minor head/metadata touch-ups
│   ├── not-found.tsx                  # NEW — 404 (ERROR_PAGES §2)
│   ├── error.tsx                      # NEW — 500 route boundary (ERROR_PAGES §3)
│   ├── global-error.tsx               # NEW — root 500 (ERROR_PAGES §3)
│   ├── [slug]/page.tsx                # NEW — generic `pages` render via RenderBlocks
│   ├── case-studies/
│   │   ├── page.tsx                   # NEW — listing
│   │   └── [slug]/page.tsx            # NEW — detail (structured template)
│   ├── insights/
│   │   ├── page.tsx                   # NEW — listing (posts)
│   │   └── [slug]/page.tsx            # NEW — detail (richText + inline blocks)
│   ├── services/
│   │   ├── page.tsx                   # NEW — overview
│   │   └── [pillar]/
│   │       ├── page.tsx               # NEW — pillar listing
│   │       └── [slug]/page.tsx        # NEW — service detail (nested URL — see research §D4)
│   ├── touchstone-workshops/
│   │   ├── page.tsx                   # NEW — listing
│   │   └── [slug]/page.tsx            # NEW — workshop detail (US4)
│   ├── team/page.tsx                  # NEW — team listing (US3)
│   ├── showcase/[slug]/page.tsx       # (exists) reference demo — keep or retire post-parity
│   ├── preview/[collection]/[slug]/route.ts   # (exists) draft-mode enabler
│   └── api/revalidate/route.ts        # (exists)
├── lib/
│   ├── payload.ts                     # EXTEND — unstable_cache readers tagged to buildRevalidatePlan
│   ├── metadata.ts                    # NEW — generateMetadata helpers (seo group → Metadata)
│   └── structured-data.ts             # NEW — JSON-LD builders (Organization/Article/BreadcrumbList)
├── proxy.ts                           # EXTEND — maintenance short-circuit + x-request-id (ERROR_PAGES §3/§4)
├── payload/hooks/revalidateOnChange.ts  # RECONCILE — services path nested (drift #1)
└── components/sections/*              # (exists) consumed, not modified (unless block gap surfaces)

next.config.ts                         # EXTEND — async redirects() from INTEGRATIONS §9

tests/
├── int/
│   ├── lib/payload-cache-tags.int.spec.ts     # NEW — reader tags == buildRevalidatePlan tags
│   ├── routes/generateStaticParams.int.spec.ts# NEW — published slugs only
│   └── config/redirects.int.spec.ts           # NEW — redirect map shape + permanence
└── e2e/
    ├── marquee-pages.e2e.spec.ts              # NEW — each US page renders 200 + axe
    └── preview-roundtrip.e2e.spec.ts          # NEW — admin → preview → public draft
```

**Structure Decision**: Single Next.js App Router project (matches the repo's established `src/app/(frontend)` + `src/app/(payload)` route-group split). New public routes slot under the existing `(frontend)` group so they inherit `layout.tsx` chrome (header/footer/consent) and the CSP proxy. Helpers live in `src/lib`; no new top-level directories. This mirrors spec 003's structure decision and keeps the root clean per Constitution Additional Constraints.

## Complexity Tracking

> No Constitution Check violations — this section is intentionally empty. The one `unstable_`-prefixed API (`unstable_cache`) is the documented stable choice over experimental Cache Components and is justified in research.md §D1, not a violation to track here.
