# Phase 0 Research — Public Render Foundation + Marquee Pages

All decisions below were resolved against the **installed** stack (Next.js 16.2.6, Payload 3.85.0, React 19.2.4) and the canonical docs, not training data. Source verification is cited inline. Decisions marked **⚑ CLARIFY** are recommended defaults that touch product/IA/content and should be confirmed via `/speckit-clarify` (or by Kenn directly) before `/speckit-tasks`.

---

## D1 — Caching model: `unstable_cache`, not `'use cache'` Cache Components

**Decision**: Wrap each Payload Local API read in `unstable_cache(fn, keyParts, { tags, revalidate })`, with `tags` set to the exact strings `buildRevalidatePlan` emits. Do **not** adopt the `'use cache'` + `cacheTag`/`cacheLife` Cache Components model for this spec.

**Rationale**:

- The shipped `revalidateOnChange` hook already calls `revalidateTag(tag)` for each tag in `buildRevalidatePlan(...).tags`. `revalidateTag` only invalidates caches that registered those tags. The Payload Local API talks to Postgres via Drizzle — **no `fetch`** — so nothing is tag-registered today. `unstable_cache({ tags })` is the documented mechanism for tagging non-`fetch` async reads (verified via context7 against `docs/01-app/.../caching-without-cache-components.mdx`). It slots directly onto the existing tag scheme with zero hook changes.
- `'use cache'` / `cacheComponents` is gated behind a `next.config` flag, changes route rendering semantics globally, and is unvalidated against Payload's Local API in this stack. Adopting it now is a Constitution §V risk (bleeding-edge, unpinned behavior on the load-bearing render path) for no benefit the tag model doesn't already give us.

**Source verification**: `node_modules/next/dist/server/web/spec-extension/unstable-cache.js` — cache read guarded at line 146 (`!workStore.isDraftMode`), write at line 207; tags collected onto the work-unit store (lines 113–122). `next/cache` exports `unstable_cache`, `revalidateTag`, `cacheTag`, `cacheLife` confirmed present in 16.2.6.

**Alternatives considered**: (a) `'use cache'` Cache Components — rejected, see above; revisit when Payload publishes Cache-Components guidance. (b) `revalidatePath`-only (drop tags, rely on path invalidation + CloudFront) — rejected: loses the granular per-doc invalidation the hook already computes and couples render to URL strings.

**Follow-up**: This is an **ADR candidate (0004 — "ISR caching via unstable_cache tag parity")**. Revisit trigger: Payload documents a Cache Components integration, or Next deprecates `unstable_cache`.

---

## D2 — Draft / live-preview rendering

**Decision**: Each template reads draft state once: `const { isEnabled: isDraft } = await draftMode()`. When `isDraft`, call Payload directly with `draft: true` + the existing editorial auth context (the `/preview` route already authenticated and enabled draft mode). When not draft, call the `unstable_cache`-wrapped published reader. Render the existing `PreviewBanner` when `isDraft`.

**Rationale**: `unstable_cache` auto-bypasses under draft mode (D1 source note), so there is no stale-cache hazard, but a cached _published_ reader still carries the `_status: 'published'` filter — the explicit `draft: true` arg is what surfaces unpublished edits. This is exactly the shape already proven in `src/app/(frontend)/showcase/[slug]/page.tsx` (`draft: isDraft`) and the `/preview/[collection]/[slug]/route.ts` enabler. No new preview machinery is needed; spec 004 generalizes the showcase pattern across the real routes.

**Alternatives considered**: Rely on `unstable_cache` auto-bypass alone — rejected, it would render published-only data in preview. A separate preview subdomain — rejected, Payload live preview already targets same-origin draft routes.

---

## D3 — Homepage source: the `homepage` global, rendered as a bespoke composition

**Decision**: Drive `GET /` from the `homepage` **global** (`getHomepage()`), not a `pages` doc with slug `home`. The homepage template is a bespoke composition that maps the global's structured fields to existing section components:

| Homepage global field  | Section component (`src/components/sections/`) |
| ---------------------- | ---------------------------------------------- |
| `hero`                 | `HomepageHero`                                 |
| `stats`                | `StatsBar`                                     |
| `featuredCaseStudy`    | `FeaturedCaseStudy`                            |
| `brandTeaser`          | `BrandTeaser`                                  |
| `clientLogos`          | `LogoBar` (or `ClientLogoGrid`)                |
| `featuredTestimonials` | `FeaturedTestimonials`                         |

Plus the workshop-CTA and latest-insights (`post-list`) sections per the BLOCK_LIBRARY.md §6 homepage composition matrix. Retire the spike `pages`-slug-`home` query and the "No page yet" placeholder.

**Rationale**: The `homepage` global (verified in `src/globals/Homepage.ts`) has discrete structured groups, **not** a generic `layout: blocks[]` array — so it is not a `RenderBlocks` surface. Composing the section components directly off the global's fields matches what shipped in spec 003 and avoids a schema change. This resolves spec.md open question #2.

**Alternatives considered**: Add a `layout` blocks array to the `homepage` global so marketing can freely reorder homepage blocks via `RenderBlocks` — rejected for spec 004 (schema change to a shipped global + re-seed; the structured fields already map 1:1 to components). **Note for the future**: if marketing wants free-form homepage block ordering, revisit by adding an _optional_ `layout` array the template falls back to.

---

## D4 — Services URL: nested `/services/[pillar]/[slug]` ⚑ (resolves a drift)

**Decision**: Service detail pages render at `/services/[pillar]/[slug]`; service pillars at `/services/[pillar]`; the services overview at `/services`. `services.pillar` is a **required** relationship, so the pillar slug is always available.

**Rationale**: ARCHITECTURE.md §3's ISR table lists `/services/[pillar]/[service]`, and the live-preview builder (`src/payload/livePreview/url.ts`) already produces `/services/${pillarSlug}/${slug}`. data-model.md §1.5 (spec 003) documents nested. The lone dissenter is `revalidateOnChange.ts` (flat `/services/${slug}`) — that is **drift #1** and gets corrected (see Drift register).

**Implementation risk to carry into tasks**: the `services` afterChange hook needs the doc's `pillar.slug` to build the nested path. Confirm the hook receives `pillar` populated (depth ≥ 1) or fetch it inside the hook; otherwise nested revalidation paths can't be computed. Add a test pinning the corrected `buildRevalidatePlan('services', …)` output.

---

## D5 — `pages` URL structure and the About IA — ✅ CONFIRMED FLAT (Kenn 2026-05-31)

**Decision**: `pages` docs render **flat** at top-level `/[slug]`, matching the shipped contract — both `revalidateOnChange.ts` (`pages → /${slug}`) and the live-preview builder (`pages → /${slug}`) emit flat paths. `/about` is a `pages` doc with slug `about`. Marquee about-content gets top-level slugs: localshoring at `/localshoring` (slug `localshoring` or `our-localshoring-model`), **not** `/about/localshoring`. Retire the `/about/[slug]` + `/services/[slug]` spike placeholders. Old Wix `/about-us-1` → `/about` via the redirect map.

**Rationale**: simplest; matches the shipped revalidate/preview contract with zero hook/path-builder changes. spec.md US5's literal `/about/localshoring` is superseded by this decision — update US5's URL reference to the flat form when the page lands (Constitution §III).

**Alternative rejected**: Nested `/about/[slug]` — would require updating BOTH the revalidate hook and the live-preview builder to emit `/about/${slug}` plus a `parent`/section concept on `pages`. More contract surface for no marquee-scope benefit. Revisit if Phase 4 long-tail About sub-pages justify nesting.

---

## D6 — Static generation: `generateStaticParams` + `dynamicParams = true`

**Decision**: Each collection detail route exports `generateStaticParams()` returning **published** slugs (queried via the cached reader, `overrideAccess: false` so the published filter applies) and `export const dynamicParams = true` (the default). `export const revalidate = 3600`. The template calls `notFound()` when a slug doesn't resolve to a renderable doc.

**Rationale**: Prebuilding published slugs gives fast first paint; `dynamicParams = true` means a slug published _after_ build renders on-demand (ISR) instead of 404-ing — correct for a CMS where editors publish continuously. `dynamicParams = false` (verified via context7) would 404 anything not in the build manifest — wrong here. Verified `generateStaticParams` + `dynamicParams` + `revalidate` interplay against `docs/01-app/.../generate-static-params.mdx` and `.../incremental-static-regeneration.mdx`.

**Alternatives considered**: Fully dynamic (`force-dynamic`) — rejected; that's the spike pattern the spec is replacing and it forfeits the §7 LCP budget. Build-time-only (`dynamicParams = false`) — rejected; breaks continuous publishing.

---

## D7 — Metadata, Open Graph, JSON-LD

**Decision**: `generateMetadata` per route reads the doc's `seo` group (`metaTitle`, `metaDescription`, `ogImage`) with fallbacks to `siteSettings` (and the root layout's title template `%s | SEQTEK`). JSON-LD via `src/lib/structured-data.ts`: `Organization` on the homepage, `Article` on `/insights/[slug]`, `BreadcrumbList` on nested routes. OG image resolution + default in `src/lib/metadata.ts` (per the `lib/metadata.ts` + `lib/structured-data.ts` paths named in ARCHITECTURE.md §4).

**Caveat**: `teamMembers` has **no** `seo` group (verified) — the `/team` listing's metadata is static / sourced from `siteSettings`. Note JSON-LD `<script>` must carry the CSP nonce (Constitution §IV) or be emitted as a Next `Metadata` `other`/`alternates` construct that the framework nonces.

**Alternatives considered**: Per-page hard-coded metadata — rejected (drifts from CMS); a metadata block in the layout array — rejected (metadata must be a server `generateMetadata` export, not a rendered block).

---

## D8 — 301 redirects via `next.config.ts`

**Decision**: Implement `async redirects()` in `next.config.ts`, sourced from the INTEGRATIONS.md §9 redirect table (the HTTP path-level contract; a superset of `src/payload/seed/slugRewrites.ts`, which is the _internal_ Payload slug map). Each entry `{ source, destination, permanent: true }`; wildcard children use `:path*`.

**Rationale**: ARCHITECTURE.md §5 explicitly places the redirect map in `next.config.ts` `redirects()`, not the proxy. `slugRewrites.ts` maps bare slugs for the seed; the HTTP redirects need full paths with route prefixes (e.g. `/about-us-1` → `/about`, `/blog-old/:path*` → `/insights/:path*`). Keep INTEGRATIONS.md §9 as the source of truth; the config is generated to match (reconcile in the same PR per Constitution §III). Add an integration test asserting the map shape + `permanent: true`.

**Alternatives considered**: Redirects in `src/proxy.ts` — rejected; `next.config` `redirects()` is statically analyzable, CloudFront-cacheable, and is where ARCHITECTURE.md §5 says they live.

---

## D9 — Error + maintenance pages

**Decision**: Add `not-found.tsx` (404), `error.tsx` (500 route boundary), `global-error.tsx` (root 500) under `(frontend)` per ERROR_PAGES.md §2–§3 (full chrome on 404; `reset()` + visible request ID + `support@` fallback on 500). Extend `src/proxy.ts` with (a) a `MAINTENANCE_MODE` short-circuit returning static 503 for all paths **except `/api/health`** (ERROR_PAGES §4 — the ALB exemption is load-bearing or instances get cycled), and (b) `x-request-id` UUID generation feeding the 500 page's support-correlation ID (ERROR_PAGES §3).

**Rationale**: spec.md "In scope" lists 404/500/maintenance per ERROR_PAGES.md. The proxy currently handles only CSP (verified `src/proxy.ts`); maintenance + request-id are documented-but-unbuilt. Request-id is a prereq for the 500 page contract, so it lands here.

**Alternatives considered**: Defer maintenance to Phase 5 — rejected; it's in the spec's scope and the proxy is already the right insertion point. Slow-request `Promise.race` timeout (ERROR_PAGES §5) — **deferred** to Phase 5 polish; not load-bearing for marquee render. (Flag this deferral in tasks so it isn't silently dropped.)

---

## D10 — US4 workshop funnel: keep the Phase-2 placeholder — ✅ CONFIRMED (Kenn 2026-05-31)

**Decision**: US4 renders the workshop detail at `/touchstone-workshops/[slug]` with the **Phase-2 placeholder** `hubspot-form` block. The **live** HubSpot Forms API integration (custom React form → `api.hsforms.com/...`, Zod state machine, GTM dataLayer events, nonce + consent) is **deferred** to a later pass — tracked as a follow-up, not in spec 004 scope.

**Rationale**: keeps spec 004's scope on the render foundation and avoids activating a new third-party surface (and its CSP-nonce + consent wiring) before the campaign copy + Form GUID exist. The route, layout, and lead-magnet `download-card` placement all ship now; only the form's network integration waits.

**Consequence for the plan**: there is **no newly-activated third-party script** in spec 004 — the Constitution §IV note about HubSpot nonce-wiring no longer applies to this spec (folded into the deferred follow-up). The US4 test asserts the placeholder block renders, not a live submission.

**Still ⚑ for content (not blockers)**: Workshop Inquiry Form GUID (INTEGRATIONS.md §1.2 "TBD") and the lead-magnet asset (spec.md open Q#4) — both feed the deferred live-form pass.

---

## ⚑ CLARIFY — additional product decisions (recommended defaults in brackets)

**Resolved 2026-05-31 (Kenn)**: About IA → **flat** (D5); workshop form → **placeholder, defer live** (D10); next step → **run `/speckit-clarify` before `/speckit-tasks`**.

Still open, to confirm in `/speckit-clarify` (tasks can proceed on the defaults if not answered):

1. **Flagship case study** (spec.md open Q#1, US2): which engagement is the flagship? Gated on client-logo permission (C-5) + testimonial availability (C-1). [Default: pick the strongest case study with an existing named testimonial; ship others as drafts.]
2. **Team route** (US3): `/team` vs `/about/team`. [Default: `/team` per spec US3; ensure it's added to the ARCHITECTURE §3 ISR table in the reconciling PR.]
3. **`showcase/[slug]`**: keep as a living reference demo or retire once real routes reach parity? [Default: retire after the generic `pages` route ships, to avoid two `pages` render paths.]
4. **Lead-magnet asset** (spec.md open Q#4): assessment vs framework brief vs one-pager — feeds the deferred live-form pass (D10).

---

## Drift register (Constitution §III — reconcile in the same commit that touches each)

| #   | Drift                                | Files                                                                                                                    | Resolution                                                                                                                                                       |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Services URL flat vs nested          | `src/payload/hooks/revalidateOnChange.ts` (flat) vs data-model.md §1.5 + ARCHITECTURE §3 + `livePreview/url.ts` (nested) | Nested wins (D4). Fix the hook's `services` case to emit `/services/${pillar.slug}/${slug}` + `/services/${pillar.slug}`; update the `buildRevalidatePlan` test. |
| 2   | Homepage source                      | `(frontend)/page.tsx` (queries `pages` slug `home`) vs `homepage` global                                                 | Drive `/` from the global (D3); delete the placeholder query.                                                                                                    |
| 3   | Spike route placeholders             | `(frontend)/about/[slug]/page.tsx`, `(frontend)/services/[slug]/page.tsx`                                                | Reconcile/retire when the real `[slug]` / `[pillar]/[slug]` routes land (D5/D4).                                                                                 |
| 4   | ISR table missing `/team`            | ARCHITECTURE.md §3                                                                                                       | Add `/team` row when the team route ships.                                                                                                                       |
| 5   | Performance-budget warn→error timing | `.lighthouserc.cjs`                                                                                                      | Stays `warn` per Constitution §II until Phase 5; no change now, noted so it isn't mistaken for an oversight.                                                     |

---

## Testing strategy (feeds /speckit-tasks)

- **Tag parity (highest-value)**: an integration test asserting each cached reader's `tags` array equals `buildRevalidatePlan(collection, doc).tags` for that collection. This is the one test that prevents silent stale-page regressions — the whole ISR contract rests on it.
- **Route render**: Playwright E2E per marquee page — 200, expected sections present (`data-testid`), axe clean.
- **Static params**: integration test that `generateStaticParams` returns only published slugs (no drafts leak into the build manifest).
- **Preview round-trip**: E2E — editor opens `/preview/...`, sees draft content + `PreviewBanner`; anon hitting the public URL sees only published.
- **Redirects**: integration test over the `next.config` redirect array (shape + `permanent: true`); optional E2E hitting one old slug for a real 301.
- **Error paths**: integration `notFound()` → 404; maintenance short-circuit returns 503 and lets `/api/health` through.
- Lighthouse CI gates a11y/bp/SEO ≥ 0.95 on the new marquee URLs (extend `.lighthouserc.cjs` `collect.url`, reusing the spec-003-PR-19 `assertMatrix` pattern).
