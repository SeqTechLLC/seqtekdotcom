// @vitest-environment node
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

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
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
    { collection: 'pages', slug: 'about', detailIncludes: '/about' },
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
    expect(plan.tags).toContain(`${collection}_list`)
    expect(plan.tags).toContain(`${collection}_${slug}`)
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

  it('homepage / siteSettings / navigation / testimonials all bust /', () => {
    for (const collection of ['homepage', 'siteSettings', 'navigation', 'testimonials']) {
      const plan = buildRevalidatePlan(collection, { _status: 'published' })
      expect(plan.paths).toContain('/')
    }
  })

  it('every plan includes /sitemap.xml so generators re-render', () => {
    const plan = buildRevalidatePlan('pages', { _status: 'published', slug: 'about' })
    expect(plan.paths).toContain('/sitemap.xml')
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
    // For globals the route is identical — `homepage`/`siteSettings`/etc.
    // map to `/`. Asserted directly against the plan builder rather than
    // observing the SDK mock (the cross-file mock visibility is fragile
    // when this file runs alongside int tests that fire the real hook
    // through `payload.create`).
    const plan = buildRevalidatePlan('homepage', { _status: 'published' }, { _status: 'published' })
    expect(plan.paths).toContain('/')
    expect(plan.tags).toContain('homepage_list')
  })
})
