# Phase 0 Research: GTM Pixel Activation

Resolves the genuinely-new unknowns this feature introduces. The consent-bridge mechanics, Consent Mode v2 signal mapping, and the GTM governance model are **already resolved in spec 006** (`research.md` R1–R4, `contracts/gtm-consent-governance.md`) and are cited, not re-derived.

---

## R1 — Do LinkedIn Insight Tag and Google Ads need the custom `hubspotConsentUpdate` trigger, or do their built-in Consent Mode checks suffice?

**Decision**: Configure both with **GTM's built-in per-tag "Require additional consent for tag to fire" = `ad_storage`** (governance G3), AND fire them on a trigger that also listens for the `hubspotConsentUpdate` Custom Event (G2). Belt-and-suspenders.

**Rationale**: The Google Ads Conversion tag and LinkedIn Insight Tag templates honor Consent Mode v2 natively — when `ad_storage` is `denied` they enter a no-cookie/ping-only or fully-held state. But our consent signal arrives **asynchronously** via the HubSpot `_hsp` listener (first-time banner click, or returning-visitor cookie rehydration), after GTM has already loaded `afterInteractive`. The `wait_for_update: 500` window (already set in `ConsentDefault.tsx`) covers the rehydration race, but pairing the page-view/consent trigger with the `hubspotConsentUpdate` event guarantees the tag re-evaluates the moment consent flips to granted rather than only on the initial page-load tick. This is exactly the pattern G2 was authored for.

**Alternatives considered**: (a) Rely solely on built-in Consent Mode with no custom trigger — rejected: a tag whose only trigger is "All Pages" can evaluate before the async consent update lands, and under deny it would still emit Consent-Mode "cookieless pings" to the ad host, which fails the SC-001 "no ad host in the Network tab on Deny" check. Requiring `ad_storage` as additional consent suppresses the tag entirely (no ping) until granted. (b) Custom trigger only, no built-in check — rejected: loses the platform's native redaction behavior as a second layer.

---

## R2 — Server-side CAPI consent posture: keep it running post-launch, and where is consent enforced?

**Decision (recommended, to be confirmed by marketing/Megan/Domanick and recorded in INTEGRATIONS.md §2.3)**: The six CAPI-fed Meta datasets are **out of this site's enforcement path**. This site governs only the browser pixels (via GTM Consent Mode). For the CAPI events, consent must be enforced **at the CAPI source** — the server/integration that posts to Meta's Conversions API (a Wix-era or HubSpot-Meta integration today) — by passing Meta's `data_processing_options` / limited-data-use signals or by suppressing sends for non-consented users there. This feature **documents the decision and assigns the owner**; it does not implement CAPI enforcement (that code is not in this repo).

**Rationale**: CAPI is server-to-server and bypasses the cookie banner entirely (INTEGRATIONS.md §2.3 heads-up). Nothing in the Next.js site can gate an event that the site never originates. Pretending otherwise would be a silent consent gap. The honest, auditable move is to name the gap, decide whether CAPI continues, and point at where enforcement actually lives.

**Open question for the decision record**: whether the new site even feeds CAPI post-launch. If the CAPI sends were a Wix-platform integration, the cutover may _stop_ them, leaving only the browser pixels (which we do gate). That outcome should be confirmed, not assumed — it materially changes whether any CAPI enforcement work is owed at all.

**Alternatives considered**: (a) Build a server-side CAPI relay in this app with consent gating — rejected: out of scope, and duplicates infrastructure that already exists upstream. (b) Ignore CAPI — rejected: it's the single biggest consent-compliance gap in the integration and must be on the record (US4 / FR-009).

---

## R3 — dataLayer event emission: where and with what payload for `cta_click`, `case_study_view`, `booking_complete`?

**Decision**: Add a shared `src/lib/analytics/dataLayer.ts` that generalizes the proven `submit.ts` `pushDataLayer` pattern (SSR-safe `typeof window` guard, typed event union, single `window.dataLayer` global declaration). Emit:

- **`cta_click`** — from the CTA surfaces (`Button.tsx` when used as a CTA, `CtaSection.tsx`, `ContactCta.tsx`, `InlineCta.tsx`). Payload identifies the CTA: `{ event, ctaId/label, location/href }`. Client `onClick` handler.
- **`case_study_view`** — from `case-studies/[slug]/page.tsx` via a tiny client island (the page is a Server Component; a `'use client'` `<TrackView slug=…/>` fires once on mount). Payload: `{ event, slug, title }`.
- **`booking_complete`** — contract + seam defined in `HubspotMeetings.tsx`, fired from the HubSpot Meetings `onMeetingBookSucceeded` cross-window `message` listener. **Emission gated** on the real Meetings embed (the component is currently a placeholder — see plan Technical Context). Payload: `{ event, meetingUrl }`.

**Rationale**: One emitter keeps event shapes consistent and testable, and matches the existing `form_submission_*` convention rather than inventing a parallel one. Fire-once view tracking via a mount-effect island is the standard App-Router pattern for a Server Component page. The booking signal genuinely has no source until the embed is real, so we ship the contract and the listener seam and let it light up when the embed lands — same discipline as the Meta deferral.

**Alternatives considered**: (a) Inline `window.dataLayer.push` at each call site — rejected: duplicates the SSR guard and drifts payload shapes; no single typed contract to test against. (b) A GTM "click" auto-event trigger on CSS selectors instead of explicit `cta_click` — rejected: brittle (couples tracking to markup) and the spec (FR-008) calls for an explicit, documented event.

---

## R4 — Container export format and how to keep `infra/gtm/container.json` from drifting.

**Decision**: Use GTM's native **Admin → Export Container** JSON (the full `containerVersion` export), committed verbatim over `infra/gtm/container.json`. Enforce the export-on-change convention already documented in `infra/gtm/README.md` (export → save over the file → commit on the same change with `feat(gtm):`/`chore(gtm):`). No transform, no secret redaction needed (a GTM export contains tag/trigger config and public pixel IDs, no credentials).

**Rationale**: The native export is GTM's own round-trippable format (re-importable for rollback), so it's the truthful source of record and a working restore target. A hand-maintained summary would drift; the raw export diffs noisily but honestly. The README already specifies this workflow (spec 006 T001) — this feature just executes it for the first real export.

**Drift mitigation**: the convention is process, not code; the only automated backstop is the staging fire-matrix (G4) and a config review of the committed diff (G3 invariant). Note in the README that the committed file is authoritative for review/rollback but the live container is operational truth — a re-export diff at verification time confirms zero drift (SC-004).

**Alternatives considered**: (a) GTM API + a CI job to auto-export — rejected: over-engineered for a container that changes rarely and is edited by humans in the UI; adds a credentialed CI integration (constitution IV surface) for marginal benefit. Revisit if container churn grows.

---

## Carried decisions from spec 006 (cited, not re-derived)

- **Consent signal mapping** (HubSpot category → Consent Mode v2): 006 research R1; implemented in `ConsentDefault.tsx`. Category key `advertisement` (full word) is load-bearing.
- **`_hsp` privacy queue vs `_hsq` analytics queue** distinction: 006 research R2 — do not cross them.
- **Returning-visitor rehydration** takes the same listener path, no banner shown: 006 research R3 (verified in `consent-flows.e2e.spec.ts`).
- **Governance gates G1–G5**: `specs/006-consent-privacy-compliance/contracts/gtm-consent-governance.md`. This feature executes G1/G2/G3 for the live site-wide tags and runs G4; G5 provenance is satisfied by the first `container.json` commit.
