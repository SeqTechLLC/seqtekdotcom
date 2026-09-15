import { expect, test } from '@playwright/test'

import { useAdminSession, type AdminSession } from '../helpers/adminSession'

/**
 * The admin keeps what an editor types.
 *
 * Until `src/proxy.ts` stopped setting its `x-request-id` cookie on Server
 * Action requests, every `form-state` action the form sends during typing came
 * back `x-action-revalidated`, the client refreshed the route, and the refresh
 * re-initialised the form from server state: a typed character survived about
 * 100ms. Every other admin spec seeds its values or edits by `fill`, so none of
 * them could see it. This one types.
 *
 * `keyboard.type` rather than `fill`: the defect needed a form-state round trip
 * per edit, and `fill` lands the whole value in a single event.
 */

let session: AdminSession

// The create form is one of the heavier admin views against a cold dev server;
// CI already allows 120s.
test.describe.configure({ timeout: 90_000 })

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
      if ((await response.allHeaders())['x-action-revalidated']) revalidatedActions++
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

    // This asserts the value STAYS, not that it arrives: the old failure let the
    // text land and removed it when the refresh completed, so wait that out first.
    await page.waitForTimeout(3_000)
    await expect(
      title,
      `typed input was discarded; ${revalidatedActions} server action(s) answered x-action-revalidated`,
    ).toHaveValue('Typed by an editor')
  })
})
