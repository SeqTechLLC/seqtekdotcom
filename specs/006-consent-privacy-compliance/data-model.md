# Phase 1 Data Model: Consent & Privacy Compliance

This feature holds almost no server-side data — consent state lives in HubSpot first-party cookies, read client-side. The "entities" here are the consent vocabulary, the cookie inventory, the tag→consent governance map, and the CSP configuration model. No Postgres/Payload schema changes.

---

## 1. Consent category

The three buckets HubSpot exposes (R1). Maps to Google Consent Mode v2 signals (R4).

| Category                  | HubSpot key (`consent.categories.*`) | Google signal(s)                                   | Default   | User-toggleable    |
| ------------------------- | ------------------------------------ | -------------------------------------------------- | --------- | ------------------ |
| Necessary / Functionality | `functionality`                      | `functionality_storage`                            | `granted` | No (unconditional) |
| Analytics                 | `analytics`                          | `analytics_storage`                                | `denied`  | Yes                |
| Advertising               | `advertisement`                      | `ad_storage`, `ad_user_data`, `ad_personalization` | `denied`  | Yes                |

- Spelling is load-bearing: HubSpot uses `advertisement` (full word), not `ads`/`advertising`.
- `consent.allowed` (boolean) is the legacy/fallback signal: true when the banner is disabled, notify-only, or the visitor accepted. Treat a category as granted if `consent.allowed || consent.categories.<cat>`.

## 2. Consent state (client, ephemeral + cookie-persisted)

A per-visitor snapshot, never stored server-side.

- **Shape**: `{ analytics: boolean, advertisement: boolean, functionality: true }`.
- **Default (pre-decision / fail-closed)**: `{ analytics: false, advertisement: false, functionality: true }` — stamped by `gtag('consent','default', …)` in `ConsentDefault.tsx` before any tag evaluates.
- **Transitions**:
  - `default(all denied)` → on `addPrivacyConsentListener` callback → `gtag('consent','update', mapped)` + `gtag('event','hubspotConsentUpdate')`.
  - `showBanner` (footer control) re-opens the banner; a new choice fires the same listener → new `update`.
  - `revokeCookieConsent` clears HubSpot consent cookies; next load returns to default.
- **Persistence**: HubSpot cookies (§3); rehydrated by the listener firing on init for returning visitors (R3).
- **Invariant (US1/FR-001)**: no `ad_storage`/`analytics_storage` tag fires while the corresponding signal is `denied`. Verified by the Deny-all network no-leak check (SC-001).

## 3. HubSpot consent cookie inventory (read-only, set by HubSpot)

| Cookie                 | Holds               | Role                                          | Expiry |
| ---------------------- | ------------------- | --------------------------------------------- | ------ |
| `__hs_opt_out`         | `yes`/`no`          | re-show gate ("remember not to ask again")    | 6 mo   |
| `__hs_cookie_cat_pref` | per-category choice | records consented categories                  | 6 mo   |
| `__hs_initial_opt_in`  | `yes`/`no`          | suppress always-on banner in strict mode      | 7 d    |
| `__hs_do_not_track`    | `yes`               | block sending to HubSpot                      | 6 mo   |
| `hubspotutk`           | opaque GUID         | visitor token (also the spec-005 form `hutk`) | 6 mo   |

No `__hs_opt_in` cookie exists (corrected from prior assumption). The app never writes these — it only reacts to the listener and, for E2E, clears/sets them to simulate fresh vs returning visitors.

## 4. Governed tag (GTM container config — external)

Each paid tag carries a consent requirement so it holds until its category is granted (FR-007). Sourced from INTEGRATIONS.md §2.3; pixel IDs migrated from Wix.

| Tag                                    | Count    | Required consent    | Notes                   |
| -------------------------------------- | -------- | ------------------- | ----------------------- |
| Meta Pixel (Tulsa/OKC/NW-Ark/KC, A+B)  | 8        | `ad_storage`        | A/B variants per market |
| LinkedIn Insight Tag                   | 1        | `ad_storage`        |                         |
| Google Ads conversion (`AW-810041431`) | 1        | `ad_storage`        |                         |
| HubSpot analytics                      | (native) | `analytics_storage` | gated by the bridge     |

- **Trigger**: a GTM Custom Event trigger named `hubspotConsentUpdate` (must match the `gtag('event', …)` string).
- **"Wait for update"**: enabled, honoring the `wait_for_update: 500` window so returning-visitor rehydration completes before a tag evaluates.
- **Versioning (FR-008)**: the container is exported to `infra/gtm/container.json` on every meaningful change.

## 5. CSP configuration (existing `lib/csp.ts` model)

| Field                   | Values                                                  | Notes                                                 |
| ----------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| `mode`                  | `enforce` \| `report-only` \| `off`                     | from `CSP_MODE` env; default `report-only`            |
| header name             | `Content-Security-Policy` (enforce) \| `…-Report-Only`  | per `cspHeaderName(mode)`                             |
| `script-src`            | `'nonce-<n>' 'strict-dynamic' 'self'`                   | trust propagates to HubSpot/GTM sub-scripts           |
| `style-src`             | public: `'self'` · `/admin`: `'self' 'unsafe-inline'`   | **public value is the live soak risk (R6)**           |
| `connect-src`           | `'self'` + HubSpot + GTM/GA hosts                       | covers `track.hubspot.com` beacon via `*.hubspot.com` |
| `img-src` / `frame-src` | HubSpot hosts (+ media host)                            | unchanged                                             |
| reporting               | `report-uri /api/csp-report` + `report-to csp-endpoint` | paired `Report-To` header in proxy                    |

State posture by environment (Constitution IV): dev `enforce` · staging `report-only` (the soak) · production `report-only` **until** the §8 gate passes, then `enforce` via env flip.

## 6. Known CSP violation entry (`docs/CSP_VIOLATIONS_KNOWN.md`)

A catalogue row used to triage report noise vs regressions (FR-011).

- **Fields**: `directive` (e.g. `style-src`), `blocked-uri` / pattern, `source` (which third-party / browser-extension noise), `status` (`expected` | `accepted-with-note` | `action-required`), `first-seen`, `note`.
- **Use**: on-call diffs incoming reports against this list; an entry not present + over the 100/hr alarm threshold = regression.

## 7. Privacy policy content (static route)

Not a DB entity — the content model the `/privacy-policy` page must cover (FR-013/014):

- What data is collected (form fields per spec 005; analytics/ad cookies) — and what is **not** (no payment/sensitive data, INTEGRATIONS.md §1.2).
- Cookie categories (§1) and the third parties involved (HubSpot, Google/GTM, Meta, LinkedIn).
- How to change/withdraw consent → links the footer consent control (`ConsentPreferences`).
- Canonical company contact: **12 N Cheyenne Ave, Tulsa, OK 74103** (no Sapulpa references).
