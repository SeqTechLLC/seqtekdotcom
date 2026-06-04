# Contract: HubSpot → GTM consent bridge + footer control

Client-side surface in `ConsentDefault.tsx` (inline `<head>`) and `ConsentPreferences.tsx` (footer). Sources: research.md R1/R2/R4.

## C1 — Consent default (stamped before any third-party evaluates)

```js
window.dataLayer = window.dataLayer || []
function gtag() {
  dataLayer.push(arguments)
}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  wait_for_update: 500,
})
```

- MUST execute in `<head>` carrying the request nonce, before GTM/HubSpot load (both `afterInteractive`, non-deterministic order). Already the case.
- (Regime/geo) — an optional `region: [EU…]` scoping on the default is a portal/legal decision (R5), out of code scope here.

## C2 — The bridge (REPLACES the `__hs_opt_in_consent` listener)

```js
var _hsp = (window._hsp = window._hsp || [])
_hsp.push([
  'addPrivacyConsentListener',
  function (consent) {
    var analytics = !!(
      consent &&
      (consent.allowed || (consent.categories && consent.categories.analytics))
    )
    var ads = !!(
      consent &&
      (consent.allowed || (consent.categories && consent.categories.advertisement))
    )
    gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: ads ? 'granted' : 'denied',
      ad_user_data: ads ? 'granted' : 'denied',
      ad_personalization: ads ? 'granted' : 'denied',
      functionality_storage: 'granted',
    })
    gtag('event', 'hubspotConsentUpdate') // GTM Custom Event trigger of this exact name
  },
])
```

**Contract guarantees**

- Pushing the listener before the tracking code loads MUST still deliver consent (HubSpot invokes the callback on init) → covers returning-visitor rehydration (US3).
- Category read order: `consent.allowed` OR `consent.categories.<cat>` (handle notify-only + per-category policies).
- Mapping is fixed: `analytics→analytics_storage`; `advertisement→ad_storage+ad_user_data+ad_personalization`; functionality stays granted.
- Event name `hubspotConsentUpdate` MUST match the GTM trigger (gtm-consent-governance.md).

## C3 — Footer consent-preferences control (`ConsentPreferences.tsx`, `'use client'`)

| Action              | Call                                        | Result                                                      |
| ------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Re-open preferences | `window._hsp.push(['showBanner'])`          | banner resurfaces with current choices (US4)                |
| Withdraw / clear    | `window._hsp.push(['revokeCookieConsent'])` | HubSpot consent cookies cleared; next load = default-denied |

- MUST be inert (render a static element or no-op) when `window._hsp` is absent (env-unset local/CI) — never throw.
- MUST be reachable from every page (mounted in `SiteFooter` `legalNav`), keyboard-operable, and axe-clean (Principle II).

## C4 — `dataLayer` events (consumed by GTM)

| Event                  | When                      | Note                                                             |
| ---------------------- | ------------------------- | ---------------------------------------------------------------- |
| `consent` `default`    | head, pre-load            | all denied except functionality                                  |
| `consent` `update`     | on each listener callback | mapped per C2                                                    |
| `hubspotConsentUpdate` | after each update         | custom-event trigger hook for tags without native consent checks |

(Form `dataLayer` events `form_submission_*` are owned by spec 005, unchanged.)

## C5 — Verification hooks (for E2E)

- A returning visitor is simulated by pre-seeding `__hs_opt_out` + `__hs_cookie_cat_pref`; assert the banner is not shown and the `update` reflects the seeded choice before any pixel host appears in network.
- Deny path: assert **zero** requests to Meta/LinkedIn/Google-Ads/HubSpot-analytics hosts (SC-001).
