# Implementation Plan: Consent & Privacy Compliance

**Branch**: `006-consent-privacy-compliance` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-consent-privacy-compliance/spec.md`

## Summary

Close the **consent half** of spec 005's "Conversion + Consent": make a visitor's cookie choice actually govern tracking end-to-end, promote the CSP from report-only to enforcing through the documented soak gate, and ship the two remaining visitor-facing privacy surfaces (a `/privacy-policy` route and a footer consent-preferences control).

Phase 0 research changed the technical approach in one load-bearing way: **HubSpot's official consent API is `_hsp.push(['addPrivacyConsentListener', cb])`**, reading `consent.categories.{analytics,advertisement,functionality}` (with a `consent.allowed` fallback) — **not** the `__hs_opt_in_consent` DOM `CustomEvent` that `ConsentDefault.tsx` and INTEGRATIONS.md §2.2 currently use. That event name appears nowhere in official HubSpot docs, so the scaffolded bridge most likely never fires. Correcting the bridge to the official listener API is therefore the spine of US1, and it carries a doc reconciliation (INTEGRATIONS.md §2.2) per Constitution Principle III. The footer control is the same `_hsp` queue (`showBanner` to re-open, `revokeCookieConsent` to clear). The CSP enforce flip stays **gated** by the INTEGRATIONS.md §8 soak checklist per Constitution Principle IV — the code default in `lib/csp.ts` remains `report-only`; production enforces via the `CSP_MODE` env flip at the recorded cutover, and the soak's #1 job is to catch the strong risk that `style-src 'self'` breaks the HubSpot banner's injected styling.

## Technical Context

**Language/Version**: TypeScript 5.x (strict, no `any`), React 19, Next.js 16 (App Router; `proxy.ts` runtime). Node.js runtime for the proxy.

**Primary Dependencies**: Next.js `<Script>` + per-request-nonce CSP in `src/proxy.ts`; the HubSpot tracking + banner script (`js.hs-scripts.com` → `js.hs-banner.com`) and its `_hsp` consent command queue; Google Tag Manager with Google Consent Mode v2 (`gtag('consent', …)`); Tailwind v3. No new runtime npm dependency is introduced (the consent surface uses HubSpot's own injected `_hsp` API + the native `gtag` shim already in `ConsentDefault.tsx`), so the Principle IV dependency-trust review is N/A for this spec.

**Storage**: N/A for consent — state lives in HubSpot first-party cookies (`__hs_opt_out`, `__hs_cookie_cat_pref`, …) read client-side. Postgres/Payload are untouched; `/privacy-policy` is a **static React route** (code-managed legal copy, versioned like the error pages), not a Payload `pages` document.

**Testing**: Vitest integration (CSP header shape per mode, report-endpoint contract), Playwright E2E (the three consent flows with network no-leak assertions, footer re-open/withdraw, privacy-policy render + footer linkage), axe-core (privacy page + footer control), Lighthouse (a11y / best-practices / SEO ≥ 0.95 — enforcing CSP _improves_ best-practices).

**Target Platform**: SSR/ISR Next.js on EC2 + ALB + CloudFront; modern browsers (Chrome/Safari/Firefox; iOS/Android) — cross-browser consent + CSP behavior is in-scope for US2's QA.

**Project Type**: Web application (single Next.js monolith with embedded Payload CMS).

**Performance Goals**: No regression. The consent-default + bridge stays a single inline `<head>` script (~300 bytes, nonce-carried, non-render-blocking); the CSP nonce path already runs per-request in the proxy. LCP/TBT unaffected.

**Constraints**:

- **Constitution IV (hard):** the proxy stays `report-only` by default; production flips to enforcing only after the INTEGRATIONS.md §8 promote-to-enforce checklist passes, with sign-off recorded in the cutover ticket. This plan delivers the _machinery + the executed gate_, not a premature default flip.
- **Fail-closed consent:** if the banner/script never loads or JS is off, state stays "all denied except functionality."
- `npm audit --omit=dev --audit-level=high` stays clean (Principle IV CI gate) — trivially satisfied (no new deps).
- No version bumps (Principle V).

**Scale/Scope**: 5 user stories. Code surface: modify `ConsentDefault.tsx` (official listener bridge), add a `ConsentPreferences` client control wired into `SiteFooter.tsx`, add the `/privacy-policy` route (+ metadata + sitemap entry), add `docs/CSP_VIOLATIONS_KNOWN.md`, commit the exported `infra/gtm/container.json`, and the E2E/int suite. External config (not in repo): the GTM container (consent defaults + `hubspotConsentUpdate` trigger + consent requirement on all 10 paid tags) and the HubSpot portal Privacy & Consent settings. ~10 paid tags governed.

**Framework-internal / third-party source read at plan time (Constitution Principle I):**

- `src/lib/csp.ts` — directive builder, `CspMode` (`enforce`|`report-only`|`off`), `style-src` path-scoping (`'self'` public / `'unsafe-inline'` for `/admin`), `report-uri`+`report-to`, `upgrade-insecure-requests` only when enforcing.
- `src/proxy.ts` — per-request nonce generation, `NONCE_HEADER` propagation to RSC, `Report-To` header, maintenance short-circuit, matcher excluding `/api/csp-report`.
- `src/components/integrations/ConsentDefault.tsx` — the inline consent default + the (to-be-corrected) `__hs_opt_in_consent` listener; React 19 nonce-strip + `suppressHydrationWarning` handling.
- `src/components/integrations/{HubSpotTracking,GtmScript}.tsx` — env-gated loaders; `afterInteractive` ordering; `noscript` GTM iframe.
- `src/app/(frontend)/layout.tsx` — load order (`ConsentDefault` in `<head>`, `GtmScript`/`HubSpotTracking` after `SiteFooter`).
- `src/components/layout/SiteFooter.tsx` — RSC footer with `legalNav` (insertion point for the consent control + privacy link).
- `src/lib/metadata.ts`, `src/app/(frontend)/sitemap.ts` — metadata + sitemap patterns for the new route.
- **HubSpot official docs** (fetched, cited in `research.md`): cookie-banner-api (`_hsp` commands + `addPrivacyConsentListener` payload), google-consent-mode (the official GTM bridge snippet), the "what cookies does HubSpot set" KB.

## Constitution Check

_GATE: evaluated against `.specify/memory/constitution.md` v1.1.0. Re-checked after Phase 1 design (below)._

| Principle                    | Verdict           | Notes                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Spec Before Code**      | ✅ Pass           | Spec cites INTEGRATIONS.md §§1.5/2/4/8 by number. **Doc gap found:** INTEGRATIONS.md §2.2 documents the unofficial `__hs_opt_in_consent` event — reconciled to the official `addPrivacyConsentListener` API in the same implementation commit. Framework-internal source files enumerated in Technical Context.            |
| **II. Tests Gate Merge**     | ✅ Pass           | Each US ships ≥1 test on the load-bearing path (see Phase 1 / quickstart). Lighthouse a11y/best-practices/SEO gate from day one; the enforce flip is verified not to regress best-practices. No coverage padding.                                                                                                          |
| **III. Docs Are Code**       | ✅ Pass           | Reconciles INTEGRATIONS.md §2.2 (bridge API) + §8 (records the cutover), ARCHITECTURE.md §6 (CSP parity), ROADMAP (moves the consent + CSP-enforce items to PROJECT_HISTORY on ship), and creates `docs/CSP_VIOLATIONS_KNOWN.md`. Candidate ADR: the consent regime (opt-in/geo) decision + the bridge-API correction.     |
| **IV. Security Baseline**    | ✅ Pass (central) | CSP default stays `report-only`; enforce is the §8-checklist-gated env flip with recorded sign-off — **not** flipped in code here. Nonce + `'strict-dynamic'` preserved; third-party loaders stay env-gated + nonce-carrying. No new runtime dep on the security path → dep-trust review N/A; `npm audit` gate unaffected. |
| **V. Bleeding-Edge, Pinned** | ✅ Pass           | No version changes. No new deprecations introduced.                                                                                                                                                                                                                                                                        |

**Result: no violations.** Complexity Tracking is intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/006-consent-privacy-compliance/
├── plan.md              # This file
├── research.md          # Phase 0 — HubSpot consent API, CSP-enforce risk, regime decision
├── data-model.md        # Phase 1 — consent categories, cookie inventory, tag↔consent map, CSP model
├── quickstart.md        # Phase 1 — how to run/verify the 3 flows + the CSP soak locally/staging
├── contracts/
│   ├── consent-bridge.md        # HubSpot _hsp listener → gtag consent update + footer control + dataLayer
│   ├── gtm-consent-governance.md# GTM container: defaults, hubspotConsentUpdate trigger, per-tag consent
│   └── csp.md                   # CSP directives, report payload, mode posture, promote-to-enforce gate
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── proxy.ts                                   # (unchanged logic) CSP_MODE drives report-only→enforce at cutover
├── lib/
│   └── csp.ts                                 # MODIFY only if soak proves the banner needs style-src 'unsafe-inline'
├── components/
│   ├── integrations/
│   │   └── ConsentDefault.tsx                 # MODIFY: official addPrivacyConsentListener bridge (replaces __hs_opt_in_consent)
│   └── layout/
│       ├── SiteFooter.tsx                     # MODIFY: add privacy-policy link + mount ConsentPreferences in legalNav
│       └── ConsentPreferences.tsx             # NEW 'use client': _hsp showBanner / revokeCookieConsent control
└── app/(frontend)/
    ├── privacy-policy/page.tsx                # NEW static route (metadata + canonical address + disclosures)
    └── sitemap.ts                             # MODIFY: include /privacy-policy

docs/
└── CSP_VIOLATIONS_KNOWN.md                    # NEW: known/expected CSP violations catalogue (FR-011)

infra/
└── gtm/container.json                         # NEW: exported GTM container (consent defaults + trigger + per-tag consent)

tests/
├── e2e/
│   ├── consent-flows.e2e.spec.ts              # NEW: accept/deny/customize + network no-leak (US1/US3)
│   └── privacy-consent-ui.e2e.spec.ts         # NEW: footer re-open/withdraw + /privacy-policy render + a11y (US4/US5)
└── int/
    └── lib/csp.int.spec.ts                    # NEW/EXTEND: header name + directive shape per CSP_MODE
```

**Structure Decision**: Single Next.js web app (the established layout). This feature is a focused overlay on the existing consent/CSP mechanism (spec 004/005) plus one new static route — no new top-level structure. `infra/gtm/` is the first `infra/` use (constitution-sanctioned location for version-controlled infra config); the GTM container is exported from the GTM web UI and committed for a reviewable diff (FR-008).

## Phase 0 — Research

See [research.md](./research.md). All Technical-Context unknowns resolved; the one open empirical question (does the live HubSpot banner need `style-src 'unsafe-inline'`?) is explicitly assigned to the report-only soak rather than guessed — the soak is the designed mechanism for exactly this.

## Phase 1 — Design & Contracts

Artifacts: [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md). Agent context (`CLAUDE.md` SPECKIT block) repointed to this plan.

**Post-design Constitution re-check: ✅ still passing.** The design adds no new runtime dependency, keeps the CSP default report-only (enforce is the gated env flip), preserves nonce/strict-dynamic/env-gating, and pairs every code change with its doc reconciliation. Complexity Tracking remains empty.

## Complexity Tracking

_No constitution violations — section intentionally empty._
