import type { Page } from '@playwright/test'

/**
 * Shared consent E2E harness (spec 006 T002).
 *
 * In local/CI the HubSpot env (`NEXT_PUBLIC_HUBSPOT_PORTAL_ID`) is unset, so
 * the real `js.hs-scripts.com` loader never runs and the live `_hsp` consent
 * queue is never drained. This harness stands in for HubSpot: it installs a
 * stub `window._hsp` whose `push` intercepts the official commands the bridge
 * + footer control use (`addPrivacyConsentListener`, `showBanner`,
 * `revokeCookieConsent`), records every call, and exposes
 * `window.__fireConsent(consent)` to invoke the registered listener with a
 * synthetic consent payload — exactly how HubSpot invokes it on a banner
 * choice or on init for a returning visitor.
 *
 * The stub is installed via `addInitScript`, so it is defined BEFORE the
 * inline `ConsentDefault` snippet runs (`window._hsp || []` keeps the stub).
 */

/**
 * Hosts that must NEVER be contacted before/without consent. Asserted absent
 * from network traffic on the Deny path (SC-001). With the loaders env-unset
 * in CI these are trivially absent; the assertion still guards against a
 * regression that hard-codes a pixel.
 */
export const PIXEL_HOSTS = [
  'facebook.com',
  'facebook.net',
  'connect.facebook.net',
  'linkedin.com',
  'px.ads.linkedin.com',
  'snap.licdn.com',
  'googleads.g.doubleclick.net',
  'googleadservices.com',
  'google-analytics.com',
  'track.hubspot.com',
] as const

/** The HubSpot `addPrivacyConsentListener` payload shape (research R1). */
export type FakeConsent = {
  allowed?: boolean
  categories?: {
    analytics?: boolean
    advertisement?: boolean
    functionality?: boolean
  }
}

/** A single Google Consent Mode `gtag('consent','update', …)` signal map. */
export type ConsentUpdate = {
  analytics_storage?: 'granted' | 'denied'
  ad_storage?: 'granted' | 'denied'
  ad_user_data?: 'granted' | 'denied'
  ad_personalization?: 'granted' | 'denied'
  functionality_storage?: 'granted' | 'denied'
}

declare global {
  interface Window {
    __hspCalls?: unknown[][]
    __consentListeners?: Array<(c: unknown) => void>
    __fireConsent?: (consent: unknown) => void
    _hsp?: unknown
    // Matches the existing global augmentation elsewhere in the project.
    dataLayer?: Record<string, unknown>[]
  }
}

/**
 * Install the stub `_hsp` queue before any page script runs. Must be called
 * before `page.goto(...)`.
 */
export async function installConsentHarness(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as Window
    w.__hspCalls = []
    w.__consentListeners = []
    w._hsp = {
      push(args: unknown[]) {
        w.__hspCalls!.push(args)
        if (
          Array.isArray(args) &&
          args[0] === 'addPrivacyConsentListener' &&
          typeof args[1] === 'function'
        ) {
          w.__consentListeners!.push(args[1] as (c: unknown) => void)
        }
        return w.__hspCalls!.length
      },
    }
    w.__fireConsent = (consent: unknown) => {
      ;(w.__consentListeners ?? []).forEach((cb) => cb(consent))
    }
  })
}

/**
 * Simulate HubSpot invoking the consent listener (banner choice or
 * returning-visitor init rehydration).
 */
export async function fireConsent(page: Page, consent: FakeConsent): Promise<void> {
  await page.evaluate((c) => {
    ;(window as Window).__fireConsent?.(c)
  }, consent)
}

/** All `['command', …]` arrays pushed onto the stub `_hsp` queue. */
export async function hspCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => (window as Window).__hspCalls ?? [])
}

/** Wait until `window.dataLayer` exists (the inline consent default ran). */
export async function waitForDataLayer(page: Page): Promise<void> {
  await page.waitForFunction(() => Array.isArray((window as Window).dataLayer))
}

/** dataLayer flattened to plain arrays (Arguments objects → arrays). */
export async function readDataLayer(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => {
    const raw = (window as Window).dataLayer ?? []
    return Array.from(raw).map((entry) => Array.from(entry as unknown as ArrayLike<unknown>))
  })
}

/** The last `gtag('consent','update', …)` signal map pushed to dataLayer. */
export async function lastConsentUpdate(page: Page): Promise<ConsentUpdate | undefined> {
  const layer = await readDataLayer(page)
  const updates = layer.filter((e) => e[0] === 'consent' && e[1] === 'update')
  return updates.length ? (updates[updates.length - 1][2] as ConsentUpdate) : undefined
}

/**
 * Seed the HubSpot consent cookies for a returning visitor with a prior choice
 * (research R3). `__hs_opt_out=no` + a category-preference cookie = a visitor
 * who already decided and should not be re-prompted.
 */
export async function seedReturningVisitor(
  page: Page,
  opts: { optOut: boolean; categories: string },
): Promise<void> {
  const url = new URL(page.url() || 'http://localhost:3100')
  await page.context().addCookies([
    {
      name: '__hs_opt_out',
      value: opts.optOut ? 'yes' : 'no',
      domain: url.hostname,
      path: '/',
    },
    {
      name: '__hs_cookie_cat_pref',
      value: opts.categories,
      domain: url.hostname,
      path: '/',
    },
    {
      name: 'hubspotutk',
      value: 'seeded-visitor-token',
      domain: url.hostname,
      path: '/',
    },
  ])
}

/** Clear the HubSpot consent cookies (simulate a fresh, never-decided visitor). */
export async function clearConsentCookies(page: Page): Promise<void> {
  await page.context().clearCookies()
}
