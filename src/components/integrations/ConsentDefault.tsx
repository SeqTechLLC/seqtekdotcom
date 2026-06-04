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
 *  2. Register HubSpot's official consent listener
 *     (`_hsp.push(['addPrivacyConsentListener', cb])`) so the bridge is
 *     already wired when HubSpot's banner (or its returning-visitor
 *     rehydration on init) reports a consent decision.
 *
 * The listener is HubSpot's documented consent-change mechanism
 * (developers.hubspot.com/docs/api-reference/cookie-banner/cookie-banner-api).
 * It supersedes the unofficial `__hs_opt_in_consent` DOM event the scaffold
 * used — that event name appears nowhere in HubSpot's docs and most likely
 * never fired, silently pinning consent at the all-denied default. See
 * research.md R1 + ADR 0006. The `_hsp` *privacy* queue is distinct from the
 * `_hsq` analytics queue — do not cross them (research R2).
 *
 * Consent payload (research R1): treat a category as granted when
 * `consent.allowed` (banner-off / notify-only / accepted) OR the per-category
 * flag is set. HubSpot's category keys are exactly `analytics`,
 * `advertisement` (full word — spelling is load-bearing), `functionality`.
 * After mapping to Google Consent Mode v2 signals, fire a
 * `hubspotConsentUpdate` Custom Event so GTM tags without built-in consent
 * checks can trigger off it (contracts/gtm-consent-governance.md G2).
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
var _hsp = (window._hsp = window._hsp || []);
_hsp.push(['addPrivacyConsentListener', function(consent){
  var analytics = !!(consent && (consent.allowed || (consent.categories && consent.categories.analytics)));
  var ads = !!(consent && (consent.allowed || (consent.categories && consent.categories.advertisement)));
  gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: ads ? 'granted' : 'denied',
    ad_user_data: ads ? 'granted' : 'denied',
    ad_personalization: ads ? 'granted' : 'denied',
    functionality_storage: 'granted'
  });
  gtag('event', 'hubspotConsentUpdate');
}]);
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
