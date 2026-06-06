# Contract: dataLayer conversion events (app → GTM)

The signal surface the GTM container's triggers consume. Extends the `form_submission_*` events from spec 005 (`src/lib/hubspot/submit.ts`). Sources: INTEGRATIONS.md §2.4, spec.md FR-008, research R3.

All events are pushed via a single SSR-safe emitter `pushDataLayer()` in `src/lib/analytics/dataLayer.ts`. No call site touches `window.dataLayer` directly.

## D1 — `cta_click` (Live)

```ts
{ event: 'cta_click', ctaId: string, label: string, location: string, href?: string }
```

- Fired from a CTA's client `onClick`, before navigation. Non-blocking (a push must never delay or swallow the navigation).
- `ctaId` is stable (not the editable label). `location` is coarse placement.
- **Test (US3)**: clicking a CTA pushes exactly one `cta_click` with `event` + `ctaId` present (E2E, `window.dataLayer` assertion).

## D2 — `case_study_view` (Live)

```ts
{ event: 'case_study_view', slug: string, title: string }
```

- Fired once on mount of the case-study detail page via a `'use client'` island (`<TrackView/>`); not re-fired on client re-render.
- **Test (US3)**: navigating to a case study pushes exactly one `case_study_view` with the correct `slug` (E2E).

## D3 — `booking_complete` (Seam only — emission gated)

```ts
{ event: 'booking_complete', meetingUrl: string }
```

- Source: HubSpot Meetings `onMeetingBookSucceeded` cross-window `message`. The listener seam is defined in `HubspotMeetings.tsx`, but the component is a placeholder that does not yet load the real embed — so this **cannot fire until the Meetings embed is implemented** (out of scope here; documented dependency, mirrors the Meta deferral).
- **Test**: deferred with emission. The contract and listener shape are reviewable now.

## Invariants

- INV-1: every new event flows through `pushDataLayer()` (one SSR guard, one `Window.dataLayer` declaration). A raw `window.dataLayer.push` at a call site is a defect.
- INV-2: no PII in any payload (interaction signals only — INTEGRATIONS.md §1.2).
- INV-3: additive only — the existing `form_submission_*` shapes are unchanged (existing GTM triggers depend on them).
- INV-4: emitters are inert under SSR and when `NEXT_PUBLIC_GTM_ID` is unset (no GTM consuming, but the push is harmless and the test posture relies on it being safe).
