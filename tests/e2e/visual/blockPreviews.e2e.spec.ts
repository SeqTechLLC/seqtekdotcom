import { promises as fs } from 'fs'
import path from 'path'
import { test, expect } from '@playwright/test'

import { getBlockFixtures } from '../../../src/payload/seed/showcase/fixtures'

/**
 * Spec 011 US2 — source captures for the committed block-picker previews.
 *
 * This is NOT the full-page showcase capture (`showcase.e2e.spec.ts`). Payload
 * renders a picker thumbnail into a `aspect-ratio: 3/2` box with
 * `object-fit: cover`, so a full-page screenshot of a stacked showcase route
 * would arrive centre-cropped into an unreadable strip. We instead screenshot
 * the block's own top-level `<section>` — `[data-testid="page"] > :nth-child(n)`
 * is variant n of the one block that showcase route stacks — and let
 * `tools/block-thumbnails` letterbox it to 3:2.
 *
 * Every variant is captured so a preview can be re-pointed at a more
 * representative variant (PREVIEW_VARIANT in the tool) without a re-capture.
 *
 * Output: `screenshots/block-previews/<blockType>--<variantIndex>.png`
 * (gitignored). Consumed by `npm run block:thumbnails`.
 */
const OUT_DIR = path.resolve(import.meta.dirname, 'screenshots/block-previews')

// Desktop only. The picker is an admin-desktop surface, and a mobile capture
// of a two-column block would misrepresent what the editor is choosing.
const VIEWPORT = { width: 1440, height: 900 }

// Capturing every variant of every block costs a screenshot each; three is
// enough to pick a representative one and keeps the run near the showcase
// spec's own cost.
const MAX_VARIANTS = 3

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

test.beforeAll(async () => {
  await fs.mkdir(OUT_DIR, { recursive: true })
})

for (const fixture of fixtures) {
  test(`block preview capture: ${fixture.blockType}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    const route = `/showcase-block-${fixture.blockType}`
    const response = await page.goto(route, { waitUntil: 'networkidle' })
    expect(response?.status(), `route ${route} not found — run npm run seed:showcase first`).toBe(
      200,
    )

    const article = page.getByTestId('page')
    await expect(article).toBeVisible()

    // A block that renders nothing (an unconfigured HubSpot embed, say) leaves
    // fewer children than it has variants. Count the DOM, not the fixture.
    const rendered = await article.locator('> *').count()
    const captureCount = Math.min(rendered, fixture.variants.length, MAX_VARIANTS)

    for (let i = 0; i < captureCount; i++) {
      const section = article.locator('> *').nth(i)
      const box = await section.boundingBox()
      // Zero-height sections are blocks that mounted but painted nothing.
      // Skipping them here is what puts a block on the hand-authored-SVG list.
      if (!box || box.height < 8) continue
      await section.screenshot({
        path: path.join(OUT_DIR, `${fixture.blockType}--${i}.png`),
      })
    }
  })
}
