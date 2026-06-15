import { expect, test } from '@playwright/test'
import type { Payload } from 'payload'

import { getPayloadClient, lexical, PNG_1x1 } from '../helpers/seedInScopeRoutes'
import { revalidateDevCache } from '../helpers/revalidateDevCache'

// spec 010 US2 (Phase C) — case-study body renders via RenderBlocks; the
// grid/listing + breadcrumb JSON-LD are unchanged (FR-006). Kept metadata
// (industry, heroImage, title) still drives the route header + listing card.

const SLUG = 'e2e-compose-case'
const TITLE = 'E2E Compose Case Study'
const BODY = 'CASE-BODY-the-impact-section'

let payload: Payload
let mediaId: string | number
let industryId: string | number

test.beforeAll(async () => {
  payload = await getPayloadClient()
  await payload.delete({
    collection: 'caseStudies',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'industries',
    where: { slug: { equals: `${SLUG}-industry` } },
    overrideAccess: true,
  })
  const media = await payload.create({
    collection: 'media',
    data: { alt: 'E2E case hero' },
    file: { data: PNG_1x1, mimetype: 'image/png', name: `${SLUG}.png`, size: PNG_1x1.length },
    overrideAccess: true,
  })
  mediaId = media.id
  const industry = await payload.create({
    collection: 'industries',
    data: { title: 'E2E Industry', slug: `${SLUG}-industry` },
    overrideAccess: true,
  })
  industryId = industry.id
  await payload.create({
    collection: 'caseStudies',
    data: {
      title: TITLE,
      slug: SLUG,
      industry: industryId,
      heroImage: mediaId,
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
    collection: 'caseStudies',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'industries',
    where: { id: { equals: industryId } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'media',
    where: { id: { equals: mediaId } },
    overrideAccess: true,
  })
})

test('case-study renders RenderBlocks body + listing + breadcrumb JSON-LD intact', async ({
  page,
  request,
}) => {
  await revalidateDevCache(request, [`caseStudies_${SLUG}`, 'caseStudies_list'])

  await page.goto(`/case-studies/${SLUG}`)
  await expect(page.getByTestId('case-study-title')).toHaveText(TITLE)
  // Body composed block renders.
  await expect(page.getByTestId('case-study')).toContainText(BODY)
  // Breadcrumb JSON-LD present.
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.some((s) => s.includes('BreadcrumbList'))).toBe(true)

  // Listing parity: the case study appears on /case-studies.
  await page.goto('/case-studies')
  await expect(page.getByRole('link', { name: new RegExp(TITLE) })).toBeVisible()
})
