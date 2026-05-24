import { expect, test } from '@playwright/test'

test.describe('Third-party integration bootstrap', () => {
  test('consent-default snippet is shipped in the page HTML', async ({ page }) => {
    const response = await page.goto('/')
    expect(response, 'expected response from /').toBeTruthy()
    const html = await response!.text()

    // Next.js Script (beforeInteractive) serializes the body into its bootstrap
    // queue, so we look for the snippet text rather than a literal <script id>.
    expect(html).toContain("gtag('consent', 'default'")
    expect(html).toContain("analytics_storage: 'denied'")
    expect(html).toContain("functionality_storage: 'granted'")
    expect(html).toContain('wait_for_update: 500')
    expect(html).toContain('__hs_opt_in_consent')
    expect(html).toContain("gtag('consent', 'update'")
  })

  test('consent default + bridge listener actually execute at runtime', async ({ page }) => {
    await page.goto('/')

    // Wait for the bootstrap queue to flush and the snippet to run.
    await page.waitForFunction(() =>
      Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer),
    )

    // gtag('consent', 'default', { … }) pushes an Arguments object; convert
    // each entry to a plain array so we can introspect it in Node.
    const dataLayer = await page.evaluate(() => {
      const raw = (window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer
      return Array.from(raw).map((entry) => Array.from(entry as ArrayLike<unknown>))
    })

    const consentDefault = dataLayer.find(
      (entry) => entry[0] === 'consent' && entry[1] === 'default',
    )
    expect(consentDefault, 'expected gtag consent default entry in dataLayer').toBeTruthy()
    expect(consentDefault?.[2]).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      wait_for_update: 500,
    })

    // The bridge listener should be registered by the time the snippet finishes.
    const bridgeFiresUpdate = await page.evaluate(() => {
      const before = (window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer.length
      window.dispatchEvent(
        new CustomEvent('__hs_opt_in_consent', {
          detail: { analytics: true, advertisement: false },
        }),
      )
      const after = (window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer.length
      return after > before
    })
    expect(bridgeFiresUpdate, 'bridge listener should push a consent update').toBe(true)
  })

  test('GTM and HubSpot script tags do not render when env vars are unset', async ({ page }) => {
    test.skip(
      !!process.env.NEXT_PUBLIC_GTM_ID || !!process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
      'integration env vars are set — skipping the absent-loaders assertion',
    )
    const response = await page.goto('/')
    const html = await response!.text()
    expect(html).not.toContain('googletagmanager.com/gtm.js')
    expect(html).not.toContain('js.hs-scripts.com')
  })
})
