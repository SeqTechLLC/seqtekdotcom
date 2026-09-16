// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import {
  buildRevalidatePlan,
  revalidateOnChange,
} from '../../../src/payload/hooks/revalidateOnChange'

/**
 * T124 / R-03 / FR-026 / FR-027 / spec 003 Polish.
 *
 * Two contracts:
 *   1. The published-state transition guard — afterChange should produce an
 *      empty plan for draft → draft saves (no cache work), but a non-empty
 *      plan for any save that touches the published state on either side.
 *   2. The per-collection routing — `buildRevalidatePlan` knows which paths
 *      and tags to dirty for each collection. Pin the mapping so a future
 *      refactor can't silently drop a slug-to-path rule.
 *   3. The hook must never throw on AWS failure (R-03): the editor save
 *      mustn't roll back when CloudFront is unreachable.
 *
 * `next/cache.revalidateTag` is mocked because it throws outside a request
 * scope. `invalidateCloudFrontPaths` is mocked so we can assert against it
 * and simulate failure.
 */

// `revalidatePath` is mocked alongside `revalidateTag` because the hook now
// calls it for the site-wide (`navigation`) case. Leaving it out does not fail
// loudly — `runRevalidation` wraps the call in the same non-request-scope
// try/catch as the tag loop, so a missing mock is swallowed and the assertions
// below would pass while testing nothing.
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

// The hook module imports cloudfront via a relative specifier
// (`'../../lib/cloudfront/invalidate'`), so the mock has to register
// against that exact resolved-relative-path specifier, not the `@/` alias.
// Vitest keys module mocks by specifier string; alias vs. relative don't
// match even when they resolve to the same file.
vi.mock('../../../src/lib/cloudfront/invalidate', () => ({
  invalidateCloudFrontPaths: vi.fn(async () => ({ invalidated: 0, skipped: true })),
}))

const cloudfrontModule = await import('../../../src/lib/cloudfront/invalidate')
const invalidateCloudFrontPaths = vi.mocked(cloudfrontModule.invalidateCloudFrontPaths)

describe('buildRevalidatePlan — published-state guard', () => {
  it('returns empty plan for draft → draft transition', () => {
    const plan = buildRevalidatePlan(
      'pages',
      { _status: 'draft', slug: 'home' },
      { _status: 'draft', slug: 'home' },
    )
    expect(plan.tags).toEqual([])
    expect(plan.paths).toEqual([])
  })

  it('returns non-empty plan for draft → published transition', () => {
    const plan = buildRevalidatePlan(
      'pages',
      { _status: 'published', slug: 'home' },
      { _status: 'draft', slug: 'home' },
    )
    expect(plan.tags.length).toBeGreaterThan(0)
    expect(plan.paths.length).toBeGreaterThan(0)
  })

  it('returns non-empty plan for published → draft transition (unpublish)', () => {
    const plan = buildRevalidatePlan(
      'pages',
      { _status: 'draft', slug: 'home' },
      { _status: 'published', slug: 'home' },
    )
    expect(plan.tags.length).toBeGreaterThan(0)
  })

  it('returns non-empty plan for non-draftable collections (every save publishes)', () => {
    // teamMembers has no _status field; every save should bust caches.
    const plan = buildRevalidatePlan('teamMembers', { slug: 'jane-doe' })
    expect(plan.tags.length).toBeGreaterThan(0)
  })
})

describe('buildRevalidatePlan — per-collection routing', () => {
  it.each([
    { collection: 'pages', slug: 'our-story', detailIncludes: '/our-story' },
    { collection: 'posts', slug: 'first-post', detailIncludes: '/insights/first-post' },
    { collection: 'caseStudies', slug: 'case-1', detailIncludes: '/case-studies/case-1' },
    { collection: 'services', slug: 'svc-1', detailIncludes: '/services/svc-1' },
    {
      collection: 'workshops',
      slug: 'ws-1',
      detailIncludes: '/workshops/ws-1',
    },
    { collection: 'industries', slug: 'energy', detailIncludes: '/industries/energy' },
    { collection: 'locations', slug: 'tulsa', detailIncludes: '/consulting/tulsa' },
    {
      collection: 'categories',
      slug: 'ai',
      detailIncludes: '/insights/category/ai',
    },
  ])('$collection routes to $detailIncludes', ({ collection, slug, detailIncludes }) => {
    const plan = buildRevalidatePlan(collection, { _status: 'published', slug })
    expect(plan.paths).toContain(detailIncludes)
  })

  // A detail route whose index also lists it has to bust BOTH, or the card goes
  // stale for `revalidate: 3600` and CloudFront is never invalidated for the
  // index path. `/industries` is the subtle one: it is a `pages` doc on the
  // `/[slug]` catch-all rather than a route file, so it does not look like an
  // index — but it carries an `industry-grid`.
  it.each([
    { collection: 'partners' as const, slug: 'p-1', index: '/partners' },
    { collection: 'industries' as const, slug: 'energy', index: '/industries' },
    { collection: 'categories' as const, slug: 'ai', index: '/insights' },
  ])('$collection also busts its index $index', ({ collection, slug, index }) => {
    const plan = buildRevalidatePlan(collection, { _status: 'published', slug })
    expect(plan.paths).toContain(index)
    expect(plan.tags).toContain(`${collection}_list`)
    expect(plan.tags).toContain(`${collection}_${slug}`)
  })

  // The above is necessary and NOT sufficient, which cost a review round.
  // `paths` reach only `invalidateCloudFrontPaths`; `revalidateTag` runs on
  // `tags`. `/industries` is a `pages` doc, so its payload is cached under
  // `pages_industries` — a tag no `industries_*` change emits. Without it the
  // Next data cache served the hour-old page while the sitemap, tagged
  // `industries_list`, advertised the URL immediately.
  //
  // (The path push buys nothing here today: `edge-stack.ts` sets the default
  // behaviour to CACHING_DISABLED, so HTML routes are never edge-cached.)
  it('busts the pages-doc cache behind /industries, not just the CDN path', () => {
    const plan = buildRevalidatePlan('industries', { _status: 'published', slug: 'energy' })
    expect(plan.tags).toContain('pages_industries')
  })

  it('includes both old and new slug paths when slug changes', () => {
    const plan = buildRevalidatePlan(
      'posts',
      { _status: 'published', slug: 'new-slug' },
      { _status: 'published', slug: 'old-slug' },
    )
    expect(plan.paths).toContain('/insights/new-slug')
    expect(plan.paths).toContain('/insights/old-slug')
  })

  it('homepage / testimonials all bust /', () => {
    for (const collection of ['homepage', 'testimonials']) {
      const plan = buildRevalidatePlan(collection, { _status: 'published' })
      expect(plan.paths).toContain('/')
    }
  })

  it('every plan includes /sitemap.xml so generators re-render', () => {
    const plan = buildRevalidatePlan('pages', { _status: 'published', slug: 'about' })
    expect(plan.paths).toContain('/sitemap.xml')
  })
})

// ADR 0010 amendment. `navigation` is the only collection whose blast radius is
// the whole site: `SiteHeader` renders in the root layout, so a menu publish
// changes every page rather than a list of them.
describe('buildRevalidatePlan — navigation is site-wide', () => {
  it('marks a nav publish as everything, and tags the reader the nav registers', () => {
    const plan = buildRevalidatePlan('navigation', { _status: 'published' })
    expect(plan.everything).toBe(true)
    // The tag `getNavigation`'s `unstable_cache` entry is registered under.
    expect(plan.tags).toContain('navigation_list')
    expect(plan.paths).toContain('/')
  })

  it('leaves every other collection alone', () => {
    for (const collection of ['pages', 'posts', 'services', 'homepage']) {
      expect(buildRevalidatePlan(collection, { _status: 'published', slug: 'x' }).everything).toBe(
        false,
      )
    }
  })

  it('still respects the draft guard — an unpublished nav edit busts nothing', () => {
    const plan = buildRevalidatePlan('navigation', { _status: 'draft' }, { _status: 'draft' })
    expect(plan.everything).toBe(false)
    expect(plan.tags).toEqual([])
    expect(plan.paths).toEqual([])
  })
})

/**
 * SOURCE-LEVEL, which is this repo's own precedent rather than a shortcut —
 * the same reason `payload-cache-tags.int.spec.ts` greps for
 * `overrideAccess: false` instead of watching a call happen.
 *
 * A spy cannot do this job here. `vitest.config.mts` runs the int suite with
 * `isolate: false` and a single worker, so the module registry is SHARED across
 * files: whichever file's `vi.mock('next/cache')` factory registers first is
 * the instance `revalidateOnChange.ts` binds, and a spy declared in this file
 * never sees the call when another file (`tests/int/api/revalidate.int.spec.ts`
 * mocks it too) got there first. That is not hypothetical — the spy version of
 * this test passed when the file ran alone and failed in the full suite. Worse,
 * `runRevalidation` swallows the resulting TypeError by design (R-03), so the
 * miss is silent in both directions.
 *
 * What has to hold is the PAIRING: `plan.everything` guards a real
 * `revalidatePath('/', 'layout')`, and the import behind it exists. Asserted
 * where no module registry can take it away.
 */
/**
 * A menu item derives its URL from a relationship, and `getNavigation` caches
 * the DERIVED result under `navigation_list`. So a linked document can break the
 * header in two ways, and the first cut of this guard only covered one.
 */
describe('buildRevalidatePlan — a linked document busts the cached menu', () => {
  const NAV_LINKABLE = [
    'pages',
    'services',
    'workshops',
    'industries',
    'posts',
    'caseStudies',
    'partners',
  ]

  it.each(NAV_LINKABLE)('%s: a slug RENAME busts the menu site-wide', (collection) => {
    const plan = buildRevalidatePlan(
      collection,
      { _status: 'published', slug: 'new-slug' },
      { _status: 'published', slug: 'old-slug' },
    )
    expect(plan.tags).toContain('navigation_list')
    expect(plan.everything).toBe(true)
  })

  // The door the rename guard missed: the slug is unchanged, so `slugRenamed`
  // is false, but the route now 404s (readers are published-only, C2) while the
  // cached menu keeps serving the URL for up to an hour.
  it.each(NAV_LINKABLE)('%s: an UNPUBLISH busts the menu site-wide', (collection) => {
    const plan = buildRevalidatePlan(
      collection,
      { _status: 'draft', slug: 'same-slug' },
      { _status: 'published', slug: 'same-slug' },
    )
    expect(plan.tags).toContain('navigation_list')
    expect(plan.everything).toBe(true)
  })

  it('an ordinary re-publish does NOT bust the whole site', () => {
    // The guard must be the published -> draft transition, not any status
    // change: gating on `hasStatus` would bust every page on every publish.
    const plan = buildRevalidatePlan(
      'pages',
      { _status: 'published', slug: 'same-slug' },
      { _status: 'published', slug: 'same-slug' },
    )
    expect(plan.tags).not.toContain('navigation_list')
    expect(plan.everything).toBe(false)
  })

  it('a first publish (no previous doc) does NOT bust the whole site', () => {
    const plan = buildRevalidatePlan('pages', { _status: 'published', slug: 'brand-new' })
    expect(plan.tags).not.toContain('navigation_list')
    expect(plan.everything).toBe(false)
  })

  it('a collection the menu cannot link to is unaffected by either door', () => {
    // `teamMembers` is routed but deliberately not in NAV_LINKABLE_COLLECTIONS.
    for (const previous of [
      { _status: 'published', slug: 'old' },
      { _status: 'published', slug: 'jane' },
    ] as const) {
      const plan = buildRevalidatePlan('teamMembers', { _status: 'draft', slug: 'jane' }, previous)
      expect(plan.tags).not.toContain('navigation_list')
      expect(plan.everything).toBe(false)
    }
  })
})

describe('runRevalidation — the site-wide bust is wired, not just planned', () => {
  const hookSource = readFileSync(
    resolve(process.cwd(), 'src/payload/hooks/revalidateOnChange.ts'),
    'utf8',
  )

  it('guards a revalidatePath("/", "layout") behind the everything flag', () => {
    expect(hookSource).toMatch(/if\s*\(\s*plan\.everything\s*\)/)
    expect(hookSource).toMatch(/revalidatePath\(\s*['"]\/['"]\s*,\s*['"]layout['"]\s*\)/)
  })

  it('imports revalidatePath, so the call is not a silently-undefined no-op', () => {
    // The exact failure the shared registry produces: the name resolves to
    // undefined, the call throws, R-03's catch eats it, and the menu quietly
    // does not update for an hour.
    expect(hookSource).toMatch(/import\s*\{[^}]*revalidatePath[^}]*\}\s*from\s*'next\/cache'/)
  })
})

describe('revalidateOnChange hook — safety', () => {
  it('hook never throws when CloudFront invalidation fails', async () => {
    invalidateCloudFrontPaths.mockRejectedValueOnce(new Error('CloudFront 503'))
    const hook = revalidateOnChange('pages')
    const result = hook({
      doc: { _status: 'published', slug: 'safe' },
      previousDoc: { _status: 'draft', slug: 'safe' },
      // The rest of the hook arg surface is unused; the hook only reads doc/previousDoc.
    } as unknown as Parameters<ReturnType<typeof revalidateOnChange>>[0])
    await expect(result).resolves.toBeDefined()
  })

  it('global hook routes the homepage global to /', () => {
    // `buildRevalidatePlan` covers the per-collection routing matrix above.
    // For globals the route is identical — `homepage` is the only one left.
    // map to `/`. Asserted directly against the plan builder rather than
    // observing the SDK mock (the cross-file mock visibility is fragile
    // when this file runs alongside int tests that fire the real hook
    // through `payload.create`).
    const plan = buildRevalidatePlan('homepage', { _status: 'published' }, { _status: 'published' })
    expect(plan.paths).toContain('/')
    expect(plan.tags).toContain('homepage_list')
  })
})
