# 0006. HubSpot consent bridge on `addPrivacyConsentListener`, fail-closed

**Status:** Accepted
**Date:** 2026-06-03

## Context

A visitor's choice in HubSpot's cookie banner has to govern the GTM tags. The first bridge listened for an
`__hs_opt_in_consent` DOM event, which appears nowhere in HubSpot's documentation and most likely never fired, leaving
consent pinned at denied. HubSpot's documented mechanism is a callback on its privacy queue:
`window._hsp.push(['addPrivacyConsentListener', cb])`, where `cb(consent)` receives
`consent.categories.{analytics,advertisement,functionality}` and a `consent.allowed` fallback.

Whether visitors outside the EU are opted in by default is a HubSpot portal banner setting, not application code.

## Options considered

- **Keep `__hs_opt_in_consent`** — undocumented and almost certainly never fires.
- **Poll HubSpot's consent cookies** — racy against tag evaluation.
- **The official listener** — documented, fires on a banner choice and on load for returning visitors, and adds no
  dependency.

## Decision

`ConsentDefault.tsx` sets the Consent Mode v2 default (everything denied except functionality,
`wait_for_update: 500`) and registers `addPrivacyConsentListener`. The callback maps
`consent.allowed || consent.categories.<cat>` to Consent Mode signals (analytics → `analytics_storage`; advertisement →
`ad_storage`, `ad_user_data`, `ad_personalization`) and fires a `hubspotConsentUpdate` event for tags without built-in
consent checks. The code stays fail-closed for every visitor; any regional relaxation belongs in the portal's banner
policy.

## Consequences

- Consent propagates, verified by the consent E2E and a deny-all network check.
- One consent UI: HubSpot's own banner, reopened from the footer.
- The bridge depends on HubSpot keeping the `_hsp` API and its category keys stable (`advertisement` is spelled in
  full); the E2E pins the contract.

## Revisit when

HubSpot changes the listener's payload or ships a first-party GTM bridge for externally hosted scripts, or the consent
regime is set in the portal (ROADMAP HS-1).
