import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../../src/payload.config'
import { useAdminSession, type AdminSession } from '../helpers/adminSession'

/**
 * Spec 011 US5 — contracts/admin-metadata.md C7, FR-022 to FR-024a, through the
 * admin, on Payload's built-in `slugField` as `urlPathField` wires it.
 *
 * The slug box starts locked; typing one means pressing Unlock first. Save
 * Draft skips validation in Payload, so the format check is exercised on
 * Publish, and the collision check (a field hook) on both.
 *
 * Everything uses `pages`, and every slug starts with `PREFIX` so cleanup can
 * find it.
 */

let session: AdminSession
let payload: Payload

const PREFIX = 'us5-slug'
const INCUMBENT = { title: 'US5 incumbent page', slug: `${PREFIX}-incumbent` }

test.describe.configure({ timeout: process.env.CI ? 120_000 : 90_000 })
test.use({ viewport: { width: 1400, height: 1100 } })

async function cleanup() {
  if (!payload) return
  await payload.delete({
    collection: 'pages',
    where: { slug: { like: PREFIX } },
    overrideAccess: true,
  })
}

async function openForm(page: Page, path: string) {
  await page.goto(path)
  await expect(page.getByRole('button', { name: /save draft/i }).first()).toBeVisible({
    timeout: 60_000,
  })
  await page.waitForFunction(() => {
    const input = document.querySelector('#field-title')
    return !!input && Object.keys(input).some((key) => key.startsWith('__reactProps'))
  })
}

const openCreate = (page: Page) => openForm(page, '/admin/collections/pages/create')

async function typeInto(page: Page, selector: string, text: string) {
  await page.locator(selector).click()
  await page.keyboard.type(text, { delay: 20 })
}

async function typeSlug(page: Page, text: string) {
  await page.locator('#field-slug-lock').click()
  await page.locator('#field-slug').fill('')
  await typeInto(page, '#field-slug', text)
}

const saveDraft = (page: Page) =>
  page
    .getByRole('button', { name: /save draft/i })
    .first()
    .click()
const publish = (page: Page) =>
  page
    .getByRole('button', { name: /publish changes/i })
    .first()
    .click()
const savedDoc = (page: Page) =>
  page.waitForURL(/\/admin\/collections\/pages\/\d+/, { timeout: 30_000 })
const slugError = (page: Page) => page.locator('.slug-field-component .field-error').first()

async function findPage(slug: string) {
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    draft: true,
    overrideAccess: true,
    limit: 2,
  })
  return result
}

test.describe('the URL path derives, stays put, and never collides silently', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    payload = await getPayload({ config: await config })
    await cleanup()
    await payload.create({
      collection: 'pages',
      data: { ...INCUMBENT, _status: 'draft' },
      draft: true,
      overrideAccess: true,
    })
    const context = await browser.newContext()
    session = await useAdminSession(context, baseURL!, 'url-path-field')
    await context.close()
  })

  test.afterAll(async () => {
    await cleanup()
    await session?.dispose()
  })

  test.beforeEach(async ({ context }) => {
    await session.attachTo(context)
  })

  // C7 row 1 — FR-022.
  test('a title on its own gets a URL path when saved', async ({ page }) => {
    await openCreate(page)
    await typeInto(page, '#field-title', 'US5 Slug Derived')
    await saveDraft(page)
    await savedDoc(page)

    await expect(page.locator('#field-slug')).toHaveValue(`${PREFIX}-derived`)
  })

  // C7 row 2 — FR-023.
  test('an unlocked, well-formed URL path is kept exactly as typed', async ({ page }) => {
    await openCreate(page)
    await typeInto(page, '#field-title', 'US5 Slug Explicit Title')
    await typeSlug(page, `${PREFIX}-hand-typed`)
    await saveDraft(page)
    await savedDoc(page)

    await expect(page.locator('#field-slug')).toHaveValue(`${PREFIX}-hand-typed`)
  })

  // C7 row 3, as amended: slugField slugifies a value typed on a NEW record
  // before the save validates it, so it is normalised rather than refused.
  test('a malformed URL path typed on a new record is normalised', async ({ page }) => {
    await openCreate(page)
    await typeInto(page, '#field-title', 'US5 Slug Normalised')
    await typeSlug(page, 'US5 Slug Not Valid')
    await saveDraft(page)
    await savedDoc(page)

    await expect(page.locator('#field-slug')).toHaveValue(`${PREFIX}-not-valid`)
  })

  // C7 row 3 — FR-023, on an existing record, where the hook leaves the value alone.
  test('a malformed URL path on an existing record is refused in plain language', async ({
    page,
  }) => {
    const existing = await payload.create({
      collection: 'pages',
      data: { title: 'US5 Slug Existing', slug: `${PREFIX}-existing`, _status: 'draft' },
      draft: true,
      overrideAccess: true,
    })

    await openForm(page, `/admin/collections/pages/${existing.id}`)
    await typeSlug(page, 'Not Valid')
    await publish(page)

    await expect(slugError(page)).toContainText(/lowercase letters, numbers and hyphens/i, {
      timeout: 25_000,
    })
    expect((await findPage(`${PREFIX}-existing`)).totalDocs, 'the stored slug is unchanged').toBe(1)
  })

  // C7 row 4 — FR-024.
  test('renaming a title leaves the URL path alone', async ({ page }) => {
    const original = await payload.create({
      collection: 'pages',
      data: { title: 'US5 Slug Original', slug: `${PREFIX}-original`, _status: 'draft' },
      draft: true,
      overrideAccess: true,
    })

    await openForm(page, `/admin/collections/pages/${original.id}`)
    await page.locator('#field-title').fill('US5 Slug Renamed Entirely')
    await saveDraft(page)

    // The slug box already shows the original before the save lands, so wait on
    // the stored draft, not on the page.
    const stored = () =>
      payload.findByID({ collection: 'pages', id: original.id, draft: true, overrideAccess: true })
    await expect
      .poll(async () => (await stored()).title, { timeout: 25_000 })
      .toBe('US5 Slug Renamed Entirely')
    expect((await stored()).slug, 'a rename must never rewrite a URL').toBe(`${PREFIX}-original`)
    await expect(page.locator('#field-slug')).toHaveValue(`${PREFIX}-original`)
  })

  // C7 row 5 — FR-024a, on both saves. It is a field hook because Save Draft
  // skips validation, and a draft save shows the toast but no field errors.
  for (const [how, submit] of [
    ['saving a draft', saveDraft],
    ['publishing', publish],
  ] as const) {
    test(`a derived URL path already in use is refused by name when ${how}`, async ({ page }) => {
      await openCreate(page)
      await typeInto(page, '#field-title', 'US5 Slug Incumbent')
      await submit(page)

      const toast = page.locator('[data-sonner-toast]').filter({ hasText: INCUMBENT.title })
      await expect(toast).toContainText(`${INCUMBENT.slug}-2`, { timeout: 25_000 })
      if (how === 'publishing') await expect(slugError(page)).toContainText(INCUMBENT.title)
      await expect(page).toHaveURL(/\/pages\/create/)
      expect((await findPage(INCUMBENT.slug)).totalDocs, 'no second record was written').toBe(1)
    })
  }
})
