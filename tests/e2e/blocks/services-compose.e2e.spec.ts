import { expect, test } from '@playwright/test'
import type { Payload } from 'payload'

import { getPayloadClient, lexical } from '../helpers/seedInScopeRoutes'
import { revalidateDevCache } from '../helpers/revalidateDevCache'
import { warmRoute } from '../helpers/warmRoute'

// spec 010 US2 + feat/services-restructure — a service offering is a
// block-composed Page rendered through the generic `/services/[offering]` route
// (the old nested `/services/[pillar]/[slug]` IA + pillar-match guard were
// removed). Mirrors workshops-compose: a Page edited via the Local API is
// editor-rearrangeable with NO deploy — reordering two blocks + publish flips
// the public DOM order, and the breadcrumb JSON-LD is intact (FR-006).
//
// The offering route hard-codes the slug it reads, so we seed against the real
// `localshoring` offering Page slug rather than an ad-hoc fixture slug.

const OFFERING = 'localshoring'
const SLUG = 'service-localshoring' // the Page slug `/services/localshoring` reads
const TITLE = 'E2E Compose Localshoring'
const ALPHA = 'SVC-BLOCK-ALPHA-first-section'
const BRAVO = 'SVC-BLOCK-BRAVO-second-section'

let payload: Payload

const layoutAlphaFirst = [
  { blockType: 'content', width: 'standard', background: 'none', body: lexical(ALPHA) },
  { blockType: 'content', width: 'standard', background: 'none', body: lexical(BRAVO) },
]
const layoutBravoFirst = [
  { blockType: 'content', width: 'standard', background: 'none', body: lexical(BRAVO) },
  { blockType: 'content', width: 'standard', background: 'none', body: lexical(ALPHA) },
]

test.beforeAll(async () => {
  payload = await getPayloadClient()
  await payload.delete({
    collection: 'pages',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'pages',
    data: {
      title: TITLE,
      slug: SLUG,
      layout: layoutAlphaFirst as never,
      _status: 'published',
    },
    overrideAccess: true,
  })
})

test.afterAll(async () => {
  await payload.delete({
    collection: 'pages',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
})

test('offering /services/[offering] renders RenderBlocks body + breadcrumb', async ({
  page,
  request,
}) => {
  // Seeding ran in a separate process — bust the dev server's unstable_cache for
  // the Page detail tag before asserting (memory: E2E cache revalidation).
  await revalidateDevCache(request, [`pages_${SLUG}`, 'pages_list'])

  await warmRoute(request, `/services/${OFFERING}`, ALPHA)
  await page.goto(`/services/${OFFERING}`)
  const article = page.getByTestId('service-offering')
  await expect(article).toHaveAttribute('data-offering', OFFERING)

  const text = await article.innerText()
  expect(text).toContain(ALPHA)
  expect(text).toContain(BRAVO)
  // Initial order: ALPHA before BRAVO.
  expect(text.indexOf(ALPHA)).toBeLessThan(text.indexOf(BRAVO))

  // Breadcrumb JSON-LD present on the offering route (Home › Services › offering).
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.some((s) => s.includes('BreadcrumbList'))).toBe(true)

  // Unknown offering 404s (the route only maps the three known offerings).
  const wrong = await page.goto('/services/not-an-offering')
  expect(wrong?.status()).toBe(404)
})

test('reordering two blocks + publish flips the public DOM order with no deploy', async ({
  page,
  request,
}) => {
  // Editor action: swap the two blocks and publish — a pure content edit.
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
    limit: 1,
  })
  await payload.update({
    collection: 'pages',
    id: docs[0].id,
    data: { layout: layoutBravoFirst as never, _status: 'published' },
    overrideAccess: true,
  })
  // The mutation ran in this process, not the dev server — bust its cache.
  await revalidateDevCache(request, [`pages_${SLUG}`, 'pages_list'])

  await warmRoute(request, `/services/${OFFERING}`, BRAVO)
  await page.goto(`/services/${OFFERING}`)
  const text = await page.getByTestId('service-offering').innerText()
  expect(text).toContain(ALPHA)
  expect(text).toContain(BRAVO)
  // Order is now reversed — reflecting the reorder, with no code change.
  expect(text.indexOf(BRAVO)).toBeLessThan(text.indexOf(ALPHA))
})
