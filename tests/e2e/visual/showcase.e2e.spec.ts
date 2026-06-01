import { promises as fs } from 'fs'
import path from 'path'
import { test, expect } from '@playwright/test'

import { getBlockFixtures } from '../../../src/payload/seed/showcase/fixtures'

const SCREENSHOT_DIR = path.resolve(import.meta.dirname, 'screenshots/showcase')

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
] as const

// Stub media + supporting IDs — the fixtures function only embeds IDs in
// saved block JSON; we just need the structure here to derive the URL list.
const STUB_MEDIA = { photo: 0, screenshot: 0, logo: 0, illustration: 0 }
const STUB_SUPPORTING = {
  testimonialIds: [0, 0, 0],
  caseStudyIds: [0, 0, 0],
  serviceIds: [0, 0, 0],
  postIds: [0, 0, 0],
  industryIds: [0, 0, 0],
  locationIds: [0, 0, 0],
  workshopIds: [0, 0, 0],
  servicePillarIds: [0, 0, 0],
  categoryIds: [0, 0, 0],
  teamMemberIds: [0],
}
const fixtures = getBlockFixtures(STUB_MEDIA, STUB_SUPPORTING)
const perBlockSlugs = fixtures.map((fx) => `block-${fx.blockType}`)
const perCategorySlugs = [...new Set(fixtures.map((fx) => fx.category))].map((c) => `category-${c}`)
const SLUGS = [...perBlockSlugs, ...perCategorySlugs]

test.beforeAll(async () => {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true })
})

for (const slug of SLUGS) {
  for (const viewport of VIEWPORTS) {
    // spec 004 T027: the dedicated /showcase/[slug] demo route was retired for
    // a single `pages` render path. The showcase fixtures are `pages` docs
    // with slug `showcase-<slug>`, now served flat via /[slug]. This is a
    // capture harness (overwrites baselines), not a CI gate.
    test(`visual capture: /showcase-${slug} @ ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const response = await page.goto(`/showcase-${slug}`, { waitUntil: 'networkidle' })
      expect(
        response?.status(),
        `route /showcase-${slug} not found — run npm run seed:showcase first`,
      ).toBe(200)
      await expect(page.getByTestId('page')).toBeVisible()
      const file = path.join(SCREENSHOT_DIR, `${slug}-${viewport.name}.png`)
      await page.screenshot({ path: file, fullPage: true })
    })
  }
}
