import { expect, test } from '@playwright/test'

import { useAdminSession, type AdminSession } from '../helpers/adminSession'

/**
 * The admin keeps what an editor types.
 *
 * Pins the Server Action cookie rule in `src/proxy.ts`: a cookie set on an
 * action makes Next refresh the route, which re-initialises the form and
 * discards the input.
 *
 * `keyboard.type` rather than `fill`: the defect needs a form-state round trip
 * per edit, and `fill` lands the whole value in a single event.
 */

let session: AdminSession

// The create form is one of the heavier admin views against a cold server.
// Keep CI's 120s (playwright.config.ts) rather than overriding it downward.
test.describe.configure({ timeout: process.env.CI ? 120_000 : 90_000 })

test.describe('the admin keeps typed input', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext()
    session = await useAdminSession(context, baseURL!, 'typing-survives')
    await context.close()
  })

  test.afterAll(async () => {
    await session?.dispose()
  })

  test.beforeEach(async ({ context }) => {
    await session.attachTo(context)
  })

  test('a title typed on the create form is still there once the form settles', async ({
    page,
  }) => {
    let revalidatedActions = 0
    page.on('response', async (response) => {
      if (!response.request().headers()['next-action']) return
      // Only feeds the failure message, so a response that outlives the page at
      // teardown is ignored rather than surfacing as an unhandled rejection.
      const headers = await response.allHeaders().catch(() => undefined)
      if (headers?.['x-action-revalidated']) revalidatedActions++
    })

    await page.goto('/admin/collections/pages/create')
    await expect(page.getByRole('button', { name: /save draft/i }).first()).toBeVisible({
      timeout: 60_000,
    })

    // Wait for React to own the input. Keys typed into server-rendered markup
    // before hydration are discarded for a different reason, and would make
    // this test fail for something other than the defect it pins.
    await page.waitForFunction(() => {
      const input = document.querySelector('#field-title')
      return !!input && Object.keys(input).some((key) => key.startsWith('__reactProps'))
    })

    const title = page.locator('#field-title')
    await title.click()
    await page.keyboard.type('Typed by an editor', { delay: 50 })

    // Asserts the value STAYS, not that it arrives: the failure lets the text
    // land and removes it once the route refresh completes, so wait that out.
    await page.waitForTimeout(3_000)
    await expect(
      title,
      `typed input was discarded; ${revalidatedActions} server action(s) answered x-action-revalidated`,
    ).toHaveValue('Typed by an editor')
  })
})
