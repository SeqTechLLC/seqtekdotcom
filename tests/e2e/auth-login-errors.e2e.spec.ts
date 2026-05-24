import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const SCREENSHOTS_DIR = path.resolve('tests/e2e/screenshots')

/**
 * T020a (redirected) — verifies our LoginError component renders the right
 * user-facing string for each error code in contracts/oauth-routes.md § 3.
 * Does not exercise the OAuth round-trip (per FR-012 note).
 */
const CASES: ReadonlyArray<{ code: string; expected: RegExp }> = [
  { code: 'state_mismatch', expected: /Sign-in expired/i },
  { code: 'domain_rejected', expected: /SEQTEK Workspace accounts/i },
  { code: 'provider_error', expected: /Google couldn['’]t sign you in/i },
  { code: 'network', expected: /couldn['’]t reach Google/i },
  { code: 'internal', expected: /Something went wrong/i },
]

test.describe('US1: LoginError contract (T020a)', () => {
  for (const { code, expected } of CASES) {
    test(`/admin/login?error=${code} renders the contract message`, async ({ page }) => {
      await page.goto(`/admin/login?error=${code}`)
      const error = page.locator(`[data-error-code="${code}"]`)
      await expect(error).toBeVisible()
      await expect(error).toHaveText(expected)
    })
  }

  test('/admin/login with no error param renders no alert', async ({ page }) => {
    await mkdir(SCREENSHOTS_DIR, { recursive: true })
    await page.goto('/admin/login')
    // Wait for Payload's admin to hydrate and render the SSO CTA — the
    // "no [data-error-code]" assertion below succeeds instantly because the
    // null-rendered component leaves no DOM, so without this wait the
    // screenshot captures an empty pre-hydration page.
    await page.waitForSelector('.admin-login-google__cta', { state: 'visible' })
    await expect(page.locator('[data-error-code]')).toHaveCount(0)
    // T021: capture the post-cutover login screen.
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'admin-login-google-sso.png'),
      fullPage: true,
    })
  })
})
