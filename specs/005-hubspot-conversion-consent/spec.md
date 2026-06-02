# Feature Specification: HubSpot Conversion + Consent

**Feature Branch**: `005-hubspot-conversion-consent`

**Created**: 2026-06-02

**Status**: **v1 landed; Workshop form provisioned + wired (env-gated), Contact pending GUID.** Shared submission engine, both lead forms, `/contact` route, and env wiring built. Workshop Inquiry GUID confirmed 2026-06-02 (`66dba2bf-…`), field internal names matched, CSP opened for `api.hsforms.com`, and the workshop route points at `WorkshopInquiryForm` — it goes live the moment the env vars are set. Contact stays half-wired until its GUID lands.

**Input**: Phase 5 "Deferred from spec 004" — the live HubSpot Forms API integration (research §D10) — carved out of the Phase 4/5 lump into its own engineering spec. Kenn 2026-06-02: "Just build v1s of everything and leave the forms themselves half wired and we'll pick it up."

## Background

Spec 004 shipped only the placeholder `hubspot-form` block (a static card). This spec builds the real custom-form integration per `docs/INTEGRATIONS.md` §1.2 + research §D10: custom React forms styled native to the site, submitting directly to the HubSpot Forms API, with the documented submission state machine, failure handling, GTM dataLayer events, and consent linkage.

## Scope

**Two API-submitted forms** (not three — Newsletter dropped 2026-06-02; see below):

| Form             | Surface                                 | Component                                                                          |
| ---------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| Workshop Inquiry | `/touchstone-workshops` (route-mounted) | `WorkshopInquiryForm` — provisioned GUID `66dba2bf-…`, fields confirmed 2026-06-02 |
| Contact          | `/contact` (new route)                  | `ContactForm` → `HubspotLeadForm`                                                  |

The two forms share one engine — `src/lib/hubspot/submit.ts` — so the marginal cost of a second/third form is field config, not machinery.

### Newsletter dropped (2026-06-02)

The Wix audit (`SITE-AUDIT.md`) shows the old site had **no** newsletter signup — only a Contact form. The Newsletter row was a planning-time assumption in INTEGRATIONS.md, not migration. A signup is only worth building with an actual newsletter program (a content commitment SEQTEK doesn't have). Removed from scope, the §1.2 forms table, and env. The `newsletter-cta` block stays dormant in the library.

## What shipped (v1)

- `src/lib/hubspot/submit.ts` — submission engine: `idle → submitting → (success | error)`, error classes (`4xx` no-retry / `5xx`/`network`/`timeout` single retry + 1s backoff / 15s timeout), `form_submission_{attempt,success,failure}` dataLayer events, `hutk` + page context, `legalConsentOptions` passthrough.
- `src/lib/hubspot/fields.ts` — field config types + native validation (Zod not installed; swap in on pickup if richer schemas needed).
- `src/components/forms/HubspotLeadForm.tsx` — shared `'use client'` renderer + state machine; inline field errors, values preserved on error, mailto fallback, half-wired "preview mode" notice.
- `src/components/forms/{ContactForm,WorkshopInquiryForm}.tsx` — field configs per form.
- `src/components/sections/HubspotForm.tsx` — placeholder card → live (half-wired) form.
- `src/app/(frontend)/contact/page.tsx` — new `/contact` route.
- `.env.example` + `tests/int/lib/hubspot-submit.int.spec.ts`.
- Honeypot spam protection in `HubspotLeadForm` (CAPTCHA is off on the API forms — §1.2; naive bots silently dropped).
- 404 CTA repointed to `/contact` (#23 merged, so the route + CTA are both live).
- Playwright E2E `tests/e2e/hubspot-forms.e2e.spec.ts` — contact-form lifecycle (render, validation, submit → success, `dataLayer` events, honeypot hidden, axe-clean).

## Half-wired (the deferred seam)

Live POST to `api.hsforms.com` fires only when `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` **and** a valid form GUID are set. Until then `submitHubspotForm` short-circuits to a stub success — the full client lifecycle (validation, submitting, success view, dataLayer events) runs without hitting HubSpot. **Go live = drop the GUID into the env var.** No code change.

## Dependency (soft block)

All form GUIDs are `TBD` (INTEGRATIONS.md §1.2). The portal admin must create each form, disable CAPTCHA, and return 5 values. Workshop is in flight with the admin; Contact request drafted 2026-06-02. Acceptance for v1 is the integration being correct against a configured GUID; live-submit E2E verification is gated on the real GUIDs (same template-vs-content boundary spec 004 used).

## Pickup items

**Workshop Inquiry — provisioned 2026-06-02 (done this round):**

- ✅ Field internal names matched: `firstname`/`lastname`/`email`/`phone` (required)/`company`/`marketing_info` (free-text); no `message` property on the form.
- ✅ `api.hsforms.com` added to CSP `connect-src`.
- ✅ Route points at `WorkshopInquiryForm` (block-vs-dedicated reconciled).
- ✅ No consent on this form → `legalConsentOptions` omitted. Region `na1` → bare `api.hsforms.com` endpoint is correct (EU would differ).
- ⏳ **Set env to go live:** `NEXT_PUBLIC_HUBSPOT_PORTAL_ID=8504846` + `NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID=66dba2bf-f099-44d5-8c6e-f24292cefe53` in `.env.local` (local) + Parameter Store (staging/prod). Setting the portal ID also activates the HubSpot tracking script site-wide.
- ⏳ E2E: live submit round-trip + `dataLayer` assertions (Playwright).

**Contact — pending:**

- ⏳ Provisioning request sent; awaiting GUID, field internal names, inquiry-type option values, consent decision.
- ⏳ On receipt: set `NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID`, confirm field names (placeholders today → `PROPERTY_DOESNT_EXIST` if wrong), wire `legalConsentOptions` if consent applies.

## Out of scope (separate specs)

- Cookie-consent → GTM consent bridge E2E + CSP enforce flip (the consent half of "conversion + consent" — `ConsentDefault`/`HubSpotTracking` already scaffolded; bridge is largely GTM-container config). Tracked for a follow-up.
- HubSpot Meetings embed (§1.4), chat widget (§1.3).
