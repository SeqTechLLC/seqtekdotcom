# Contract: HubSpot → GTM consent bridge and footer control

Implemented in `src/components/integrations/ConsentDefault.tsx` (an inline `<head>` script) and
`src/components/layout/ConsentPreferences.tsx` (the footer control). ADR 0006 records why.

## C1 — Consent default

The script carries the request nonce and runs in `<head>` before GTM and HubSpot load; both load
`afterInteractive` in no fixed order. It initialises `window.dataLayer` and a `gtag` shim, then sets
the Consent Mode default:

- `analytics_storage`, `ad_storage`, `ad_user_data` and `ad_personalization`: `denied`;
- `functionality_storage`: `granted`;
- `wait_for_update: 500`.

## C2 — The bridge

In the same script, `_hsp.push(['addPrivacyConsentListener', cb])` registers HubSpot's documented
consent listener.

- **When it runs.** HubSpot calls it when the banner reports a choice, and also on init for a
  returning visitor. So pushing it before the tracking code loads still delivers consent.
- **What it grants.** A category is granted when `consent.allowed` or `consent.categories.<cat>` is
  set, which covers both notice-only and per-category policies. `analytics` grants
  `analytics_storage`. `advertisement` (HubSpot's spelling) grants `ad_storage`, `ad_user_data` and
  `ad_personalization`. `functionality_storage` stays granted.
- **What it fires.** After each `gtag('consent', 'update', …)`, it fires the event
  `hubspotConsentUpdate`. GTM's Custom Event trigger must use that exact name.
- **Which queue.** `_hsp` is HubSpot's privacy queue, distinct from the `_hsq` analytics queue.

## C3 — Footer consent-preferences control

| Action              | Call                                        | Result                                                       |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Re-open preferences | `window._hsp.push(['showBanner'])`          | the banner reopens with the visitor's current choices        |
| Withdraw            | `window._hsp.push(['revokeCookieConsent'])` | HubSpot's consent cookies clear; the next load is all-denied |

It is a no-op, never a throw, when HubSpot is not loaded. It sits in the footer's legal links, so
it is on every page, keyboard-operable and axe-clean.

## Verification

- `tests/e2e/consent-flows.e2e.spec.ts` covers the default, the bridge mapping, and a deny path that
  sends zero requests to Meta, LinkedIn, Google Ads or HubSpot analytics.
- `tests/e2e/privacy-consent-ui.e2e.spec.ts` covers C3.
