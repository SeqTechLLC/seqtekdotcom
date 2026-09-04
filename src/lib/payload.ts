import 'server-only'

import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import type {
  Homepage,
  Page,
  CaseStudy,
  Post,
  Service,
  Workshop,
  TeamMember,
  Partner,
  Industry,
} from '@/payload-types'

// spec 004 Phase 2 (Foundational). The ISR correctness of every public route
// rests on this module: each read is wrapped in `unstable_cache` with `tags`
// that EXACTLY mirror `buildRevalidatePlan`'s output, so the already-shipped
// `revalidateOnChange` afterChange hook (which calls `revalidateTag(...)`)
// invalidates them on publish. The keystone test
// `tests/int/lib/payload-cache-tags.int.spec.ts` (invariant C1) pins the tag
// helpers below against `buildRevalidatePlan` — drift there is a silent
// stale-page regression, so treat any red there as a build-breaker.

let payloadPromise: Promise<Payload> | null = null

/**
 * Module-level singleton — initialise Payload exactly once per Node process
 * (invariant C4: the single `getPayload({ config })` site; templates and
 * readers go through here, never `getPayload` directly).
 */
export const getPayloadInstance = (): Promise<Payload> => {
  if (!payloadPromise) {
    payloadPromise = getPayload({ config })
  }
  return payloadPromise
}

// ---------------------------------------------------------------------------
// Read-timeout layer (spec 007 US3 — ERROR_PAGES §5 / ADR 0007)
// ---------------------------------------------------------------------------
// Every cached public reader is wrapped, as the OUTERMOST layer, in a 5s budget.
// A hung read fails fast to the branded `error.tsx` instead of holding a
// response thread, and emits a correlated warn log. `headers()` is read in the
// wrapper's catch — which runs in the RSC render scope where it is legal — and
// MUST NOT move inside `unstable_cache` (it throws there). The losing query is
// orphaned (Payload's Local API takes no AbortSignal, so there is nothing to
// cancel; Promise.race frees the response thread). Cache hits are a no-op
// beyond one setTimeout/clearTimeout (FR-013).

export const READ_TIMEOUT_MS = 5000

/**
 * Dev/test-only sentinel. A reader called with this value as its first arg
 * sleeps past the budget so the timeout path can be exercised end-to-end
 * (US3 E2E `slow-request.e2e.spec.ts`). Ignored when NODE_ENV === 'production',
 * and per-call (keyed on the arg) so it never affects any other reader or any
 * other test sharing the dev server. Visiting e.g. `/case-studies/__timeout_probe__`
 * triggers it through the real `getCaseStudyBySlug` call site.
 */
export const TEST_TIMEOUT_PROBE_SLUG = '__timeout_probe__'

export class PayloadReadTimeoutError extends Error {
  readonly reader: string
  constructor(reader: string) {
    super(`Payload read "${reader}" exceeded ${READ_TIMEOUT_MS}ms`)
    this.name = 'PayloadReadTimeoutError'
    this.reader = reader
  }
}

export function withReadTimeout<A extends unknown[], T>(
  label: string,
  fn: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  return async (...args: A): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new PayloadReadTimeoutError(label)), READ_TIMEOUT_MS)
    })
    const work = (async (): Promise<T> => {
      if (process.env.NODE_ENV !== 'production' && args[0] === TEST_TIMEOUT_PROBE_SLUG) {
        await new Promise((resolve) => setTimeout(resolve, READ_TIMEOUT_MS + 1_000))
      }
      return fn(...args)
    })()
    try {
      return await Promise.race([work, timeout])
    } catch (err) {
      if (err instanceof PayloadReadTimeoutError) {
        let requestId = 'unknown'
        try {
          requestId = (await headers()).get('x-request-id') ?? 'unknown'
        } catch {
          // Non-request scope (e.g. sitemap.ts ISR, revalidate=3600): headers()
          // is unavailable and throws. The correlation id is best-effort.
          requestId = 'unknown'
        }
        console.warn(
          JSON.stringify({
            type: 'payload_read_timeout',
            ts: new Date().toISOString(),
            requestId,
            reader: label,
            args: args.length > 0 ? String(args[0]) : undefined,
          }),
        )
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
}

// ---------------------------------------------------------------------------
// Cache-tag contract (MUST mirror buildRevalidatePlan — invariant C1/C3)
// ---------------------------------------------------------------------------

/** Tags a collection detail reader registers: `${c}_${slug}` + `${c}_list`. */
export const detailCacheTags = (collection: string, slug: string): string[] => [
  `${collection}_${slug}`,
  `${collection}_list`,
]

/** Tag a listing / static-params reader registers: `${c}_list`. */
export const listCacheTags = (collection: string): string[] => [`${collection}_list`]

/**
 * Tag a global reader registers. `buildRevalidatePlan('<global>', …)` emits
 * `['<global>_list']` (globals carry no slug, so no per-slug tag) — verified
 * against `revalidateOnChange.ts` and pinned by the keystone test.
 */
export const globalCacheTags = (globalSlug: string): string[] => [`${globalSlug}_list`]

const ONE_HOUR = 3600

/** Collections this spec renders that carry a `slug` + published filter. */
type SluggedCollection =
  | 'pages'
  | 'caseStudies'
  | 'posts'
  | 'services'
  | 'workshops'
  | 'teamMembers'
  | 'partners'
  | 'industries'

// ---------------------------------------------------------------------------
// Chrome globals — layered React.cache → unstable_cache
// ---------------------------------------------------------------------------
// `React.cache` dedupes within a single render pass (one Postgres round-trip
// per request even though header + footer + page all read these). The inner
// `unstable_cache` adds cross-request, tag-invalidated caching so an editor
// publish busts them via the hook. Order matters — cached-readers.md
// §Migration note: cache(async () => unstable_cache(read, key, { tags })()).
// Under draft mode `unstable_cache` auto-bypasses, so preview never serves
// or pollutes the published cache. `withReadTimeout` wraps the OUTSIDE of the
// cache stack (spec 007 — so headers() is legal in its catch).

// spec 011 T015 (FR-003/FR-005): `getSiteSettings` and `getNavigation` were
// deleted here. Site chrome is code-owned (ADR 0010) — the header, footer, nav
// and the seven values the render path used to read from the `siteSettings`
// global now come from `src/lib/site-content.ts`. `getNavigation` had zero
// callers even before that; leaving either in place would be the same
// looks-wired-but-isn't trap one layer down.

export const getHomepage = withReadTimeout(
  'getHomepage',
  cache(
    async (): Promise<Homepage> =>
      unstable_cache(
        async () => {
          const payload = await getPayloadInstance()
          // `overrideAccess: false` matters for the POPULATED RELATIONS, not
          // for the global itself: `publishedOrAuthedGlobal` returns a
          // `_status: published` constraint for an anonymous read rather than
          // denying it, so the homepage still resolves. Payload's local API
          // defaults this to TRUE and threads it into the dataloader key for
          // every related document, so without it a hand-picked relation to a
          // DRAFTS-ENABLED collection populates a full draft. Missing this
          // contradicted invariant C2 above and is how a draft could reach a
          // public card.
          //
          // Deliberately not enumerating which blocks are exposed: `Homepage`
          // declares `blocks: [...layoutBlocks]`, so EVERY block is available
          // here and editors recompose the page without a deploy — any list
          // written today is stale tomorrow. It is more than the obvious ones:
          // `featured-case-study`, `industry-grid`, `related-posts`,
          // `workshop-list`, `service-pillar-cards`, and the four
          // source-driven grids whenever an author sets them to manual, since
          // `resolveLayout` short-circuits and leaves the depth-2 population
          // in place. (`logo-bar` and `testimonial-block` are NOT exposed:
          // `media` reads `() => true` and `testimonials` has no drafts.)
          return (await payload.findGlobal({
            slug: 'homepage',
            depth: 2,
            overrideAccess: false,
          })) as Homepage
        },
        ['global', 'homepage'],
        { tags: globalCacheTags('homepage'), revalidate: ONE_HOUR },
      )(),
  ),
)

// ---------------------------------------------------------------------------
// Collection detail readers — published-only, tagged
// ---------------------------------------------------------------------------
// `draft: false` + `overrideAccess: false` apply the `publishedOrAuthed`
// access filter with no editorial user => published rows only, no draft leak
// (invariant C2). Draft preview does NOT go through these readers; the route
// reads Payload directly with `draft: true` (see route-render.md / D2).

// The raw published reads below (`findPublished*`) are exported so the
// `generateStaticParams` data-layer test (T010 / invariant R3) can exercise
// the published filter directly — `unstable_cache` cannot run outside the Next
// server (`incrementalCache missing`). Production code calls the cached
// wrappers; the wrappers add only the tag caching that T009 pins. They run
// INSIDE `unstable_cache`, so they are NOT timeout-wrapped (headers() is
// illegal there, and they are test-only direct entry points).

export const findPublishedBySlug = async (collection: SluggedCollection, slug: string) => {
  const payload = await getPayloadInstance()
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    draft: false,
    overrideAccess: false,
    depth: 2,
    limit: 1,
  })
  return docs[0] ?? null
}

export const getPageBySlug = withReadTimeout(
  'getPageBySlug',
  (slug: string): Promise<Page | null> =>
    unstable_cache(
      async () => (await findPublishedBySlug('pages', slug)) as Page | null,
      ['pages', slug],
      { tags: detailCacheTags('pages', slug), revalidate: ONE_HOUR },
    )(),
)

export const getCaseStudyBySlug = withReadTimeout(
  'getCaseStudyBySlug',
  (slug: string): Promise<CaseStudy | null> =>
    unstable_cache(
      async () => (await findPublishedBySlug('caseStudies', slug)) as CaseStudy | null,
      ['caseStudies', slug],
      { tags: detailCacheTags('caseStudies', slug), revalidate: ONE_HOUR },
    )(),
)

export const getPostBySlug = withReadTimeout(
  'getPostBySlug',
  (slug: string): Promise<Post | null> =>
    unstable_cache(
      async () => (await findPublishedBySlug('posts', slug)) as Post | null,
      ['posts', slug],
      { tags: detailCacheTags('posts', slug), revalidate: ONE_HOUR },
    )(),
)

export const getServiceBySlug = withReadTimeout(
  'getServiceBySlug',
  (slug: string): Promise<Service | null> =>
    unstable_cache(
      async () => (await findPublishedBySlug('services', slug)) as Service | null,
      ['services', slug],
      { tags: detailCacheTags('services', slug), revalidate: ONE_HOUR },
    )(),
)

export const getWorkshopBySlug = withReadTimeout(
  'getWorkshopBySlug',
  (slug: string): Promise<Workshop | null> =>
    unstable_cache(
      async () => (await findPublishedBySlug('workshops', slug)) as Workshop | null,
      ['workshops', slug],
      { tags: detailCacheTags('workshops', slug), revalidate: ONE_HOUR },
    )(),
)

// spec 010 US2 (Phase E): teamMembers gains a block-composed `/team/[slug]`
// detail route (R7). Same cached-reader stack + tag parity as the others.
export const getTeamMemberBySlug = withReadTimeout(
  'getTeamMemberBySlug',
  (slug: string): Promise<TeamMember | null> =>
    unstable_cache(
      async () => (await findPublishedBySlug('teamMembers', slug)) as TeamMember | null,
      ['teamMembers', slug],
      { tags: detailCacheTags('teamMembers', slug), revalidate: ONE_HOUR },
    )(),
)

export const getPartnerBySlug = withReadTimeout(
  'getPartnerBySlug',
  (slug: string): Promise<Partner | null> =>
    unstable_cache(
      async () => (await findPublishedBySlug('partners', slug)) as Partner | null,
      ['partners', slug],
      { tags: detailCacheTags('partners', slug), revalidate: ONE_HOUR },
    )(),
)

export const getIndustryBySlug = withReadTimeout(
  'getIndustryBySlug',
  (slug: string): Promise<Industry | null> =>
    unstable_cache(
      async () => (await findPublishedBySlug('industries', slug)) as Industry | null,
      ['industries', slug],
      { tags: detailCacheTags('industries', slug), revalidate: ONE_HOUR },
    )(),
)

// ---------------------------------------------------------------------------
// Listing / static-params readers — published-only, list-tagged
// ---------------------------------------------------------------------------

export const findPublishedList = async (
  collection: SluggedCollection | 'teamMembers',
  // Payload's `Sort` is `string | string[]`; the array form is how a listing
  // gets a deterministic tiebreaker on a nullable primary sort key.
  opts: { sort?: string | string[]; depth?: number } = {},
) => {
  const payload = await getPayloadInstance()
  const { docs } = await payload.find({
    collection,
    draft: false,
    overrideAccess: false,
    depth: opts.depth ?? 1,
    limit: 200,
    pagination: false,
    ...(opts.sort ? { sort: opts.sort } : {}),
  })
  return docs
}

export const listCaseStudies = withReadTimeout(
  'listCaseStudies',
  (): Promise<CaseStudy[]> =>
    unstable_cache(
      async () => (await findPublishedList('caseStudies', { sort: '-publishedAt' })) as CaseStudy[],
      ['caseStudies', 'list'],
      { tags: listCacheTags('caseStudies'), revalidate: ONE_HOUR },
    )(),
)

export const listPosts = withReadTimeout(
  'listPosts',
  (): Promise<Post[]> =>
    unstable_cache(
      async () => (await findPublishedList('posts', { sort: '-publishedAt' })) as Post[],
      ['posts', 'list'],
      { tags: listCacheTags('posts'), revalidate: ONE_HOUR },
    )(),
)

export const listServices = withReadTimeout(
  'listServices',
  (): Promise<Service[]> =>
    unstable_cache(
      // depth 0 on purpose. SVC-2 gave `services` a full `layout` AND made
      // `items` a self-relation, so at any depth above 0 every group drags back
      // its services as complete documents — whole block trees, duplicated once
      // per group that cross-lists them — into an hour-long cache entry. The
      // one consumer, `resolveLayout`, reads `tier` and walks `items` by id.
      async () => (await findPublishedList('services', { sort: 'order', depth: 0 })) as Service[],
      ['services', 'list'],
      { tags: listCacheTags('services'), revalidate: ONE_HOUR },
    )(),
)

export const listWorkshops = withReadTimeout(
  'listWorkshops',
  (): Promise<Workshop[]> =>
    unstable_cache(
      async () => (await findPublishedList('workshops', { sort: 'order' })) as Workshop[],
      ['workshops', 'list'],
      { tags: listCacheTags('workshops'), revalidate: ONE_HOUR },
    )(),
)

export const listTeamMembers = withReadTimeout(
  'listTeamMembers',
  (): Promise<TeamMember[]> =>
    unstable_cache(
      // `teamMembers` is public-read with no drafts. Leadership-first ordering is
      // applied at the template (US3) — here we just sort by `order`.
      async () => (await findPublishedList('teamMembers', { sort: 'order' })) as TeamMember[],
      ['teamMembers', 'list'],
      { tags: listCacheTags('teamMembers'), revalidate: ONE_HOUR },
    )(),
)

// ADR 0009 metadata collection: the `/partners` index is generated from these
// docs (logo + summary + order), so adding a partner needs no code change.
// `order` is optional, so `name` is the tiebreaker — otherwise partners that
// share an order (or leave it blank) come back in whatever order Postgres
// happens to return, and the cached index shuffles between revalidations.
export const listPartners = withReadTimeout(
  'listPartners',
  (): Promise<Partner[]> =>
    unstable_cache(
      async () => (await findPublishedList('partners', { sort: ['order', 'name'] })) as Partner[],
      ['partners', 'list'],
      { tags: listCacheTags('partners'), revalidate: ONE_HOUR },
    )(),
)

/** Raw published-slug read — exported for the T010 R3 test (see note above). */
export const findPublishedSlugs = async (collection: SluggedCollection): Promise<string[]> => {
  const payload = await getPayloadInstance()
  const { docs } = await payload.find({
    collection,
    draft: false,
    overrideAccess: false,
    depth: 0,
    limit: 1000,
    pagination: false,
  })
  return docs
    .map((d) => (d as { slug?: string | null }).slug)
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
}

// ROADMAP IND-1. Industries specifically: `layout` was added by an ADDITIVE
// migration, so rows that predate it are published with no body. The route
// 404s those (an empty `<article>` with no `<h1>` is not a page), and the
// sitemap has to agree or it advertises a URL that 404s. Separate reader rather
// than a predicate on `findPublishedSlugs`, because that one is wrapped in
// `unstable_cache` keyed by collection and a callback cannot go in a cache key.
export const findPublishedIndustrySlugsWithBody = async (): Promise<string[]> => {
  const payload = await getPayloadInstance()
  const { docs } = await payload.find({
    collection: 'industries',
    draft: false,
    overrideAccess: false,
    depth: 0,
    limit: 1000,
    pagination: false,
  })
  return docs
    .filter((d) => ((d as { layout?: unknown[] | null }).layout ?? []).length > 0)
    .map((d) => (d as { slug?: string | null }).slug)
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
}

export const publishedIndustrySlugsWithBody = withReadTimeout(
  'publishedIndustrySlugsWithBody',
  (): Promise<string[]> =>
    unstable_cache(
      findPublishedIndustrySlugsWithBody,
      ['publishedSlugs', 'industries', 'withBody'],
      {
        tags: listCacheTags('industries'),
        revalidate: ONE_HOUR,
      },
    )(),
)

/**
 * Published slugs for a collection — feeds `generateStaticParams`. Published
 * filter (`overrideAccess: false`) so drafts never enter the static manifest
 * (invariant R3 / the spec-003 US5 draft-leak invariant on the public side).
 */
export const publishedSlugsFor = withReadTimeout(
  'publishedSlugsFor',
  (collection: SluggedCollection): Promise<string[]> =>
    unstable_cache(() => findPublishedSlugs(collection), ['publishedSlugs', collection], {
      tags: listCacheTags(collection),
      revalidate: ONE_HOUR,
    })(),
)
