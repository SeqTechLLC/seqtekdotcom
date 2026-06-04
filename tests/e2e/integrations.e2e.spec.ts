import { expect, test } from '@playwright/test'

test.describe('Third-party integration bootstrap', () => {
  test('consent-default snippet is shipped in the page HTML', async ({ page }) => {
    const response = await page.goto('/')
    expect(response, 'expected response from /').toBeTruthy()
    const html = await response!.text()

    // The inline consent default + bridge is rendered as a plain <head> script
    // (React 19 Document Metadata hoisting), so we look for the snippet text.
    expect(html).toContain("gtag('consent', 'default'")
    expect(html).toContain("analytics_storage: 'denied'")
    expect(html).toContain("functionality_storage: 'granted'")
    expect(html).toContain('wait_for_update: 500')
    // The bridge uses HubSpot's OFFICIAL consent API (research R1 / ADR 0006),
    // not the unofficial `__hs_opt_in_consent` event the scaffold shipped.
    expect(html).toContain('addPrivacyConsentListener')
    expect(html).not.toContain('__hs_opt_in_consent')
    expect(html).toContain("gtag('consent', 'update'")
    expect(html).toContain('hubspotConsentUpdate')
  })

  test('consent default + bridge listener actually execute at runtime', async ({ page }) => {
    // This introspects the inline `_hsp` QUEUE array, which only holds when the
    // real HubSpot script is absent (env-unset CI). With a real portal set, the
    // loaded tracking script replaces `_hsp` with its own object — the live
    // listener behavior is then the gated staging verification (T009/T019).
    test.skip(
      !!process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
      'HubSpot portal is set — real _hsp owns the queue; bridge runtime check is CI-only',
    )
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

    // With HubSpot env unset, the real tracking script never loads, so `_hsp`
    // stays the inline-created queue array. The bridge MUST have pushed an
    // ['addPrivacyConsentListener', fn] entry onto it. Pull the callback and
    // invoke it directly (this is exactly what HubSpot does on init / banner
    // choice) and assert it drives a consent update + the custom event.
    const result = await page.evaluate(() => {
      type Win = {
        _hsp?: unknown[]
        dataLayer: ArrayLike<unknown>[]
      }
      const w = window as unknown as Win
      const queue = Array.isArray(w._hsp) ? w._hsp : []
      const entry = queue.find((e) => Array.isArray(e) && e[0] === 'addPrivacyConsentListener') as
        | [string, (c: unknown) => void]
        | undefined
      if (!entry) return { registered: false, updated: false }
      const before = w.dataLayer.length
      entry[1]({ allowed: false, categories: { analytics: true, advertisement: false } })
      const after = Array.from(w.dataLayer).map((x) => Array.from(x as ArrayLike<unknown>))
      const update = after.find((x) => x[0] === 'consent' && x[1] === 'update')
      const customEvent = after.find((x) => x[0] === 'event' && x[1] === 'hubspotConsentUpdate')
      return {
        registered: true,
        updated: w.dataLayer.length > before,
        analyticsGranted:
          (update?.[2] as { analytics_storage?: string } | undefined)?.analytics_storage ===
          'granted',
        adsDenied: (update?.[2] as { ad_storage?: string } | undefined)?.ad_storage === 'denied',
        firedCustomEvent: !!customEvent,
      }
    })
    expect(result.registered, 'bridge should register addPrivacyConsentListener').toBe(true)
    expect(result.updated, 'bridge listener should push a consent update').toBe(true)
    expect(result.analyticsGranted, 'analytics:true → analytics_storage granted').toBe(true)
    expect(result.adsDenied, 'advertisement:false → ad_storage denied').toBe(true)
    expect(result.firedCustomEvent, 'bridge should fire hubspotConsentUpdate event').toBe(true)
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
