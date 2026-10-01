# Contract: dataLayer events (app → GTM)

The events GTM triggers consume. Every event goes through `pushDataLayer()` in
`src/lib/analytics/dataLayer.ts`.

## F — Form submissions

Pushed by `src/lib/hubspot/submit.ts` around every HubSpot submission (INTEGRATIONS §1.2):

```ts
{ event: 'form_submission_attempt', formId: string }   // on submit, before the request
{ event: 'form_submission_success', formId: string }   // on success
{ event: 'form_submission_failure', formId: string, errorClass: '4xx' | '5xx' | 'network' | 'timeout' }
```

The failure event fires once, after any retry.

## D1 — `cta_click`

```ts
{ event: 'cta_click', ctaId: string, label: string, location: string, href?: string }
```

`TrackedCtaLink` fires it from the CTA's `onClick`, before navigation, without delaying it. `ctaId`
is a stable identifier, not the editable label. `location` is a coarse placement such as
`header`, `mobile-nav`, `cta-buttons`, `cta-meeting` or `inline`.

## D2 — `case_study_view`

```ts
{ event: 'case_study_view', slug: string, title: string }
```

The `<TrackView/>` island fires it once when a case-study page mounts, and not again on re-render.

## D3 — `booking_complete` (not yet emitted)

```ts
{ event: 'booking_complete', meetingUrl: string }
```

It is triggered by HubSpot Meetings' `onMeetingBookSucceeded` message. The listener
(`BookingCompleteSeam`) is mounted in the `cta` block's meeting panel. Booking is a Google Calendar
page, which never sends that message, so the event does not fire (`ROADMAP.md` BOOK-1).

## Invariants

- **INV-1:** every event goes through `pushDataLayer()`. A raw `window.dataLayer.push` at a call site
  is a defect.
- **INV-2:** no personal data in any payload, only interaction signals.
- **INV-3:** the event shapes change only additively; GTM triggers depend on them.
- **INV-4:** pushes are no-ops under SSR, and harmless when `NEXT_PUBLIC_GTM_ID` is unset.

`tests/e2e/datalayer-events.e2e.spec.ts` covers D1 and D2. `tests/int/lib/dataLayer.int.spec.ts`
covers the emitter.
