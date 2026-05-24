import { expect, test } from '@playwright/test'

/**
 * US1 acceptance scenario 3 — token expiry sends the user back to the SSO
 * entry screen, not a generic 401 dead-end (FR-010).
 */
test.describe('US1: session expiry returns to entry screen', () => {
  test('unauthenticated /admin redirects to /admin/login (not a bare 401)', async ({ page }) => {
    await page.context().clearCookies()
    const response = await page.goto('/admin')
    expect(response).not.toBeNull()
    // Either we landed on the login URL (preferred), or we received a
    // non-error response with the login view rendered inline.
    if (response) {
      expect(response.status()).toBeLessThan(500)
    }
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
