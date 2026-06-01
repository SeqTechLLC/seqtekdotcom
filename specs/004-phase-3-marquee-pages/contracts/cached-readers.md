# Contract — Cached Payload Readers (`src/lib/payload.ts`)

The ISR correctness of the whole render layer depends on this contract. Each public read is wrapped in `unstable_cache` with tags that **exactly match** `buildRevalidatePlan`'s output, so the already-shipped `revalidateOnChange` hook invalidates them.

## Reader factory shape

```ts
import { unstable_cache } from 'next/cache'

export const getCaseStudyBySlug = (slug: string) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadInstance()
      const { docs } = await payload.find({
        collection: 'caseStudies',
        where: { slug: { equals: slug } },
        draft: false,
        overrideAccess: false, // apply published filter — no draft leak
        depth: 2,
        limit: 1,
      })
      return docs[0] ?? null
    },
    ['caseStudies', slug], // key parts
    { tags: [`caseStudies_${slug}`, 'caseStudies_list'], revalidate: 3600 },
  )()
```

Draft reads are **not** cached — the template calls Payload directly with `draft: true` when `draftMode().isEnabled` (see route-render.md). `unstable_cache` auto-bypasses under draft mode anyway (verified: `unstable-cache.js` lines 146/207), so a stray cached call can't serve stale draft data.

## Tag table (must match `buildRevalidatePlan`)

| Reader                                  | Tags                                            |
| --------------------------------------- | ----------------------------------------------- |
| `getPageBySlug(slug)`                   | `pages_${slug}`, `pages_list`                   |
| `getCaseStudyBySlug(slug)`              | `caseStudies_${slug}`, `caseStudies_list`       |
| `getPostBySlug(slug)`                   | `posts_${slug}`, `posts_list`                   |
| `getServiceBySlug(slug)`                | `services_${slug}`, `services_list`             |
| `getServicePillarBySlug(slug)`          | `servicePillars_${slug}`, `servicePillars_list` |
| `getWorkshopBySlug(slug)`               | `workshops_${slug}`, `workshops_list`           |
| `listX()` (each listing)                | `${collection}_list`                            |
| `getHomepage()`                         | `homepage_list`                                 |
| `getSiteSettings()` / `getNavigation()` | `siteSettings_list` / `navigation_list`         |

**Global tags — verified (T003, closes data-model §3).** `buildRevalidatePlan('<global>', doc)` emits exactly `['<global>_list']` for `homepage` / `siteSettings` / `navigation` (no per-slug tag — globals carry no `slug`, so the per-slug loop never runs) plus the path `/`. Confirmed against `src/payload/hooks/revalidateOnChange.ts:47` (`tags` seeded with `${collection}_list`) and `:84-91` (the global block pushes path `/`, not a tag). Pinned by `tests/int/lib/payload-cache-tags.int.spec.ts` (C3). The readers register these via `globalCacheTags('<global>')`.

## Invariants (testable)

| #   | Invariant                                                                                           | Test                                                                   |
| --- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| C1  | For each collection, the reader's `tags` array `===` `buildRevalidatePlan(collection, {slug}).tags` | integration (`payload-cache-tags.int.spec.ts`) — **the keystone test** |
| C2  | Readers query with `overrideAccess: false` (or explicit published filter)                           | integration / code assertion                                           |
| C3  | Globals' reader tags match the hook's global plan                                                   | integration                                                            |
| C4  | `getPayloadInstance()` stays the single Payload init site (no `getPayload({config})` in templates)  | grep/lint check                                                        |

## Migration note

The existing `getHomepage` / `getSiteSettings` / `getNavigation` use **only** `React.cache` (per-request dedupe). Spec 004 layers `unstable_cache` (cross-request, tagged) **inside** the `React.cache` wrapper so both properties hold: one Postgres round-trip per request _and_ tag-based cross-request invalidation. Order: `cache(async () => unstable_cache(read, key, { tags })())`.
