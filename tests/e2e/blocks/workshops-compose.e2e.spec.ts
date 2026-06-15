import { expect, test } from '@playwright/test'
import type { Payload } from 'payload'

import { getPayloadClient, lexical } from '../helpers/seedInScopeRoutes'
import { revalidateDevCache } from '../helpers/revalidateDevCache'

// spec 010 US1 (P1, MVP) — the acceptance gate for the whole feature: a
// block-composed workshop is editor-rearrangeable with NO deploy. Reordering
// two blocks via the Local API + publish flips the public DOM order, and the
// listing + breadcrumb JSON-LD are unchanged (FR-006).

const SLUG = 'e2e-compose-workshop'
const TITLE = 'E2E Compose Workshop'
const ALPHA = 'BLOCK-ALPHA-first-section'
const BRAVO = 'BLOCK-BRAVO-second-section'

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
    collection: 'workshops',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'workshops',
    data: {
      title: TITLE,
      slug: SLUG,
      order: 99,
      layout: layoutAlphaFirst as never,
      _status: 'published',
    },
    overrideAccess: true,
  })
})

test.afterAll(async () => {
  await payload.delete({
    collection: 'workshops',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
})

test('workshop renders block layout, listing + breadcrumb JSON-LD intact', async ({
  page,
  request,
}) => {
  // Seeding ran in a separate process, so the dev server's unstable_cache for
  // the detail + listing routes is stale (or warmed by a sibling suite). Bust
  // it before asserting (memory: E2E cache revalidation).
  await revalidateDevCache(request, [`workshops_${SLUG}`, 'workshops_list'])
  await page.goto(`/workshops/${SLUG}`)
  const article = page.getByTestId('workshop-detail')
  await expect(page.getByTestId('workshop-title')).toHaveText(TITLE)

  const text = await article.innerText()
  expect(text).toContain(ALPHA)
  expect(text).toContain(BRAVO)
  // Initial order: ALPHA before BRAVO.
  expect(text.indexOf(ALPHA)).toBeLessThan(text.indexOf(BRAVO))

  // Breadcrumb JSON-LD present on the detail route.
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.some((s) => s.includes('BreadcrumbList'))).toBe(true)

  // Listing parity: the workshop appears on /workshops.
  await page.goto('/workshops')
  await expect(page.getByRole('link', { name: TITLE })).toBeVisible()
})

test('reordering two blocks + publish flips the public DOM order with no deploy', async ({
  page,
  request,
}) => {
  // Editor action: swap the two blocks and publish — a pure content edit.
  const { docs } = await payload.find({
    collection: 'workshops',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
    limit: 1,
  })
  await payload.update({
    collection: 'workshops',
    id: docs[0].id,
    data: { layout: layoutBravoFirst as never, _status: 'published' },
    overrideAccess: true,
  })
  // The mutation ran in this process, not the dev server — bust its cache.
  await revalidateDevCache(request, [`workshops_${SLUG}`, 'workshops_list'])

  await page.goto(`/workshops/${SLUG}`)
  const text = await page.getByTestId('workshop-detail').innerText()
  expect(text).toContain(ALPHA)
  expect(text).toContain(BRAVO)
  // Order is now reversed — reflecting the reorder, with no code change.
  expect(text.indexOf(BRAVO)).toBeLessThan(text.indexOf(ALPHA))
})
