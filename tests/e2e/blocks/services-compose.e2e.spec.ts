import { expect, test } from '@playwright/test'
import type { Payload } from 'payload'

import { getPayloadClient, lexical } from '../helpers/seedInScopeRoutes'
import { revalidateDevCache } from '../helpers/revalidateDevCache'
import { warmRoute } from '../helpers/warmRoute'

// spec 010 US2 + ROADMAP SVC-2 — a service is a block-composed doc in the
// `services` collection, rendered through `/services/[slug]`. It used to be a
// bare `Page` behind a hardcoded `OFFERING_TO_SLUG` lookup, so a fifth offering
// meant a code change and a deploy; now the slug IS the record's slug and this
// spec can invent its own rather than borrowing a real marketing one.
//
// Mirrors workshops-compose: a doc edited via the Local API is
// editor-rearrangeable with NO deploy — reordering two blocks + publish flips
// the public DOM order, and the breadcrumb JSON-LD is intact (FR-006).

const SLUG = 'e2e-compose-service'
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
    collection: 'services',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'services',
    data: {
      title: TITLE,
      slug: SLUG,
      tier: 'leaf',
      layout: layoutAlphaFirst as never,
      _status: 'published',
    },
    overrideAccess: true,
  })
})

test.afterAll(async () => {
  await payload.delete({
    collection: 'services',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
})

test('/services/[slug] renders a collection-backed body + breadcrumb', async ({
  page,
  request,
}) => {
  // Seeding ran in a separate process — bust the dev server's unstable_cache for
  // the Page detail tag before asserting (memory: E2E cache revalidation).
  await revalidateDevCache(request, [`services_${SLUG}`, 'services_list'])

  await warmRoute(request, `/services/${SLUG}`, ALPHA)
  await page.goto(`/services/${SLUG}`)
  const article = page.getByTestId('service')
  await expect(article).toHaveAttribute('data-service', SLUG)

  const text = await article.innerText()
  expect(text).toContain(ALPHA)
  expect(text).toContain(BRAVO)
  // Initial order: ALPHA before BRAVO.
  expect(text.indexOf(ALPHA)).toBeLessThan(text.indexOf(BRAVO))

  // Breadcrumb JSON-LD is Home › <service>, two items. The middle "Services" crumb
  // went with the /services route it pointed at, so assert the shape rather than
  // just the presence of a BreadcrumbList — a re-added crumb has to fail here.
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  const crumbs = ld.map((s) => JSON.parse(s)).find((j) => j['@type'] === 'BreadcrumbList')
  expect(crumbs).toBeDefined()
  expect(crumbs.itemListElement).toHaveLength(2)
  expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).not.toContain('Services')

  // A slug matching neither a service nor a group 404s.
  const wrong = await page.goto('/services/not-a-service')
  expect(wrong?.status()).toBe(404)
})

test('reordering two blocks + publish flips the public DOM order with no deploy', async ({
  page,
  request,
}) => {
  // Editor action: swap the two blocks and publish — a pure content edit.
  const { docs } = await payload.find({
    collection: 'services',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
    limit: 1,
  })
  await payload.update({
    collection: 'services',
    id: docs[0].id,
    data: { layout: layoutBravoFirst as never, _status: 'published' },
    overrideAccess: true,
  })
  // The mutation ran in this process, not the dev server — bust its cache.
  await revalidateDevCache(request, [`services_${SLUG}`, 'services_list'])

  await warmRoute(request, `/services/${SLUG}`, BRAVO)
  await page.goto(`/services/${SLUG}`)
  const text = await page.getByTestId('service').innerText()
  expect(text).toContain(ALPHA)
  expect(text).toContain(BRAVO)
  // Order is now reversed — reflecting the reorder, with no code change.
  expect(text.indexOf(BRAVO)).toBeLessThan(text.indexOf(ALPHA))
})
