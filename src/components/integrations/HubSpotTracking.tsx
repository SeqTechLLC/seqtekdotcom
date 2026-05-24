import Script from 'next/script'
import { headers } from 'next/headers'
import { NONCE_HEADER } from '@/lib/csp'

/**
 * HubSpot tracking loader — env-gated (no real network hits when
 * NEXT_PUBLIC_HUBSPOT_PORTAL_ID is unset). This single script bootstraps
 * the cookie banner, chat widget, collected-forms tracking, web
 * interactives, and the ad-pixel bridge per INTEGRATIONS.md §1.1.
 *
 * Loaded `afterInteractive`. Strict-dynamic in the CSP propagates trust to
 * the sub-scripts HubSpot inserts dynamically.
 */
export async function HubSpotTracking() {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID
  if (!portalId) return null

  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined

  return (
    <Script
      id="hs-script-loader"
      strategy="afterInteractive"
      nonce={nonce}
      src={`https://js.hs-scripts.com/${portalId}.js`}
    />
  )
}
