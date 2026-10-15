import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { hspCalls, installConsentHarness } from './helpers/consent'
import {
  cleanupListingPages,
  getPayloadClient,
  seedListingPages,
} from './helpers/seedInScopeRoutes'

/**
 * spec 006 US4 (T020) + US5 (T023). The footer consent control + the
 * /privacy-policy page (a `pages` doc; its prose is content, so these tests
 * check the page frame and the code-owned footer, not the legal wording). The T002 harness stubs `_hsp` so we can assert the
 * official commands the control pushes (contracts/consent-bridge.md C3) even
 * with HubSpot env-unset in CI.
 */

test.beforeAll(async () => {
  await seedListingPages(await getPayloadClient())
})

test.afterAll(async () => {
  await cleanupListingPages(await getPayloadClient())
})

const hasCommand = (calls: unknown[][], command: string): boolean =>
  calls.some((c) => Array.isArray(c) && c[0] === command)

test.describe('US4 — footer consent-preferences control', () => {
  test('renders on a sample of pages, keyboard-focusable', async ({ page }) => {
    await installConsentHarness(page)
    for (const path of ['/', '/privacy-policy', '/case-studies']) {
      await page.goto(path)
      const prefs = page.getByTestId('consent-preferences')
      const withdraw = page.getByTestId('consent-withdraw')
      await expect(prefs, `consent control on ${path}`).toBeVisible()
      await expect(withdraw, `withdraw control on ${path}`).toBeVisible()
      // Native <button> is keyboard-focusable; confirm it can hold focus.
      await prefs.focus()
      await expect(prefs).toBeFocused()
    }
  })

  test("'Cookie preferences' pushes _hsp showBanner", async ({ page }) => {
    await installConsentHarness(page)
    await page.goto('/')
    await page.getByTestId('consent-preferences').click()
    expect(hasCommand(await hspCalls(page), 'showBanner')).toBe(true)
  })

  test("'Withdraw consent' pushes _hsp revokeCookieConsent", async ({ page }) => {
    await installConsentHarness(page)
    await page.goto('/')
    await page.getByTestId('consent-withdraw').click()
    expect(hasCommand(await hspCalls(page), 'revokeCookieConsent')).toBe(true)
  })

  test('does not throw when HubSpot is absent (no harness, env-unset)', async ({ page }) => {
    // No installConsentHarness → `_hsp` is whatever the inline default created
    // (a plain array) or undefined. The control must no-op, not throw.
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    await page.getByTestId('consent-withdraw').click()
    await page.getByTestId('consent-preferences').click()
    expect(errors, `consent control threw without HubSpot: ${errors.join('; ')}`).toEqual([])
  })

  test('footer consent control is axe-clean', async ({ page }) => {
    await installConsentHarness(page)
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .include('[data-testid="site-footer"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      results.violations,
      results.violations.map((v) => `  • [${v.id}] ${v.help}`).join('\n'),
    ).toEqual([])
  })
})

test.describe('US5 — privacy policy page', () => {
  test('renders as a page with its own heading', async ({ page }) => {
    await page.goto('/privacy-policy')
    await expect(page.locator('[data-page-slug="privacy-policy"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible()
  })

  test('carries the footer consent control for changing/withdrawing consent', async ({ page }) => {
    await installConsentHarness(page)
    await page.goto('/privacy-policy')
    await expect(page.getByTestId('consent-preferences')).toBeVisible()
  })

  test('shows the canonical Cheyenne address with zero Sapulpa references (SC-007)', async ({
    page,
  }) => {
    await page.goto('/privacy-policy')
    const text = (await page.locator('body').innerText()).toLowerCase()
    expect(text).toContain('12 n cheyenne ave')
    expect(text).toContain('tulsa, ok 74103')
    expect(text).not.toContain('sapulpa')
  })

  test('is reachable from the footer privacy link', async ({ page }) => {
    await page.goto('/')
    await page
      .getByTestId('site-footer')
      .getByRole('link', { name: /privacy policy/i })
      .click()
    await expect(page).toHaveURL(/\/privacy-policy$/)
  })

  test('is axe-clean', async ({ page }) => {
    await page.goto('/privacy-policy')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      results.violations,
      `axe found ${results.violations.length} violation(s) on /privacy-policy:\n` +
        results.violations.map((v) => `  • [${v.id}] ${v.help} — ${v.helpUrl}`).join('\n'),
    ).toEqual([])
  })
})
