---
description: 'Dependency-ordered task list — Phase 3: Public Render Foundation + Marquee Pages'
---

# Tasks: Phase 3 — Public Render Foundation + Marquee Pages

**Input**: Design documents from `/specs/004-phase-3-marquee-pages/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓ (`cached-readers.md`, `route-render.md`, `redirect-map.md`, `error-pages.md`), quickstart.md ✓

**Tests**: Per constitution §II, every user story ships ≥1 Vitest integration or Playwright E2E test on the load-bearing path. Test tasks are **not** optional and are written **first** (expect-fail) before the implementation that turns them green.

**Organization**: Tasks are grouped by user story (US1–US5, the marquee deliverables) to enable independent implementation and testing. Two non-story phases bracket them: Foundational (the cached-reader + helper infrastructure every route consumes) and a Render-Foundation phase for in-scope routes that have no dedicated marquee story (insights, services), followed by cross-cutting Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: User-story label (US1–US5); only user-story-phase tasks carry it
- Exact file paths are in every task

## Path Conventions

Single Next.js App Router project (per plan.md Structure Decision). Public routes under `src/app/(frontend)/`, helpers under `src/lib/`, hooks under `src/payload/hooks/`, tests under `tests/int/` and `tests/e2e/`. Repo root: `next.config.ts`, `.lighthouserc.cjs`, `src/proxy.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the spec-003 stack and seed prerequisites are in place so render work has data to render.

- [x] T001 Verify local dev prerequisites per `specs/004-phase-3-marquee-pages/quickstart.md` §Prerequisites: spec-003 stack up on the project Postgres port (5433+), `.env.local` carries `PAYLOAD_SECRET` / `DATABASE_URI` / `REVALIDATION_SECRET`, and ≥1 **published** doc exists per in-scope collection (`pages`, `caseStudies`, `posts`, `services`, `servicePillars`, `workshops`, `teamMembers`) with the `homepage` global's `hero` populated.
- [x] T002 [P] Create the spec-004 test directories `tests/int/lib/`, `tests/int/routes/`, and `tests/int/config/` (the suites in Phase 2/9 land here).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The cached-reader tag-parity layer + metadata/JSON-LD helpers that **every** route in this spec reads through. This is the load-bearing technical work of the spec (plan.md Summary §1).

**⚠️ CRITICAL**: No user-story route work can begin until the readers (T004–T006) and helpers (T007–T008) exist and the keystone tag-parity test (T009) is green.

- [x] T003 [P] Record the source-verified global revalidate tags in `specs/004-phase-3-marquee-pages/contracts/cached-readers.md`, closing the data-model §3 open verification: `buildRevalidatePlan` emits `['homepage_list']` / `['siteSettings_list']` / `['navigation_list']` for the three globals (no per-slug tag; globals carry no `slug`) plus path `/`. Confirmed against `src/payload/hooks/revalidateOnChange.ts:47,84-91`.
- [x] T004 Migrate the chrome readers `getSiteSettings` / `getNavigation` / `getHomepage` in `src/lib/payload.ts` from bare `React.cache` to the layered shape `cache(async () => unstable_cache(read, keyParts, { tags: ['<global>_list'], revalidate: 3600 })())` (cached-readers.md §Migration note — one Postgres round-trip per request **and** cross-request tag invalidation), using the T003 tags.
- [x] T005 Add the collection detail readers `getPageBySlug` / `getCaseStudyBySlug` / `getPostBySlug` / `getServiceBySlug` / `getServicePillarBySlug` / `getWorkshopBySlug` to `src/lib/payload.ts` per the cached-readers.md factory shape: `draft: false`, `overrideAccess: false` (published filter — no draft leak), `depth: 2`, `limit: 1`, tags `[`${collection}_${slug}`, `${collection}\_list`]`, `revalidate: 3600`, returning `docs[0] ?? null`. (Same file as T004 → sequential.)
- [x] T006 Add the list / static-params readers `listCaseStudies` / `listPosts` / `listServices` / `listServicePillars` / `listWorkshops` / `listTeamMembers` and a `publishedSlugsFor(collection)` helper to `src/lib/payload.ts` — published filter (`overrideAccess: false`), tags `[`${collection}\_list`]`, `revalidate: 3600`. (Same file as T005 → sequential.)
- [x] T007 [P] Create `src/lib/metadata.ts` — a `buildMetadata(seo, fallbacks)` helper mapping a doc's `seo` group (`metaTitle`, `metaDescription`, `ogImage`) → Next `Metadata`, with `siteSettings` fallbacks, the `%s | SEQTEK` title template, and OG-image resolution + default (plan.md §5, research §D7). No em dashes in any emitted public copy (project convention).
- [x] T008 [P] Create `src/lib/structured-data.ts` — JSON-LD builders `organizationLd()`, `articleLd(post)`, `breadcrumbLd(trail)` (research §D7). Emit CSP-nonce-safe (Next `Metadata`-nonced construct, or a `<script>` carrying the proxy nonce — Constitution §IV); a raw un-nonced `<script>` will be CSP-blocked.
- [x] T009 [P] **Keystone test** — `tests/int/lib/payload-cache-tags.int.spec.ts`: for every collection reader (T005) **and** the three globals (T004), assert the reader's `tags` array `===` `buildRevalidatePlan(collection, { slug }).tags` (invariant C1). Also assert C2 (readers query with `overrideAccess: false`) and C4 (no `getPayload({ config })` outside `getPayloadInstance`). This is the one test preventing silent stale-page regressions — write it to fail first, then T004–T006 turn it green. (Depends on T004–T006.)
- [x] T010 [P] Integration test `tests/int/routes/generateStaticParams.int.spec.ts` (data-layer half): assert `publishedSlugsFor(...)` / the `listX` readers return **published slugs only** — no draft leaks into the static manifest (invariant R3, spec-003 US5 draft-leak invariant held on the public side). Per-route `generateStaticParams` assertions extend this file in the US phases. (Depends on T006.)

**Checkpoint**: Readers tagged + helpers in place + keystone green → all user stories can begin (in parallel if staffed).

---

## Phase 3: User Story 1 — Homepage renders a credible firm (Priority: P1) 🎯 MVP

**Goal**: `GET /` returns 200 from the `homepage` global (no "No page yet" placeholder), composing the global's structured fields into the existing section components (research §D3).

**Independent Test**: Load `/` on a prod build — hero, stats, featured case study, brand teaser, client logos, testimonials, workshop CTA, and latest insights all render from Payload; live preview from the admin shows a matching draft.

### Tests for User Story 1 (MANDATORY — per constitution §II) ⚠️

- [x] T011 [US1] E2E test (write first, expect fail) in `tests/e2e/marquee-pages.e2e.spec.ts`: `GET /` → 200, asserts homepage-global sections present by `data-testid` (hero / stats / featured-case-study / …), asserts the "No page yet" placeholder is **absent**, axe-clean. (`getHomepage` tag parity is already covered by T009.)

### Implementation for User Story 1

- [x] T012 [US1] Replace `src/app/(frontend)/page.tsx` (retire the spike placeholder): bespoke composition mapping `homepage` global fields → sections per research §D3 (`HomepageHero`←`hero`, `StatsBar`←`stats`, `FeaturedCaseStudy`←`featuredCaseStudy`, `BrandTeaser`←`brandTeaser`, `LogoBar`/`ClientLogoGrid`←`clientLogos`, `FeaturedTestimonials`←`featuredTestimonials`, plus workshop-CTA + `post-list` per BLOCK_LIBRARY §6); `export const revalidate = 3600`; draft branch (`await draftMode()` → direct `getPayloadInstance` read with `draft: true` + `PreviewBanner`, else `getHomepage()`). **Reconcile drift #2**: delete the `pages`-slug-`home` query in the same edit.
- [x] T013 [US1] Add `generateMetadata` to `src/app/(frontend)/page.tsx` sourced from `siteSettings` (the `homepage` global has no `seo` group — data-model §5) via `src/lib/metadata.ts`, and emit `Organization` JSON-LD via `src/lib/structured-data.ts`.

**Checkpoint**: Homepage fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 — Flagship case study renders structured content (Priority: P1)

**Goal**: `/case-studies/[slug]` renders a bespoke structured template (Shape B) over the `caseStudies` collection; `/case-studies` lists them. Acceptance is met by one **drafted** case study rendering correctly (clarification 2026-06-01 — the named published flagship is a separately-tracked content-lead deliverable, not a blocking criterion).

**Independent Test**: Visit a published case study at `/case-studies/<slug>` — problem/solution/impact, metrics, and testimonial render; an unknown slug 404s; `generateStaticParams` exposes published slugs only.

### Tests for User Story 2 (MANDATORY — per constitution §II) ⚠️

- [x] T014 [US2] E2E test (write first, expect fail) in `tests/e2e/marquee-pages.e2e.spec.ts`: `/case-studies/<slug>` → 200, asserts structured fields render (problem / solution / impact / metrics) + testimonial by `data-testid`, axe-clean (invariant R1).
- [x] T015 [P] [US2] Integration test in `tests/int/routes/generateStaticParams.int.spec.ts`: the case-studies route `generateStaticParams()` returns published slugs only — no drafts in the manifest (invariant R3).

### Implementation for User Story 2

- [x] T016 [US2] Implement detail route `src/app/(frontend)/case-studies/[slug]/page.tsx` (Shape B): compose `problem`/`solution`/`impact` (richText), `metrics` array, `testimonial`, `relatedCaseStudies` (≤3), `industry` from `getCaseStudyBySlug`; `export const revalidate = 3600` + `dynamicParams = true`; `generateStaticParams` (published, via T006); `generateMetadata` (seo → metadata helper); `BreadcrumbList` JSON-LD; draft branch + `PreviewBanner`; `notFound()` on miss (route-render.md algorithm, invariants R1–R6).
- [x] T017 [US2] Implement listing route `src/app/(frontend)/case-studies/page.tsx`: `CaseStudyGrid` from `listCaseStudies()`; `revalidate = 3600`; `generateMetadata` from `siteSettings`.

**Checkpoint**: US1 + US2 both work independently.

---

## Phase 5: User Story 3 — Team page shows real people (Priority: P1)

**Goal**: `/team` lists `teamMembers` (leadership first, then `order`) via `TeamGrid` with real photos and market assignments.

**Independent Test**: Visit `/team` — `TeamGrid` renders current members with photos/titles/markets; metadata is static (the collection has no `seo` group).

**Note**: spec-003 **US6 (media via S3)** is the prereq for the bulk photo ingest (C-8); this route renders whatever media already exists and does **not** block on it.

### Tests for User Story 3 (MANDATORY — per constitution §II) ⚠️

- [x] T018 [US3] E2E test (write first, expect fail) in `tests/e2e/marquee-pages.e2e.spec.ts`: `/team` → 200, `TeamGrid` renders leadership + members with photos by `data-testid`, axe-clean (invariant R1).

### Implementation for User Story 3

- [x] T019 [US3] Implement `src/app/(frontend)/team/page.tsx`: `TeamGrid` from `listTeamMembers()` ordered leadership-first then `order`; `revalidate = 3600`; **static** metadata sourced from `siteSettings` (no `seo` group — invariant R6 N/A, assert static title instead; research §D7 caveat). `teamMembers` is public-read with no drafts, so no draft branch.
- [x] T020 [US3] Reconcile drift #4: add the `/team` row to the ARCHITECTURE.md §3 ISR table in the same PR (Constitution §III).

**Checkpoint**: US1 + US2 + US3 all independently functional.

---

## Phase 6: User Story 4 — Touchstone AI workshop campaign landing (Priority: P1)

**Goal**: `/touchstone-workshops/[slug]` renders the active-campaign detail (description / format / audience / facilitator / testimonial) plus the **Phase-2 placeholder** `hubspot-form` block and a `download-card`; `/touchstone-workshops` lists workshops. The **live** HubSpot Forms API integration is deferred (research §D10, confirmed 2026-05-31) — only the placeholder block renders here.

**Independent Test**: Visit a published workshop at `/touchstone-workshops/<slug>` — detail renders and the placeholder form block mounts (no live submission asserted).

### Tests for User Story 4 (MANDATORY — per constitution §II) ⚠️

- [x] T021 [US4] E2E test (write first, expect fail) in `tests/e2e/marquee-pages.e2e.spec.ts`: `/touchstone-workshops/<slug>` → 200, detail sections render + the placeholder `hubspot-form` block **mounts** by `data-testid` (live submission explicitly out of scope), axe-clean.

### Implementation for User Story 4

- [x] T022 [US4] Implement detail route `src/app/(frontend)/touchstone-workshops/[slug]/page.tsx` (Shape B): compose `description`/`format`/`audience` (richText), `facilitator`, `testimonial` from `getWorkshopBySlug`; mount the placeholder `HubspotForm` + place `DownloadCard` (lead magnet); `revalidate = 3600` + `dynamicParams = true`; `generateStaticParams` (published); `generateMetadata` (seo); draft branch + `PreviewBanner`; `notFound()` on miss.
- [x] T023 [US4] Implement listing route `src/app/(frontend)/touchstone-workshops/page.tsx`: `WorkshopList` from `listWorkshops()`; `revalidate = 3600`; `generateMetadata` from `siteSettings`.

**Checkpoint**: US1–US4 (all P1) independently functional.

---

## Phase 7: User Story 5 — Localshoring narrative (Priority: P2)

**Goal**: The localshoring story renders as a `pages` doc at the **flat** path `/localshoring` (research §D5) through the generic `/[slug]` route via `RenderBlocks` (Shape A), telling the differentiator with `comparison-table` / `content` / `two-column` blocks.

**Independent Test**: Visit `/localshoring` — the comparison-table narrative renders via `RenderBlocks`; an unknown slug 404s.

### Tests for User Story 5 (MANDATORY — per constitution §II) ⚠️

- [x] T024 [US5] E2E test (write first, expect fail) in `tests/e2e/marquee-pages.e2e.spec.ts`: `/localshoring` → 200, comparison-table narrative renders via `RenderBlocks` by `data-testid`, axe-clean (invariant R1).

### Implementation for User Story 5

- [x] T025 [US5] Implement the generic `pages` route `src/app/(frontend)/[slug]/page.tsx` (Shape A): `<RenderBlocks blocks={page.layout} />` from `getPageBySlug`; `revalidate = 3600` + `dynamicParams = true`; `generateStaticParams` (published page slugs, via T006); `generateMetadata` (seo); draft branch + `PreviewBanner`; `notFound()` on miss (the `showcase/[slug]` pattern, generalized).
- [x] T026 [US5] Reconcile drift #3 (retire spike placeholders): delete `src/app/(frontend)/about/[slug]/page.tsx` and `src/app/(frontend)/about/page.tsx` — `/about` is now a `pages` doc served by `/[slug]` (research §D5). Confirm `/[slug]` resolves `/about` and there is no route shadowing.
- [x] T027 [US5] Retire the spike demo route `src/app/(frontend)/showcase/[slug]/page.tsx` now that `/[slug]` reaches parity (single `pages` render path — clarification 2026-06-01); prune its `tests/e2e/visual/screenshots/showcase/` baseline references.

**Checkpoint**: All five marquee user stories independently functional.

---

## Phase 8: Render Foundation — Remaining In-Scope Routes (no dedicated marquee story)

**Purpose**: The collection routes the spec lists under "In scope" (insights, services) that no marquee user story drives, plus the services-URL drift reconciliation. These are required so navigation/redirect destinations don't 404 (redirect invariant RM3) and so the services-URL contract is consistent (drift #1). **Silent-cap note**: long-tail _content_ (industries, market landing pages, the remaining case studies, services × 15) stays out of scope per spec.md — these tasks ship the _templates_ only.

- [ ] T028 [P] Implement insights listing `src/app/(frontend)/insights/page.tsx`: `PostList` from `listPosts()`; `revalidate = 3600`; `generateMetadata` from `siteSettings`.
- [ ] T029 [P] Implement insights detail `src/app/(frontend)/insights/[slug]/page.tsx` (Shape C): `RichText` over `posts.content` + the inline-block registry (`src/components/richText/inline/registry.ts`); `Article` JSON-LD; `revalidate = 3600` + `dynamicParams = true`; `generateStaticParams` (published); `generateMetadata` (seo); draft branch + `PreviewBanner`; `notFound()` on miss.
- [ ] T030 [P] Implement services overview `src/app/(frontend)/services/page.tsx`: `ServicePillarCards` from `listServicePillars()`; `revalidate = 3600`; `generateMetadata`. (Replaces the spike placeholder at this path.)
- [ ] T031 Implement services pillar listing `src/app/(frontend)/services/[pillar]/page.tsx`: `ServiceCards` for the pillar's child services; `generateStaticParams` (published pillar slugs); `generateMetadata`; `notFound()` on unknown pillar; `revalidate = 3600` + `dynamicParams = true`.
- [ ] T032 Implement services detail `src/app/(frontend)/services/[pillar]/[slug]/page.tsx` (Shape B, nested URL — research §D4): compose `description`/`approach` (richText), `deliverables`, `faq` from `getServiceBySlug`; `generateStaticParams` over published **pillar+slug pairs**; `BreadcrumbList` JSON-LD; `generateMetadata` (seo); draft branch + `PreviewBanner`; `notFound()`. Delete the spike `src/app/(frontend)/services/[slug]/page.tsx` in the same edit (drift #3).
- [ ] T033 Reconcile drift #1 in `src/payload/hooks/revalidateOnChange.ts`: change the `services` case to emit nested paths `/services/${pillarSlug}/${slug}` + `/services/${pillarSlug}` (currently flat `/services/${s}` at line 61). The afterChange `doc.pillar` is an ID at hook depth — resolve the pillar slug (fetch via `getPayloadInstance` or require populated `pillar`) so the nested path can be built (research §D4 implementation risk).
- [ ] T034 [P] Integration test `tests/int/hooks/revalidate-services-path.int.spec.ts` pinning the corrected `buildRevalidatePlan('services', …)` output (nested paths; tags unchanged at `services_${slug}` / `services_list`).

**Checkpoint**: Full in-scope route inventory renders; redirect destinations resolve.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error/maintenance surfaces, redirects, sitemap, preview round-trip, Lighthouse gating, and doc reconciliation that span all routes.

- [ ] T035 [P] Implement 404 `src/app/(frontend)/not-found.tsx` (ERROR_PAGES §2): full header/footer chrome, heading, three destination cards (Home / Services / Case Studies), "Book a Strategy Call" CTA, `dataLayer.push({ event: 'page_not_found', path })` (invariant E1).
- [ ] T036 [P] Implement 500 boundary `src/app/(frontend)/error.tsx` (`'use client'`, ERROR_PAGES §3): logo, apology, "Try again" → `reset()`, `support@seqtek.com` fallback, **visible request id** (invariants E2/E3).
- [ ] T037 [P] Implement root 500 `src/app/(frontend)/global-error.tsx` (ERROR_PAGES §3): renders its own `<html><body>`, same content as T036, for root-layout failures.
- [ ] T038 Extend `src/proxy.ts` (ERROR_PAGES §3/§4): (a) `MAINTENANCE_MODE=true` → static 503 for **all** paths **except `/api/health`** (must stay 200 or the ALB cycles instances — invariant E4); (b) generate an `x-request-id` UUID v4 per request and attach it as a response header for the 500 page's support correlation (E3). Preserve the existing CSP handling.
- [ ] T039 Implement the 301 redirect map in `next.config.ts` `async redirects()` from INTEGRATIONS.md §9 (every entry `permanent: true`, root-relative `source`/`destination`, wildcard children `:path*`); reconcile INTEGRATIONS.md §9 as the source of truth in the same PR (Constitution §III, redirect-map.md).
- [ ] T040 [P] Integration test `tests/int/config/redirects.int.spec.ts`: RM1 (every entry `permanent: true`), RM2 (root-relative paths), RM3 (no `destination` 404s vs the data-model §1 route inventory), RM4 (parity with INTEGRATIONS.md §9).
- [ ] T041 [P] Integration test `tests/int/config/error-maintenance.int.spec.ts`: unknown route → `notFound()` → 404 (E1), `x-request-id` present on responses (E3), `MAINTENANCE_MODE=true` → 503 for `/` and **200 for `/api/health`** (E4), and error pages leak no draft/internal data (E5).
- [ ] T042 [P] E2E preview round-trip `tests/e2e/preview-roundtrip.e2e.spec.ts` (invariant R4): editor via `/preview/<collection>/<slug>` sees draft content + amber `PreviewBanner`; an anon hit on the public URL sees published-only (or 404 if never published) — the spec-003 US5 draft-leak invariant held on the public side.
- [ ] T043 Implement `src/app/(frontend)/sitemap.ts`: dynamic sitemap from published slugs across collections (data-model §1; `buildRevalidatePlan` already invalidates `/sitemap.xml` on every change).
- [ ] T044 Extend `.lighthouserc.cjs` `collect.url` with the new marquee URLs (`/`, `/case-studies/<slug>`, `/team`, `/touchstone-workshops/<slug>`, `/localshoring`); gate a11y / best-practices / SEO at ≥ 0.95; keep Performance/LCP/TBT/CLS budgets at `warn` until Phase 5 (Constitution §II, drift #5), reusing the PR-19 `assertMatrix` pattern.
- [ ] T045 Docs reconciliation (Constitution §III, same-PR): ARCHITECTURE.md §3 ISR table (services **nested**, confirm `/team` row from T020); ROADMAP §4 (move the PR-19 Phase-2 US6/US7/Polish items to `docs/PROJECT_HISTORY.md`); update spec.md US5's `/about/localshoring` reference to the flat `/localshoring` (research §D5); add ADR `docs/decisions/0004-isr-unstable-cache-tag-parity.md` (research §D1 follow-up).
- [ ] T046 Record the deferred-not-dropped items in ROADMAP §4 so they aren't mistaken for oversights: slow-request `Promise.race` timeout (ERROR_PAGES §5 → Phase 5), live HubSpot Forms API integration + GUID + consent/nonce wiring (research §D10 follow-up), CSP enforce / cookie-consent E2E / cross-browser QA / performance tuning (Phase 5).
- [ ] T047 Run the `specs/004-phase-3-marquee-pages/quickstart.md` validation end-to-end on a prod build (`npm run build && npm run start`): every route in the verify table, the preview round-trip, and the on-demand-revalidation keystone behavior (publish → tag invalidation → live without the 3600s fallback).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup — **blocks all user stories**. The readers (T004→T005→T006) are sequential (same file `src/lib/payload.ts`); T003/T007/T008 are parallel; T009/T010 follow the readers.
- **User Stories (Phase 3–7)**: each depends only on Foundational. Once Phase 2 is green they can proceed in parallel (if staffed) or in priority order P1 (US1→US2→US3→US4) then P2 (US5).
- **Render Foundation — remaining routes (Phase 8)**: depends on Foundational; independent of the marquee stories. Can run alongside Phase 3–7.
- **Polish (Phase 9)**: redirect/sitemap/lighthouse/docs tasks depend on the routes they reference existing (Phases 3–8); error pages (T035–T037) and proxy (T038) depend only on Foundational and can start earlier.

### User Story Dependencies

- **US1 (P1)** — homepage; no dependency on other stories.
- **US2 (P1)** — case study; independent (its `notFound()` falls back to Next's default 404 until T035 ships the styled one).
- **US3 (P1)** — team; independent.
- **US4 (P1)** — workshop; independent.
- **US5 (P2)** — localshoring via generic `/[slug]`; independent; also retires the spike `/about/*` and `/showcase/[slug]` routes.

### Within Each User Story

- The E2E/integration test is written **first** and must fail before the implementation turns it green (constitution §II).
- Detail route before its listing only where the listing reuses detail helpers; otherwise they are independent files.

---

## Parallel Opportunities

- **Phase 1**: T002 ∥ T001.
- **Phase 2**: T003 ∥ T007 ∥ T008 (distinct files) can all run while the reader chain T004→T005→T006 proceeds; T009 ∥ T010 once readers land.
- **Across stories**: once Foundational is green, US1–US5 route **implementation** tasks touch disjoint route directories and can be staffed in parallel. ⚠️ The five E2E test tasks (T011/T014/T018/T021/T024) all append to the single `tests/e2e/marquee-pages.e2e.spec.ts` — coordinate (each adds its own `describe` block) or split per-page files if running stories truly concurrently.
- **Phase 8**: T028 ∥ T029 ∥ T030 (distinct files); T031/T032 follow the services overview; T034 ∥ after T033.
- **Phase 9**: T035 ∥ T036 ∥ T037 (distinct error files); T040 ∥ T041 ∥ T042 (distinct test files).

---

## Parallel Example: Foundational (Phase 2)

```bash
# Launch the independent foundational files together:
Task: "Record verified global tags in contracts/cached-readers.md"          # T003
Task: "Create src/lib/metadata.ts generateMetadata helper"                   # T007
Task: "Create src/lib/structured-data.ts JSON-LD builders"                   # T008
# Meanwhile, the reader chain runs sequentially in src/lib/payload.ts:
#   T004 (chrome readers) → T005 (detail readers) → T006 (list readers)
# Then the tests:
Task: "Keystone tag-parity test tests/int/lib/payload-cache-tags.int.spec.ts" # T009
Task: "Published-only static-params test tests/int/routes/...int.spec.ts"     # T010
```

## Parallel Example: marquee stories after Foundational

```bash
# Different developers, disjoint route directories:
Developer A: US1 → src/app/(frontend)/page.tsx
Developer B: US2 → src/app/(frontend)/case-studies/**
Developer C: US3 → src/app/(frontend)/team/page.tsx
Developer D: US4 → src/app/(frontend)/touchstone-workshops/**
Developer E: US5 → src/app/(frontend)/[slug]/page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational (CRITICAL — blocks all stories; the keystone tag-parity test is the gate) → 3. Phase 3 US1 → 4. **STOP & VALIDATE**: `/` renders the homepage global on a prod build, preview round-trip works → 5. Deploy/demo.

### Incremental Delivery

Foundation ready → US1 (MVP, `/`) → US2 (case study) → US3 (team) → US4 (workshop) → US5 (localshoring) → Phase 8 (insights/services routes) → Phase 9 (errors/redirects/sitemap/lighthouse/docs). Each marquee story adds value without breaking the prior ones.

### Parallel Team Strategy

Team completes Setup + Foundational together (the readers + keystone test are the shared contract). Then US1–US5 + Phase 8 fan out across developers on disjoint route directories; Phase 9 error pages/proxy can start in parallel, with redirect/sitemap/lighthouse/docs landing once their referenced routes exist.

---

## Notes

- **[P]** = different files, no dependency on an incomplete task. **[US#]** maps a task to its marquee story for traceability; Setup / Foundational / Render-Foundation / Polish tasks carry no story label by design.
- The **keystone** is T009 (reader tags == `buildRevalidatePlan`) — if it goes red, on-demand revalidation silently breaks and pages serve stale until the 3600s fallback. Treat any drift as a build-breaker.
- Do **not** add `export const dynamic = 'force-dynamic'` (the spike pattern this spec retires — quickstart §Gotchas); use `revalidate = 3600` + `dynamicParams = true`.
- `params` / `searchParams` / `draftMode()` are async in Next 16 — always `await`.
- New richText/client-component fields → regenerate `src/app/(payload)/admin/importMap.js` (project gotcha); none anticipated here since blocks are consumed, not added.
- After editing the redirect map, restart `next start` — `redirects()` is read at server start, not per-request.
- No em dashes in any public-facing copy emitted by templates/metadata (project convention).
- Commit after each task or logical group; reconcile the doc drift in the **same** commit that touches the code (Constitution §III).
