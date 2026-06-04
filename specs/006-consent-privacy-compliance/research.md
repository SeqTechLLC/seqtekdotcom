# Phase 0 Research: Consent & Privacy Compliance

All HubSpot facts below were fetched from official docs (developers.hubspot.com / knowledge.hubspot.com) at plan time — not training data (per the "verify, don't guess" rule + Constitution Principle I). Each decision flags what is **confirmed** vs **assumption to verify empirically**.

---

## R1 — HubSpot consent API: the bridge must use `addPrivacyConsentListener`, not `__hs_opt_in_consent`

**Decision**: Drive the HubSpot → GTM consent bridge off `window._hsp.push(['addPrivacyConsentListener', cb])`, reading `consent.categories.{analytics,advertisement,functionality}` with a `consent.allowed` fallback. Replace the current `window.addEventListener('__hs_opt_in_consent', …)` path in `ConsentDefault.tsx`.

**Rationale**: `__hs_opt_in_consent` appears **nowhere** in official HubSpot docs (both cookie-banner-api page variants + the consent-banner FAQ were checked). It is a community/third-party pattern. The official, documented consent-change mechanism is the `addPrivacyConsentListener` callback. As scaffolded, our bridge most likely **never fires**, which would silently leave consent stuck at the all-denied default — analytics/ads would never turn on even after "Accept all." This is the single highest-impact correction in the spec and the spine of US1.

**Confirmed API surface** (source: developers.hubspot.com/docs/api-reference/cookie-banner/cookie-banner-api):

```js
var _hsp = (window._hsp = window._hsp || [])
_hsp.push([
  'addPrivacyConsentListener',
  function (consent) {
    // consent.allowed                       -> boolean (true if notify-only/banner-off/accepted)
    // consent.categories.analytics          -> boolean
    // consent.categories.advertisement      -> boolean   (NOTE spelling: "advertisement")
    // consent.categories.functionality      -> boolean
  },
])
```

- The callback is invoked **immediately** if the tracking code is already loaded, or as soon as it loads if pushed first — this is the returning-visitor rehydration path (see R3).
- Category keys are exactly three: `analytics`, `advertisement`, `functionality`. There is **no** `necessary` key (necessary cookies are unconditional). Our existing field names happen to be right; the _source_ (event vs listener) is what's wrong.

**Alternatives considered**: keeping the `__hs_opt_in_consent` event (rejected — unverified, likely non-firing); a custom polling loop on the consent cookies (rejected — racy, reinvents the listener).

**Follow-on (Principle III)**: INTEGRATIONS.md §2.2 documents the `__hs_opt_in_consent` approach verbatim and must be reconciled to the listener API in the same commit that fixes `ConsentDefault.tsx`. Candidate ADR to capture the correction so it isn't re-litigated.

---

## R2 — Footer consent-preferences control

**Decision**: The footer control re-opens HubSpot's own banner via `_hsp.push(['showBanner'])`; offer a secondary "withdraw / clear" affordance via `_hsp.push(['revokeCookieConsent'])`. No custom consent UI is built.

**Rationale** (confirmed, same source): `showBanner` — _"Resurface the banner, enabling website visitors to make changes to their consent preferences"_ (works for Opt-In and Cookie-by-Category policies). `revokeCookieConsent` — _"Remove the cookies created by the HubSpot tracking code… under GDPR."_ This satisfies FR-006/US4 with the official API and keeps a single consent UI (HubSpot's), avoiding a parallel custom banner. The control is a small `'use client'` component (needs `onClick` → `window._hsp`); it renders inertly when HubSpot isn't loaded (env-unset local/CI) so it never throws.

**Watch-out**: `_hsp` (privacy queue) ≠ `_hsq` (analytics queue, e.g. `doNotTrack`). Don't cross them.

---

## R3 — Returning-visitor persistence & the consent cookies

**Decision**: Rely on HubSpot's first-party cookies for persistence; verify the "no re-prompt + state restored before any tag" guarantee in E2E rather than asserting it from a single doc line.

**Confirmed cookies** (source: knowledge.hubspot.com/privacy-and-consent/what-cookies-does-hubspot-set-in-a-visitor-s-browser):

| Cookie                 | Holds               | Role                                                                         | Expiry |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------- | ------ |
| `__hs_opt_out`         | `yes`/`no`          | "remember not to ask the visitor to accept cookies again" — the re-show gate | 6 mo   |
| `__hs_cookie_cat_pref` | per-category choice | records which categories were consented                                      | 6 mo   |
| `__hs_initial_opt_in`  | `yes`/`no`          | prevents the banner always displaying in strict mode                         | 7 d    |
| `__hs_do_not_track`    | `yes`               | block sending any info to HubSpot                                            | 6 mo   |
| `hubspotutk`           | opaque GUID         | visitor token; sent on form submit (links to spec 005 `hutk`)                | 6 mo   |

**Corrections to prior assumptions**: there is **no `__hs_opt_in` cookie** (the persistence cookie is `__hs_opt_out`). `hubspotutk` and `__hs_do_not_track` were correctly named.

**Partially confirmed**: the listener fires on init for a prior-decision visitor (confirmed) AND the banner stays hidden (inferred from `__hs_opt_out` = "remember not to ask… again" + FAQ: _"the banner may not appear again… because it has already received and remembered your consent"_). No single doc sentence states the conjunction, so **US3's "0 re-prompts + state restored before first tag" is verified by E2E, not assumed.**

---

## R4 — GTM consent-mode bridge is the official custom pattern (no magic auto-bridge)

**Decision**: Build the bridge as the documented custom `addPrivacyConsentListener` → `gtag('consent','update', …)` mapping, and additionally fire `gtag('event','hubspotConsentUpdate')` so GTM tags without built-in consent checks can trigger off a GTM Custom Event trigger of the same name. Govern the 10 paid tags with consent requirements in the container.

**Rationale** (source: developers.hubspot.com/docs/api-reference/cookie-banner/google-consent-mode): HubSpot only auto-bridges Consent Mode for its **native** GA4/GTM integrations. For an **externally-hosted** tracking script (our case) the docs explicitly require manual wiring and provide the exact snippet. Category→signal mapping (confirmed):

| HubSpot category | Google signals                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `analytics`      | `analytics_storage`                                                                              |
| `advertisement`  | `ad_storage`, `ad_user_data`, `ad_personalization`                                               |
| `functionality`  | (not mapped to a Google signal in HubSpot's example; we keep `functionality_storage: 'granted'`) |

Notably, HubSpot's official `gtag('consent','default', …)` example scopes the EU `region` array for default-denied — see R5.

**Alternatives considered**: a GTM-native HubSpot consent template (rejected — only applies to HubSpot's native GA integration, not our raw script); reading cookies in a GTM custom variable (rejected — racy vs the listener).

---

## R5 — Consent regime: fail-closed everywhere, geo as portal config

**Decision**: Build a fail-closed (default-denied / opt-in) posture for all visitors in code — which is already the `ConsentDefault.tsx` default and is valid under both GDPR opt-in and US notice-only regimes. The legal choice (strict opt-in vs notice-only, and any EU-region-scoped banner) is a HubSpot portal + leadership/legal decision deferred to Phase 5.5, not a code fork here.

**Rationale**: HubSpot's own official Consent Mode example scopes default-denied to the EU `region` list (implying auto-grant outside the EU under a notice-only policy). SEQTEK is a US (Tulsa/OKC/NW-Ark/KC) B2B firm, so notice-only-outside-EU is a plausible target — but that is a banner-policy setting in the HubSpot portal (Opt-In vs Cookie-by-Category vs Notify), not application code. Code stays strictest-safe; the portal narrows it. This mirrors the spec's Assumptions and keeps the engineering deliverable regime-agnostic.

---

## R6 — CSP enforce: the banner-style risk is the soak's primary target

**Decision**: Keep `lib/csp.ts` building `style-src 'self'` for public routes for now, ship the enforce **machinery + gate**, and make "does the live HubSpot banner render correctly under enforcing `style-src 'self'`?" the **#1 acceptance item of the report-only soak**. If the soak shows the banner injects inline `style="…"`/`<style>` that strict CSP blocks, relax public `style-src` to include `'unsafe-inline'` (or a hashed/nonced allowance if feasible) — a one-line change in the single policy builder — and re-soak that directive.

**Rationale**: No official HubSpot CSP doc enumerates per-directive hosts or confirms whether the banner needs `'unsafe-inline'` styles. Community sources (non-authoritative) indicate HubSpot UI generally needs `style-src 'unsafe-inline'`. Guessing either way is wrong; the **report-only soak is precisely the mechanism the constitution mandates** (Principle IV) to surface this empirically without breaking production. The current `connect-src`/`img-src`/`frame-src` already cover the confirmed banner/beacon hosts (`*.hubspot.com` covers `track.hubspot.com`'s `__ptq.gif`; `*.hs-banner.com` in connect; script via `'strict-dynamic'`), so `style-src` is the live unknown.

**Confirmed hosts the tracking+banner contacts** (source: knowledge.hubspot.com troubleshooting KB): scripts `js.hs-scripts.com`, `js.hs-analytics.net`, `js.hs-banner.com`; beacon `track.hubspot.com` (`__ptq.gif`); `api.usemessages.com` only if chatflows are enabled. All already allowed by the current policy (script via strict-dynamic; the rest via existing `*.hubspot.com`/`*.hs-banner.com`/`*.usemessages.com` entries).

**Promote-to-enforce gate** (from INTEGRATIONS.md §8, restated as the executable checklist): report-only in staging ≥7 days of prod-like traffic → no new violation directives in the trailing 3 days → `docs/CSP_VIOLATIONS_KNOWN.md` current → one engineer sign-off in the cutover ticket → dated cutover with owner → flip `CSP_MODE=enforce` in production Parameter Store. A per-directive CloudWatch metric filter alarms at >100 violations/hour.

---

## R7 — Privacy policy as a static route

**Decision**: `/privacy-policy` is a static React route under `src/app/(frontend)/privacy-policy/page.tsx` with a metadata export and a sitemap entry — not a Payload `pages` document.

**Rationale**: legal copy is low-churn, code-reviewable, and should be versioned in git alongside the cookie/third-party disclosures it must stay consistent with (like the error pages). The 301 map already reserves `/privacy-policy`. Engineering ships the route, structure, canonical Cheyenne address, cookie-category + third-party disclosures, and the link to the footer consent control; the finalized legal prose + sign-off is the Phase 5.5 "Legal / privacy" gate. The page must pass axe + Lighthouse a11y ≥0.95 from day one (Principle II).

**Alternatives considered**: a Payload-managed page (rejected — invites unreviewed legal-copy edits and decouples the disclosures from the code they describe).

---

## Open items explicitly deferred to external owners (soft blocks — mirror spec 005's GUID seam)

- **GTM Container ID** (`TBD`, INTEGRATIONS.md §2) + the container build (defaults, `hubspotConsentUpdate` trigger, per-tag consent) and export to `infra/gtm/container.json`. Live SC-001/002/003 verification is gated on this.
- **HubSpot portal Privacy & Consent settings** — banner policy (Opt-In vs Notify), categories, brand/copy, geo (admin-owned).
- **Wix pixel IDs** (8 Meta, LinkedIn, Google Ads `AW-810041431`) to migrate into the container.
