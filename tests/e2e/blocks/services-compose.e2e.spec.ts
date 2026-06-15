import { expect, test } from '@playwright/test'
import type { Payload } from 'payload'

import { getPayloadClient, lexical } from '../helpers/seedInScopeRoutes'
import { revalidateDevCache } from '../helpers/revalidateDevCache'

// spec 010 US2 (Phase D) — service body renders via RenderBlocks at the NESTED
// URL `/services/[pillar]/[slug]`; breadcrumb + pillar-match guard preserved
// (FR-006). The pillar-move dual revalidation in revalidateOnChange is untouched
// (covered by the cache-tag parity int test).

const PILLAR = 'e2e-compose-pillar'
const SLUG = 'e2e-compose-service'
const TITLE = 'E2E Compose Service'
const BODY = 'SVC-BODY-overview-section'

let payload: Payload
let pillarId: string | number

test.beforeAll(async () => {
  payload = await getPayloadClient()
  await payload.delete({
    collection: 'services',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'servicePillars',
    where: { slug: { equals: PILLAR } },
    overrideAccess: true,
  })
  const pillar = await payload.create({
    collection: 'servicePillars',
    data: { title: 'E2E Pillar', slug: PILLAR, _status: 'published' },
    overrideAccess: true,
  })
  pillarId = pillar.id
  await payload.create({
    collection: 'services',
    data: {
      title: TITLE,
      slug: SLUG,
      pillar: pillarId,
      order: 1,
      layout: [
        { blockType: 'content', width: 'standard', background: 'none', body: lexical(BODY) },
      ] as never,
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
  await payload.delete({
    collection: 'servicePillars',
    where: { id: { equals: pillarId } },
    overrideAccess: true,
  })
})

test('nested /services/[pillar]/[slug] renders RenderBlocks body + breadcrumb', async ({
  page,
  request,
}) => {
  await revalidateDevCache(request, [
    `services_${SLUG}`,
    'services_list',
    `servicePillars_${PILLAR}`,
  ])

  await page.goto(`/services/${PILLAR}/${SLUG}`)
  await expect(page.getByTestId('service-title')).toHaveText(TITLE)
  await expect(page.getByTestId('service-detail')).toContainText(BODY)

  // Breadcrumb JSON-LD present (incl. the pillar crumb).
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.some((s) => s.includes('BreadcrumbList'))).toBe(true)

  // Pillar-match guard: the wrong pillar 404s (no duplicate content).
  const wrong = await page.goto(`/services/not-the-pillar/${SLUG}`)
  expect(wrong?.status()).toBe(404)
})
