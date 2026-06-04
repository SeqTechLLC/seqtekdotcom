# 0006. HubSpot consent bridge uses the official `addPrivacyConsentListener` API, fail-closed everywhere

**Status:** Accepted
**Date:** 2026-06-03

## Context

Spec 006 closes the consent half of spec 005: a visitor's cookie choice must
actually govern tracking. The scaffolded bridge in `ConsentDefault.tsx` (and
the prose in INTEGRATIONS.md §2.2) drove the HubSpot → GTM consent handoff off
a `window.addEventListener('__hs_opt_in_consent', …)` DOM `CustomEvent`.

Phase 0 research (research.md R1) checked the official HubSpot docs and found
that `__hs_opt_in_consent` appears **nowhere** in them — it is a community/
third-party pattern. HubSpot's documented consent-change mechanism is a callback
registered on its privacy command queue:
`window._hsp.push(['addPrivacyConsentListener', cb])`, where `cb(consent)`
receives `consent.categories.{analytics,advertisement,functionality}` booleans
(with a `consent.allowed` fallback for notify-only / banner-off / accepted). As
scaffolded, the bridge most likely **never fired**, silently pinning consent at
the all-denied default — analytics/ads would never turn on even after "Accept
all." This is the single highest-impact correction in the spec.

A second question is the **consent regime**: strict opt-in (GDPR) vs.
notice-only (auto-grant outside the EU). HubSpot's own Consent Mode example
scopes default-denied to an EU `region` list. SEQTEK is a US (Tulsa/OKC/
NW-Ark/KC) B2B firm, so notice-only-outside-EU is plausible — but that is a
HubSpot **portal** banner-policy setting, not application code.

## Options considered

- **Keep `__hs_opt_in_consent`** — zero code change, but unverified and almost
  certainly non-firing; consent would never propagate. Rejected.
- **Poll the HubSpot consent cookies on a timer** — works without the official
  API but is racy against tag evaluation and reinvents the listener. Rejected.
- **Official `addPrivacyConsentListener` callback** — documented, fires on
  banner choice AND on init for returning visitors (the rehydration path),
  no new runtime dependency (uses HubSpot's own injected `_hsp` queue + the
  existing `gtag` shim). Chosen.
- **Regime: fork code for opt-in vs notice-only** — couples a legal/portal
  decision to a code path. Rejected in favor of code-stays-strictest, portal
  narrows it.

## Decision

Drive the bridge off `window._hsp.push(['addPrivacyConsentListener', cb])`,
reading `consent.allowed || consent.categories.<cat>` and mapping to Google
Consent Mode v2 signals (`analytics → analytics_storage`;
`advertisement → ad_storage + ad_user_data + ad_personalization`; functionality
stays granted), then fire a `gtag('event','hubspotConsentUpdate')` Custom Event
for GTM tags lacking built-in consent checks. Keep the inline `gtag('consent',
'default', …)` (all denied except functionality, `wait_for_update: 500`)
unchanged. The doc reconciliation of INTEGRATIONS.md §2.2 ships in the same
commit (Constitution Principle III).

For the regime: build **fail-closed** (default-denied / opt-in) in code for all
visitors — already the `ConsentDefault.tsx` default and valid under both GDPR
opt-in and US notice-only. The strict-opt-in-vs-notice-only choice and any
EU-`region` scoping are a HubSpot portal + leadership/legal decision deferred
to Phase 5.5; code stays regime-agnostic and strictest-safe.

## Consequences

- **Gain:** consent provably propagates (verified by the bridge E2E + the
  Deny-all network no-leak check, SC-001); the correction is captured so it
  isn't re-litigated; a single consent UI (HubSpot's own banner, re-opened via
  `_hsp showBanner`) rather than a parallel custom banner; no new npm
  dependency, so the Principle IV dep-trust review is N/A.
- **Cost:** the bridge depends on HubSpot's `_hsp` API surface staying stable
  (mitigated by the E2E pinning the contract) and on category-key spelling
  (`advertisement`, full word — load-bearing). The returning-visitor "0
  re-prompts + state restored before first tag" guarantee is inferred from
  HubSpot docs, so it is asserted by E2E rather than assumed (research R3).

## Revisit when

- HubSpot deprecates or changes the `addPrivacyConsentListener` payload shape,
  or ships a first-party GTM consent bridge that covers externally-hosted
  tracking scripts (today's auto-bridge only covers HubSpot's native GA/GTM
  integration — research R4).
- Leadership/legal fixes the consent regime (opt-in vs notice-only + geo), at
  which point the portal banner policy is set and this ADR's "code stays
  strictest" posture should be re-confirmed against it.
