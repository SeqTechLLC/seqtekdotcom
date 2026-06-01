# Data Model — Public Render Foundation + Marquee Pages

Spec 004 adds **no new collections or globals** — it renders the spec 003 schema. This document is therefore the _route ↔ data_ model: which URL reads which collection/global, in which render shape, behind which cache tags. Field-level schema lives in [`../003-phase-2-content-models/data-model.md`](../003-phase-2-content-models/data-model.md); the field shapes the templates depend on were re-verified against the live config (drift notes in research.md).

## 1. Route inventory

| Route                          | Source            | Kind                             | Slug field                   | Render shape                                      | Static params?          |
| ------------------------------ | ----------------- | -------------------------------- | ---------------------------- | ------------------------------------------------- | ----------------------- |
| `/`                            | `homepage` global | global                           | —                            | bespoke (structured fields → sections)            | n/a                     |
| `/[slug]`                      | `pages`           | collection                       | `slug` (flat)                | `RenderBlocks(page.layout)`                       | yes                     |
| `/case-studies`                | `caseStudies`     | listing                          | —                            | bespoke listing (`CaseStudyGrid`)                 | n/a                     |
| `/case-studies/[slug]`         | `caseStudies`     | detail                           | `slug`                       | bespoke (problem/solution/impact + testimonial)   | yes                     |
| `/insights`                    | `posts`           | listing                          | —                            | bespoke listing (`PostList`)                      | n/a                     |
| `/insights/[slug]`             | `posts`           | detail                           | `slug`                       | richText (`content`) + inline-block registry      | yes                     |
| `/services`                    | `servicePillars`  | overview                         | —                            | bespoke (`ServicePillarCards`)                    | n/a                     |
| `/services/[pillar]`           | `servicePillars`  | pillar                           | `slug`                       | bespoke (`ServiceCards` for children)             | yes                     |
| `/services/[pillar]/[slug]`    | `services`        | detail                           | `slug` (+ required `pillar`) | bespoke (description/approach/deliverables/faq)   | yes (pillar+slug pairs) |
| `/touchstone-workshops`        | `workshops`       | listing                          | —                            | bespoke listing (`WorkshopList`)                  | n/a                     |
| `/touchstone-workshops/[slug]` | `workshops`       | detail                           | `slug`                       | bespoke + `hubspot-form` (US4)                    | yes                     |
| `/team`                        | `teamMembers`     | listing                          | —                            | bespoke (`TeamGrid`, leadership + members)        | n/a                     |
| `/sitemap.xml`                 | multiple          | route handler                    | —                            | dynamic XML from published slugs                  | n/a                     |
| `404`                          | —                 | `not-found.tsx`                  | —                            | static chrome (ERROR_PAGES §2)                    | n/a                     |
| `500`                          | —                 | `error.tsx` / `global-error.tsx` | —                            | static chrome + request id (ERROR_PAGES §3)       | n/a                     |
| maintenance                    | —                 | `proxy.ts` short-circuit         | —                            | static 503, `/api/health` exempt (ERROR_PAGES §4) | n/a                     |

**Marquee pages (the spec's named deliverables)** are a subset realized over the above routes: homepage (`/`), flagship case study (`/case-studies/[slug]`), team (`/team`), Touchstone AI workshop (`/touchstone-workshops/[slug]`), localshoring (a `pages` doc at flat `/localshoring`, research §D5).

## 2. Render shapes

**Shape A — `RenderBlocks` (layout-bearing).** Only `pages` carries a `layout: blocks[]` array. The template fetches the page, then `return <RenderBlocks blocks={page.layout} />`. This is the `showcase/[slug]` pattern, generalized. The dispatcher (`src/components/sections/RenderBlocks.tsx`) maps `block.blockType` → component via `registry.ts` and spreads the block as props.

**Shape B — bespoke structured template.** `caseStudies`, `services`, `servicePillars`, `workshops`, and the `homepage` global expose **discrete structured fields** (not a `layout` array). Their templates import the relevant `src/components/sections/*` components and compose them from named fields. Example (homepage, research §D3): `HomepageHero` ← `hero`, `StatsBar` ← `stats`, `FeaturedCaseStudy` ← `featuredCaseStudy`, etc.

**Shape C — richText.** `posts.content` is richText with the inline-block editor config; rendered via the existing rich-text renderer + `src/components/richText/inline/registry.ts`.

> Implication for /speckit-tasks: Shape B templates are per-collection bespoke work (more code than Shape A). Budget accordingly — caseStudies and services detail templates are the largest.

## 3. Cache-tag contract (load-bearing)

The ISR correctness of every page rests on the readers' cache tags matching `buildRevalidatePlan`. The hook (`src/payload/hooks/revalidateOnChange.ts`) emits, per change:

- **List tag** `${collection}_list` — always.
- **Doc tags** `${collection}_${slug}` — per affected slug (incl. old + new on rename).
- **Paths** for CloudFront invalidation (see §1) + always `/sitemap.xml`.

Each `unstable_cache` reader MUST register the tags that cover its read:

| Reader                                    | Tags                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `getHomepage()`                           | `homepage_list` (+ whatever `buildRevalidatePlan('homepage', …)` emits for the global — **verify and match exactly**)           |
| `getSiteSettings()` / `getNavigation()`   | `siteSettings_list` / `navigation_list` (chrome reads — consumed by every page; confirm the global revalidate plan emits these) |
| `getPageBySlug(slug)`                     | `pages_${slug}`, `pages_list`                                                                                                   |
| `getCaseStudyBySlug(slug)`                | `caseStudies_${slug}`, `caseStudies_list`                                                                                       |
| `getPostBySlug(slug)`                     | `posts_${slug}`, `posts_list`                                                                                                   |
| `getServiceBySlug(slug)`                  | `services_${slug}`, `services_list`                                                                                             |
| `getServicePillarBySlug(slug)`            | `servicePillars_${slug}`, `servicePillars_list`                                                                                 |
| `getWorkshopBySlug(slug)`                 | `workshops_${slug}`, `workshops_list`                                                                                           |
| `list readers` (e.g. `listCaseStudies()`) | `${collection}_list`                                                                                                            |

> **Open verification (tasks must close)**: confirm exactly what `buildRevalidatePlan` emits for the three globals (`homepage`/`siteSettings`/`navigation`) — the §1 fact-find showed globals emit path `/`; the **tag** they emit (`_list`? bare slug?) must be read from source and the readers tagged identically. The §Testing tag-parity test pins this so it can't drift.

`generateStaticParams` and list readers must pass `overrideAccess: false` (or query with the published filter) so **drafts never enter the static manifest or a public list** — this preserves the spec 003 US5 draft-leak invariant on the public side.

## 4. User-story → route → test mapping

| US                      | Route(s)                            | Data                                                         | Load-bearing test                                                                                      |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| US1 Homepage            | `/`                                 | `homepage` global + chrome globals                           | E2E: `/` 200, homepage sections present, no placeholder. Int: `getHomepage` tags == plan tags.         |
| US2 Flagship case study | `/case-studies/[slug]`              | `caseStudies` (+ `testimonial`, `industry`)                  | E2E: detail renders structured fields + named testimonial. Int: `generateStaticParams` published-only. |
| US3 Team                | `/team`                             | `teamMembers` (public read)                                  | E2E: `TeamGrid` renders leadership + members with photos.                                              |
| US4 Workshop            | `/touchstone-workshops/[slug]`      | `workshops` + placeholder `hubspot-form`                     | E2E: detail renders; placeholder form block mounts (live HubSpot deferred, research §D10).             |
| US5 Localshoring        | `/localshoring` (pages, flat — §D5) | `pages.layout` (`comparison-table`, `content`, `two-column`) | E2E: page renders comparison narrative.                                                                |
| Cross                   | redirects, errors, preview          | next.config map; error pages; `/preview`                     | Int: redirect shape + `permanent`; `notFound()`→404; E2E preview round-trip.                           |

## 5. Entity field dependencies (verified, pointer to 003)

The templates read these fields; all confirmed present in the live config (see research.md drift notes for the exceptions):

- **`pages`**: `slug`, `title`, `layout` (blocks), `seo.{metaTitle,metaDescription,ogImage}`, `_status`, `publishedAt`. Versions/drafts on.
- **`caseStudies`**: `slug`, `title`, structured `problem`/`solution`/`impact` (richText), `industry` (req. rel), `services` (hasMany), `testimonial` (opt rel), `relatedCaseStudies` (≤3), `seo.*`, `metrics` array. Versions/drafts on. **No `layout` array** (Shape B).
- **`posts`**: `slug`, `title`, `content` (richText + inline blocks), `author` (req rel → `teamMembers`), `categories` (hasMany), `relatedPosts` (≤3), `seo.*`. Public URL `/insights/${slug}`. (Shape C.)
- **`services`**: `slug`, `pillar` (**required** rel → `servicePillars`, drives nested URL), `description`/`approach` (richText), `deliverables` (array), `faq` (array), `seo.*`. (Shape B; research §D4.)
- **`servicePillars`**: `slug`, `description` (richText), `heroImage`, `seo.*`. No `publishedAt`; live preview not wired in P2.
- **`teamMembers`**: `slug` (from `name`), `name`, `title`, `role`, `photo` (req), `bio` (richText), `expertise`/`certifications`/`education` (arrays), `isLeadership`, `order`. **No drafts, public read (`() => true`), no `seo` group** (metadata is static — research §D7).
- **`workshops`**: `slug`, `title`, `description`/`format`/`audience` (richText), `facilitator` (rel), `testimonial` (rel), `seo.*`. Public URL `/touchstone-workshops/${slug}`.
- **`homepage` global**: `hero` group, `stats` array, `featuredCaseStudy` rel, `brandTeaser` group, `clientLogos` array, `featuredTestimonials` (≤3). **No `layout` array** (Shape B; research §D3). Versions/drafts on.
- **`siteSettings` / `navigation` globals**: chrome data consumed by `layout.tsx` (header/footer/nav). Read by every page via the cached chrome readers.
