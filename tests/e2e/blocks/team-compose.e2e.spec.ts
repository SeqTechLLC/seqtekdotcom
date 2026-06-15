import { expect, test } from '@playwright/test'
import type { Payload } from 'payload'

import { getPayloadClient, lexical, PNG_1x1 } from '../helpers/seedInScopeRoutes'
import { revalidateDevCache } from '../helpers/revalidateDevCache'

// spec 010 US2 (Phase E) — the NEW /team/[slug] detail route renders via
// RenderBlocks, emits Person JSON-LD (AICO), and the /team listing links to it.

const SLUG = 'e2e-compose-member'
const NAME = 'E2E Compose Member'
const TITLE = 'Principal Engineer'
const BODY = 'TEAM-BODY-about-section'

let payload: Payload
let mediaId: string | number

test.beforeAll(async () => {
  payload = await getPayloadClient()
  await payload.delete({
    collection: 'teamMembers',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
  const media = await payload.create({
    collection: 'media',
    data: { alt: 'E2E member photo' },
    file: { data: PNG_1x1, mimetype: 'image/png', name: `${SLUG}.png`, size: PNG_1x1.length },
    overrideAccess: true,
  })
  mediaId = media.id
  await payload.create({
    collection: 'teamMembers',
    data: {
      name: NAME,
      slug: SLUG,
      title: TITLE,
      photo: mediaId,
      isLeadership: true,
      order: 1,
      linkedinUrl: 'https://www.linkedin.com/in/e2e-compose-member',
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
    collection: 'teamMembers',
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'media',
    where: { id: { equals: mediaId } },
    overrideAccess: true,
  })
})

test('/team/[slug] renders RenderBlocks body + Person JSON-LD; /team links to it', async ({
  page,
  request,
}) => {
  await revalidateDevCache(request, [`teamMembers_${SLUG}`, 'teamMembers_list'])

  await page.goto(`/team/${SLUG}`)
  await expect(page.getByTestId('team-member-name')).toHaveText(NAME)
  await expect(page.getByTestId('team-member-detail')).toContainText(BODY)

  // Person + breadcrumb JSON-LD present.
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(ld.some((s) => s.includes('"Person"') && s.includes(TITLE))).toBe(true)
  expect(ld.some((s) => s.includes('BreadcrumbList'))).toBe(true)

  // Listing parity: /team links to the detail route.
  await page.goto('/team')
  const link = page.getByRole('link', { name: NAME })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', `/team/${SLUG}`)
})
