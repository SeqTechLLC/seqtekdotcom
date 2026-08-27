import { expect, test, type Page } from '@playwright/test'

import { BLOCK_CATEGORY_LABELS } from '../../../src/payload/blocks/categories'
import { layoutBlocks } from '../../../src/payload/blocks/layout'
import { useAdminSession, type AdminSession } from '../helpers/adminSession'

/**
 * Spec 011 US2 / T038 — the block picker is usable.
 *
 * `adminMetadata.int.spec.ts` proves the config is complete. This proves
 * Payload actually draws it: that the categories become headings, that no
 * block lands in the ungrouped bucket, that the previews load rather than
 * 404, and that the four heroes are told apart by name.
 *
 * That last one is the amended FR-011. Payload renders no block description,
 * so `labels.singular` is the whole of what distinguishes one card from
 * another — which makes this the test that would catch a future hero landing
 * beside `Case study hero` with a bare, ambiguous label.
 */

let session: AdminSession

const HERO_LABELS = layoutBlocks
  .filter((block) => block.admin?.group === BLOCK_CATEGORY_LABELS.hero)
  .map((block) => String(block.labels?.singular))

/**
 * `BlockSelector` renders into a Fragment — there is no single `.blocks-drawer`
 * node to grab. `__blocks-wrapper` is its outermost real element, and the
 * search input is a sibling of it, so queries for that stay page-level.
 */
function picker(page: Page) {
  return page.locator('.blocks-drawer__blocks-wrapper')
}

async function openPicker(page: Page): Promise<void> {
  await page.goto('/admin/collections/pages/create')
  // The button is named from the field's `labels.singular`, NOT its `label`:
  // US4 set that to "Block" so the button reads "Add Block" rather than the
  // generated "Add Layout" (FR-018).
  await page
    .getByRole('button', { name: /add block/i })
    .first()
    .click()
  await expect(picker(page)).toBeVisible()
}

test.describe('block picker', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext()
    session = await useAdminSession(context, baseURL!, 'block-picker')
    await context.close()
  })

  test.afterAll(async () => {
    await session?.dispose()
  })

  test.beforeEach(async ({ context, baseURL }) => {
    await useAdminSession(context, baseURL!, 'block-picker')
  })

  test('opens grouped by category, with every block under a heading', async ({ page }) => {
    await openPicker(page)
    const drawer = picker(page)

    // Every category in use must render as a heading.
    const usedCategories = [...new Set(layoutBlocks.map((block) => String(block.admin?.group)))]
    for (const heading of usedCategories) {
      await expect(
        drawer.locator('.blocks-drawer__block-group-label', { hasText: heading }),
        `category heading "${heading}" is missing from the picker`,
      ).toBeVisible()
    }

    // `__block-group-none` is where Payload files blocks with no admin.group.
    // It must not exist — an ungrouped block is the defect this story fixes.
    await expect(drawer.locator('.blocks-drawer__block-group-none')).toHaveCount(0)

    // Every registered block is offered exactly once.
    await expect(drawer.locator('.blocks-drawer__block')).toHaveCount(layoutBlocks.length)

    // Headings appear in the taxonomy's declared order (Payload groups by
    // first encounter, so this is the layoutBlocks registration order).
    await expect(drawer.locator('.blocks-drawer__block-group-label')).toHaveText(usedCategories)
  })

  test('the four heroes are distinguishable by name', async ({ page }) => {
    await openPicker(page)
    const drawer = picker(page)

    expect(HERO_LABELS.length).toBeGreaterThan(1)
    for (const label of HERO_LABELS) {
      await expect(
        drawer.getByText(label, { exact: true }),
        `hero block "${label}" is not identifiable in the picker`,
      ).toBeVisible()
    }

    // The picker's search is a substring match on the label alone, so a bare
    // "hero" query must still narrow to the heroes rather than leave one
    // ambiguous card behind. This is the searchability half of FR-011.
    await page.getByPlaceholder(/search for a block/i).fill('hero')
    await expect(drawer.locator('.blocks-drawer__block')).toHaveCount(HERO_LABELS.length)
  })

  test('every preview image loads', async ({ page }) => {
    const failed: string[] = []
    page.on('response', (response) => {
      if (response.url().includes('/block-previews/') && response.status() >= 400) {
        failed.push(`${response.status()} ${response.url()}`)
      }
    })

    await openPicker(page)
    await page.waitForLoadState('networkidle')

    const images = page.locator('.blocks-drawer__default-image img')
    // A block with no thumbnail renders Payload's fallback glyph instead of an
    // <img>, so the count is itself an assertion that all 45 are wired.
    await expect(images).toHaveCount(layoutBlocks.length)

    const broken = await images.evaluateAll((nodes) =>
      nodes
        .filter((node) => !(node as HTMLImageElement).naturalWidth)
        .map((node) => (node as HTMLImageElement).src),
    )

    expect(failed, 'preview requests that 404ed').toEqual([])
    expect(broken, 'previews that rendered as broken images').toEqual([])
  })
})
