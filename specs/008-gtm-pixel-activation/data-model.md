# Phase 1 Data Model: GTM Pixel Activation

This feature has no database schema. The "data" is (a) the dataLayer event payloads pushed from the app and (b) the GTM container entities captured in `infra/gtm/container.json`. Both are contracts, detailed below and in `contracts/`.

---

## A. dataLayer events (app → GTM)

All events are objects pushed onto `window.dataLayer`. SSR-safe: a push is a no-op when `window` is undefined. The typed union lives in `src/lib/analytics/dataLayer.ts`, extending the existing `form_submission_*` union from `src/lib/hubspot/submit.ts`.

### Existing (spec 005 — shipped, unchanged)

| Event                     | Payload                         | Emitted when                          |
| ------------------------- | ------------------------------- | ------------------------------------- |
| `form_submission_attempt` | `{ event, formId }`             | submit fires, before the network call |
| `form_submission_success` | `{ event, formId }`             | 200 from HubSpot                      |
| `form_submission_failure` | `{ event, formId, errorClass }` | terminal failure (after retry)        |

### New (this feature)

| Event              | Payload                                                                                 | Emitted when                                      | Status                                                                        |
| ------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `cta_click`        | `{ event: 'cta_click', ctaId: string, label: string, location: string, href?: string }` | a primary CTA is clicked                          | **Live**                                                                      |
| `case_study_view`  | `{ event: 'case_study_view', slug: string, title: string }`                             | a case-study detail page mounts (fire-once)       | **Live**                                                                      |
| `booking_complete` | `{ event: 'booking_complete', meetingUrl: string }`                                     | HubSpot Meetings reports `onMeetingBookSucceeded` | **Seam only — emission gated** on the real Meetings embed (placeholder today) |

**Field rules**

- `event` — the literal discriminant; required on every push (GTM trigger key).
- `ctaId` — a stable identifier for the CTA (not the visible label, which may be localized/edited). `label` is the human text for readability in GTM Preview. `location` is a coarse placement (e.g. `header`, `case-study-footer`, `homepage-hero`).
- `slug` / `title` — the case study's identity, sourced from the page's already-loaded document (no extra fetch).
- No PII in any payload. No email, name, or free text — these are interaction signals only (consistent with INTEGRATIONS.md §1.2 "no sensitive data" posture).

**Invariants**

- Every emitter routes through `pushDataLayer()` in `src/lib/analytics/dataLayer.ts` (single SSR guard, single global declaration). No raw `window.dataLayer.push` at call sites.
- `case_study_view` fires **exactly once** per page view (mount effect, not re-fired on client re-render).
- Adding an event is additive: it must not alter the existing `form_submission_*` shapes (GTM triggers already depend on them).

---

## B. GTM container entities (`infra/gtm/container.json`)

Configured in the GTM web UI (container `GTM-54KBJ2Z3`), exported and committed. Governed by `specs/006-.../contracts/gtm-consent-governance.md` G1–G5; this feature's delta is in `contracts/gtm-activation.md`.

### Tag

| Attribute                   | Notes                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Tag type                    | Vendor template (LinkedIn Insight, Google Ads Conversion) or Custom HTML/Image (Meta)                               |
| Pixel/Tag ID                | Public ID from INTEGRATIONS.md §2.3 (LinkedIn partner `3952964`; Google Ads `AW-810041431`; the 8 Meta dataset IDs) |
| Required additional consent | `ad_storage` on every paid tag (G3 invariant)                                                                       |
| Trigger                     | see below                                                                                                           |
| Status (this feature)       | **Live**: LinkedIn, Google Ads (site-wide). **Staged, no live trigger**: 8 Meta Pixels (deferred)                   |

### Trigger

| Trigger                     | Type                                           | Binds to                | Status                                                                         |
| --------------------------- | ---------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| Consent update              | Custom Event `hubspotConsentUpdate` (G2)       | site-wide paid tags     | Live                                                                           |
| All Pages (consent-gated)   | Page View + built-in `ad_storage` requirement  | LinkedIn, Google Ads    | Live                                                                           |
| Per-market workshop landing | Page Path = `/…casestudyworkshop` (8 variants) | the matching Meta Pixel | **Deferred** — target routes don't exist; recorded as TODO, not wired (FR-011) |

### Variable / consent default

- Consent defaults mirror `ConsentDefault.tsx` (G1): `analytics_storage`/`ad_storage`/`ad_user_data`/`ad_personalization` = denied, `functionality_storage` = granted, "Wait for update" on. Container-side default is the belt-and-suspenders fallback; the inline `gtag('consent','default')` is authoritative for first paint.

### CAPI dataset (not a container entity — recorded for completeness)

| Attribute           | Notes                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Datasets            | 6 of 8 Meta datasets receive server-side via the Conversions API (INTEGRATIONS.md §2.3)    |
| Banner-gated?       | **No** — bypasses the cookie banner; not governed by this container                        |
| Consent enforcement | At the CAPI source, off-site (US4 decision; research R2). Documented, not implemented here |
