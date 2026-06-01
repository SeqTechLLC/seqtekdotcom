// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

// `src/lib/payload.ts` opens with `import 'server-only'` — mock it so the
// readers (which back generateStaticParams) are importable under Vitest.
vi.mock('server-only', () => ({}))

import { getPayloadInstance, findPublishedSlugs, findPublishedList } from '../../../src/lib/payload'

/**
 * spec 004 T010 — the published-slug data-layer (invariant R3). The
 * `findPublished*` reads that back `publishedSlugsFor` / the `listX` readers
 * MUST return published rows only, so a draft never leaks into the SITEMAP or a
 * public listing. (Per ADR 0005 the detail routes dropped `generateStaticParams`
 * — the layout's CSP nonce forces dynamic rendering — so `publishedSlugsFor`
 * now feeds `/sitemap.xml` rather than a static manifest; the no-draft-leak
 * guarantee is identical and still the spec-003 US5 invariant on the public side.)
 *
 * We assert against the raw `findPublished*` reads rather than the
 * `unstable_cache`-wrapped public readers: `unstable_cache` throws outside the
 * Next server (`incrementalCache missing`), and the wrappers add only the tag
 * caching that the keystone test (T009) already pins. The published filter —
 * the thing R3 is about — lives entirely in these reads.
 *
 * Per-route `generateStaticParams()` output assertions extend this file in the
 * user-story phases (US2 case studies, services, etc.).
 *
 * Fixtures use `pages` and `servicePillars` — the two in-scope collections
 * with no REQUIRED relationship fields — so a *published* row can be created
 * without standing up media/industry fixtures.
 */

const PREFIX = 'static-params-fixture'
let payload: Payload

beforeAll(async () => {
  payload = await getPayloadInstance()
})

afterAll(async () => {
  for (const collection of ['pages', 'servicePillars', 'caseStudies'] as const) {
    await payload.delete({
      collection,
      where: { slug: { like: `${PREFIX}-%` } },
      overrideAccess: true,
    })
  }
})

describe('R3 — publishedSlugsFor returns published slugs only', () => {
  const publishedSlug = `${PREFIX}-page-published`
  const draftSlug = `${PREFIX}-page-draft`

  beforeAll(async () => {
    await payload.delete({
      collection: 'pages',
      where: { slug: { like: `${PREFIX}-page-%` } },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'pages',
      data: { title: 'Published Static Params Page', slug: publishedSlug, _status: 'published' },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'pages',
      data: { title: 'Draft Static Params Page', slug: draftSlug },
      draft: true,
      overrideAccess: true,
    })
  })

  it('includes the published slug', async () => {
    const slugs = await findPublishedSlugs('pages')
    expect(slugs).toContain(publishedSlug)
  })

  it('excludes the draft slug (no draft leak into the manifest)', async () => {
    const slugs = await findPublishedSlugs('pages')
    expect(slugs).not.toContain(draftSlug)
  })
})

describe('R3 — list readers return published rows only', () => {
  const publishedSlug = `${PREFIX}-pillar-published`
  const draftSlug = `${PREFIX}-pillar-draft`

  beforeAll(async () => {
    await payload.delete({
      collection: 'servicePillars',
      where: { slug: { like: `${PREFIX}-pillar-%` } },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'servicePillars',
      data: { title: 'Published Pillar', slug: publishedSlug, _status: 'published' },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'servicePillars',
      data: { title: 'Draft Pillar', slug: draftSlug },
      draft: true,
      overrideAccess: true,
    })
  })

  it('the published servicePillars list includes the published row and excludes the draft', async () => {
    const pillars = (await findPublishedList('servicePillars', { sort: 'order' })) as Array<{
      slug?: string | null
    }>
    const slugs = pillars.map((p) => p.slug)
    expect(slugs).toContain(publishedSlug)
    expect(slugs).not.toContain(draftSlug)
  })
})

describe('R3 — case-studies static params exclude drafts (US2 / T015)', () => {
  // caseStudies requires media/industry to PUBLISH, so we assert the
  // draft-exclusion half directly (a draft slug must never enter the manifest);
  // the published-inclusion half is covered generically by the `pages` /
  // `servicePillars` fixtures above.
  const draftSlug = `${PREFIX}-case-draft`

  beforeAll(async () => {
    await payload.delete({
      collection: 'caseStudies',
      where: { slug: { like: `${PREFIX}-case-%` } },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'caseStudies',
      data: { title: 'Draft Static Params Case', slug: draftSlug },
      draft: true,
      overrideAccess: true,
    })
  })

  it('findPublishedSlugs(caseStudies) excludes the draft (route generateStaticParams source)', async () => {
    const slugs = await findPublishedSlugs('caseStudies')
    expect(slugs).not.toContain(draftSlug)
  })
})
