import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../../../src/payload.config'
import { useAdminSession, type AdminSession } from '../helpers/adminSession'

/**
 * Spec 011 US3 — the two daily lookup tasks work by sight.
 *
 * `adminThumbnail.int.spec.ts` proves the resolver returns the right URL and
 * `adminMetadata.int.spec.ts` proves `_status` is a default column. Neither
 * proves Payload draws either one, and the config half is the easy half: the
 * previous state of this feature was a correct-looking config that produced a
 * media library of blank squares.
 *
 * So this asserts the rendered admin: a thumbnail with a non-zero
 * `naturalWidth` (a 404 or a null src reads as zero), publish state as a
 * column with the record's name still carrying the link, and collapsed array
 * rows naming themselves rather than counting themselves.
 *
 * Fixtures are created and torn down here rather than leaning on ambient seed
 * state: CI starts from an empty database, and the local mirror's media
 * predates every change this feature makes.
 */

const FIXTURE = {
  pageSlug: 'us3-media-thumbnails',
  pageTitle: 'US3 media thumbnails fixture',
  mediaAlt: 'US3 fixture landscape photo',
  mediaName: 'us3-fixture-landscape.png',
  captions: ['Cheyenne Avenue', 'Boston Avenue', 'Denver Avenue', 'Elgin Avenue'],
}

let session: AdminSession
let payload: Payload
let pageId: number | string

test.use({ viewport: { width: 1400, height: 1000 } })

/**
 * 800×600 — wider than the 640px `mobile` breakpoint, so Payload genuinely
 * downsizes it and the resolver has a real derivative to find. A 1×1 PNG (the
 * a11y fixture) would pass `withoutEnlargement` through untouched and prove
 * nothing about the resolution order.
 */
async function landscapePng(): Promise<Buffer> {
  return sharp({
    create: { width: 800, height: 600, channels: 3, background: { r: 30, g: 64, b: 90 } },
  })
    .png()
    .toBuffer()
}

/**
 * Open the fixture page's edit view.
 *
 * Addressed by id rather than by clicking the row link from the list: on a
 * cold admin the click fires before React has hydrated the row and is
 * swallowed, which left this green locally against a warm dev server and red
 * on all three CI retries. The list link is worth asserting, so the
 * publish-state test below asserts it directly — as markup, not as a click.
 */
async function openFixturePage(page: Page): Promise<void> {
  await page.goto(`/admin/collections/pages/${pageId}`)
  await expect(page.locator('#field-layout')).toBeVisible({ timeout: 25_000 })
}

async function removeFixtures(instance: Payload): Promise<void> {
  await instance.delete({
    collection: 'pages',
    where: { slug: { equals: FIXTURE.pageSlug } },
    overrideAccess: true,
  })
  await instance.delete({
    collection: 'media',
    where: { alt: { equals: FIXTURE.mediaAlt } },
    overrideAccess: true,
  })
}

test.describe('US3 — lists answer "what\'s live?" and "which image is this?"', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    payload = await getPayload({ config: await config })
    await removeFixtures(payload)

    const file = await landscapePng()
    const media = await payload.create({
      collection: 'media',
      data: { alt: FIXTURE.mediaAlt },
      file: { data: file, mimetype: 'image/png', name: FIXTURE.mediaName, size: file.length },
      overrideAccess: true,
    })
    const fixturePage = await payload.create({
      collection: 'pages',
      data: {
        title: FIXTURE.pageTitle,
        slug: FIXTURE.pageSlug,
        _status: 'published',
        layout: [
          {
            blockType: 'client-logo-grid',
            heading: 'Logos with captions',
            logos: FIXTURE.captions.map((caption) => ({ logo: media.id, caption })),
            columns: '4',
          },
          {
            blockType: 'logo-bar',
            heading: 'Logos without captions',
            logos: [{ logo: media.id }],
            treatment: 'color',
          },
        ],
      },
      overrideAccess: true,
    })
    pageId = fixturePage.id

    const context = await browser.newContext()
    session = await useAdminSession(context, baseURL!, 'media-thumbnails')
    await context.close()
  })

  test.afterAll(async () => {
    if (payload) await removeFixtures(payload)
    await session?.dispose()
  })

  test.beforeEach(async ({ context, baseURL }) => {
    await useAdminSession(context, baseURL!, 'media-thumbnails')
  })

  test('the media list previews each image rather than naming it', async ({ page }) => {
    await page.goto(`/admin/collections/media?search=${encodeURIComponent(FIXTURE.mediaName)}`)
    const row = page.locator('table tbody tr', { hasText: FIXTURE.mediaName })
    await expect(row).toBeVisible({ timeout: 25_000 })

    const thumbnail = row.locator('.thumbnail img')
    await expect(thumbnail).toBeVisible()
    // `naturalWidth` is the load check: Payload's Thumbnail probes the src and
    // silently swaps in a file glyph on error, so a 404 is invisible to a
    // visibility assertion but shows up here as 0.
    await expect
      .poll(() => thumbnail.evaluate((img) => (img as HTMLImageElement).naturalWidth), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0)

    // The derivative, not the 800px original (FR-015, research R7).
    const src = await thumbnail.getAttribute('src')
    expect(src, 'the list thumbnail must come from a resized derivative').toContain('640x480')
  })

  test('the media picker inside a block previews the same way', async ({ page }) => {
    await openFixturePage(page)

    // The upload field's own preview, then the drawer it opens — acceptance
    // scenario 3 is about the picker, but the field preview is the thing an
    // editor sees first and it resolves through the same `thumbnailURL`.
    const fieldThumb = page.locator('#field-layout .thumbnail img').first()
    await expect(fieldThumb).toBeVisible({ timeout: 25_000 })
    await expect
      .poll(() => fieldThumb.evaluate((img) => (img as HTMLImageElement).naturalWidth), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0)

    await page
      .getByRole('button', { name: /choose from existing/i })
      .first()
      .click()

    const drawerThumbs = page.locator('.list-drawer .thumbnail img')
    await expect(drawerThumbs.first()).toBeVisible({ timeout: 25_000 })
    await expect
      .poll(
        async () =>
          drawerThumbs
            .evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).naturalWidth))
            .then((widths) => widths.filter((width) => width > 0).length),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0)
  })

  test('publish state is a column, and the title keeps the link', async ({ page }) => {
    await page.goto(`/admin/collections/pages?search=${encodeURIComponent(FIXTURE.pageTitle)}`)
    const row = page.locator('table tbody tr', { hasText: FIXTURE.pageTitle })
    await expect(row).toBeVisible({ timeout: 25_000 })

    const headers = await page.locator('table thead th').allInnerTexts()
    expect(headers.map((h) => h.trim())).toContain('Status')

    // Payload turns the FIRST active column into the link to the record
    // (`buildColumnState`: isLinkedColumn && colIndex === activeColumnsIndices[0]).
    // `_status` ahead of the title therefore makes an underlined "Published"
    // the only clickable thing in the row — the reason C3 puts it second.
    const cells = row.locator('td')
    const shape = await cells.evaluateAll((tds) =>
      tds.slice(0, 3).map((td) => ({
        text: (td.textContent ?? '').trim(),
        hasLink: Boolean(td.querySelector('a')),
      })),
    )
    const title = shape.find((cell) => cell.text === FIXTURE.pageTitle)
    const status = shape.find((cell) => /^(Published|Draft)$/.test(cell.text))
    expect(title?.hasLink, 'the record title must remain the row link').toBe(true)
    expect(status, 'publish state must render in the first three columns').toBeDefined()
    expect(status?.hasLink, 'the status pill must not be the row link').toBe(false)
  })

  test('collapsed media rows name themselves', async ({ page }) => {
    await openFixturePage(page)
    const rowHeaders = page.locator('#field-layout .array-field__row-header')
    await expect(rowHeaders.first()).toBeVisible({ timeout: 25_000 })

    // A row with a caption uses it; a row with only an upload falls back to
    // the media's alt text. Neither may read "Logo 01" (FR-017).
    await expect
      .poll(async () => (await rowHeaders.allInnerTexts()).map((t) => t.trim()), {
        timeout: 20_000,
      })
      .toEqual([...FIXTURE.captions, FIXTURE.mediaAlt])
  })
})
