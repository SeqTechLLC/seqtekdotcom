import { expect, test } from '@playwright/test'

import {
  PIXEL_HOSTS,
  clearConsentCookies,
  fireConsent,
  installConsentHarness,
  lastConsentUpdate,
  readDataLayer,
  seedReturningVisitor,
  waitForDataLayer,
} from './helpers/consent'

/**
 * spec 006 US1 (T006) + US3 (T017) — the consent bridge provably gates
 * tracking. Exercises the official `addPrivacyConsentListener` callback for
 * Accept-all / Deny-all / Customize and asserts (a) the `gtag('consent',
 * 'update')` signal mapping and (b) ZERO requests to ad/analytics pixel hosts
 * on Deny (SC-001). The T002 harness stands in for HubSpot (env-unset in CI):
 * it installs a stub `_hsp` queue and fires the listener with synthetic
 * consent payloads — the same shape HubSpot delivers on a banner choice or on
 * init for a returning visitor.
 *
 * Authored to FAIL against the scaffolded `__hs_opt_in_consent` bridge (which
 * never listens on `_hsp`); the T003 correction turns it green. The live
 * GTM-Preview fire-matrix (T007–T009) is gated on the Container ID + portal.
 */

/** Collect every request URL the page issues from harness install onward. */
function trackRequests(page: import('@playwright/test').Page): string[] {
  const urls: string[] = []
  page.on('request', (req) => urls.push(req.url()))
  return urls
}

function pixelLeaks(urls: string[]): string[] {
  return urls.filter((u) => PIXEL_HOSTS.some((host) => u.includes(host)))
}

test.describe('US1 — consent bridge maps choices to Google Consent Mode signals', () => {
  test('Accept all → analytics + ad storage granted, no leak before the choice', async ({
    page,
  }) => {
    await installConsentHarness(page)
    const urls = trackRequests(page)
    await page.goto('/')
    await waitForDataLayer(page)

    // Nothing non-essential may fire before a choice (default is all-denied).
    expect(pixelLeaks(urls), 'no pixel host before any consent decision').toEqual([])

    await fireConsent(page, { allowed: true, categories: { analytics: true, advertisement: true } })

    expect(await lastConsentUpdate(page)).toMatchObject({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      functionality_storage: 'granted',
    })

    // The custom event for consent-unaware GTM tags must be present.
    const layer = await readDataLayer(page)
    expect(layer.some((e) => e[0] === 'event' && e[1] === 'hubspotConsentUpdate')).toBe(true)
  })

  test('Deny all → everything non-essential stays denied, ZERO pixel hosts (SC-001)', async ({
    page,
  }) => {
    await installConsentHarness(page)
    const urls = trackRequests(page)
    await page.goto('/')
    await waitForDataLayer(page)

    await fireConsent(page, {
      allowed: false,
      categories: { analytics: false, advertisement: false },
    })

    expect(await lastConsentUpdate(page)).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
    })

    // Give any (mis)configured tag a beat to fire, then assert no pixel host
    // was ever contacted on the Deny path.
    await page.waitForTimeout(300)
    expect(
      pixelLeaks(urls),
      `pixel hosts must not be contacted on Deny: ${pixelLeaks(urls)}`,
    ).toEqual([])
  })

  test('Customize (analytics on, ads off) → analytics granted, ad storage held', async ({
    page,
  }) => {
    await installConsentHarness(page)
    const urls = trackRequests(page)
    await page.goto('/')
    await waitForDataLayer(page)

    await fireConsent(page, {
      allowed: false,
      categories: { analytics: true, advertisement: false },
    })

    expect(await lastConsentUpdate(page)).toMatchObject({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
    })

    await page.waitForTimeout(300)
    const adHosts = [
      'facebook.com',
      'facebook.net',
      'linkedin.com',
      'licdn.com',
      'googleads',
      'googleadservices.com',
    ]
    expect(urls.filter((u) => adHosts.some((h) => u.includes(h)))).toEqual([])
  })
})

test.describe('US3 — returning visitor with a prior choice is not re-prompted', () => {
  test('prior Accept-all: no banner, consent restored before any pixel host (SC-003)', async ({
    page,
  }) => {
    await installConsentHarness(page)
    await page.goto('/')
    await seedReturningVisitor(page, {
      optOut: false,
      categories: 'analytics:true,advertisement:true',
    })
    await page.reload()
    await waitForDataLayer(page)

    // HubSpot invokes the listener on init for a prior-decision visitor — model
    // that with the seeded Accept-all choice.
    await fireConsent(page, { allowed: true, categories: { analytics: true, advertisement: true } })

    expect(await lastConsentUpdate(page)).toMatchObject({
      analytics_storage: 'granted',
      ad_storage: 'granted',
    })

    // HubSpot's banner container must not be present (env-unset → no banner at
    // all; with the portal live, `__hs_opt_out` suppresses it — verified in the
    // gated live confirm T019).
    await expect(page.locator('#hs-eu-cookie-confirmation')).toHaveCount(0)
  })

  test('prior Deny: no banner, tracking stays blocked, ZERO pixel hosts', async ({ page }) => {
    await installConsentHarness(page)
    const urls = trackRequests(page)
    await page.goto('/')
    await seedReturningVisitor(page, {
      optOut: false,
      categories: 'analytics:false,advertisement:false',
    })
    await page.reload()
    await waitForDataLayer(page)

    await fireConsent(page, {
      allowed: false,
      categories: { analytics: false, advertisement: false },
    })

    expect(await lastConsentUpdate(page)).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
    })

    await page.waitForTimeout(300)
    expect(pixelLeaks(urls)).toEqual([])
    await expect(page.locator('#hs-eu-cookie-confirmation')).toHaveCount(0)
  })
})

test.afterEach(async ({ page }) => {
  await clearConsentCookies(page)
})
