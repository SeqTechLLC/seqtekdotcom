import { headers } from 'next/headers'
import { NONCE_HEADER } from '@/lib/csp'

/**
 * Inline consent default + HubSpot ↔ GTM consent bridge.
 *
 * Per INTEGRATIONS.md §2.2 this must run before HubSpot and GTM load (both
 * arrive `afterInteractive`, in non-deterministic order). React 19 hoists
 * `<script>` elements into `<head>` automatically (Document Metadata
 * support), so we render a plain inline tag — rather than `next/script`'s
 * `beforeInteractive` queue, which currently mismatches nonces during
 * client hydration under Next 16 + React 19.
 *
 * Two responsibilities are folded into one script:
 *  1. Initialize `window.dataLayer` and stamp the GTM consent default
 *     (everything denied except functionality; `wait_for_update: 500` gives
 *     the HubSpot banner time to rehydrate a prior-consent cookie before
 *     any tag evaluates).
 *  2. Register the `__hs_opt_in_consent` listener so the bridge is already
 *     wired when HubSpot's banner (or its returning-visitor rehydration)
 *     fires consent.
 */
const SNIPPET = `
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  wait_for_update: 500
});
window.addEventListener('__hs_opt_in_consent', function(event){
  var c = (event && event.detail) || {};
  gtag('consent', 'update', {
    analytics_storage: c.analytics ? 'granted' : 'denied',
    ad_storage: c.advertisement ? 'granted' : 'denied',
    ad_user_data: c.advertisement ? 'granted' : 'denied',
    ad_personalization: c.advertisement ? 'granted' : 'denied',
    functionality_storage: 'granted'
  });
});
`.trim()

export async function ConsentDefault() {
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined
  return (
    <script
      id="consent-default"
      nonce={nonce}
      // React 19 strips the `nonce` attribute from its in-memory tree after
      // applying it to the DOM (XSS hardening — see react-dom Script docs),
      // which then trips a dev-mode hydration warning comparing server
      // nonce="X" vs client nonce="". The script still executes correctly;
      // suppress the warning since this is React's documented behavior.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SNIPPET }}
    />
  )
}
