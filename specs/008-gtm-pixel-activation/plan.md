# Implementation Plan: GTM Pixel Activation

**Branch**: `feat/008-gtm-pixel-activation` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-gtm-pixel-activation/spec.md`

## Summary

Execute the GTM container activation that spec 006 designed but left gated on a `TBD` container ID. The container now exists (`GTM-54KBJ2Z3`, created 2026-06-05), the pixel mappings are confirmed (Megan's Events Manager export, 2026-06-05), and the portal banner consent model is decided (notice-only, 2026-06-05). This feature: (1) configures and version-controls the **site-wide** paid tags (LinkedIn Insight Tag, Google Ads `AW-810041431`) through the existing consent bridge and runs the staging fire-matrix verification; (2) adds the missing dataLayer conversion signals; (3) records the server-side CAPI consent decision. The eight per-market Meta Pixels are **staged-but-deferred** — their per-variant landing routes don't exist on the new site, so they have no trigger to bind to (carved to the content/paid-landing-page track).

The technical approach is **almost entirely external config + documentation + a small dataLayer code increment**. The app-side consent foundation (loader, consent default, `_hsp`→Consent-Mode bridge, CSP) shipped in specs 005/006/007 and is reused unchanged. Spec 006 already authored the governance contract (`specs/006-consent-privacy-compliance/contracts/gtm-consent-governance.md`, gates G1–G5) and `infra/gtm/README.md`; this plan composes against them and records the deltas (Meta deferral, the now-live container ID, the CAPI decision) rather than re-deriving.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19, Next.js 16 (App Router). No new language surface.

**Primary Dependencies**: None added. GTM loads via the existing custom `GtmScript.tsx` inline snippet (not `@next/third-parties`); consent flows through the existing `ConsentDefault.tsx` bridge. The "tags" are GTM-web-UI config, not npm deps.

**Storage**: N/A (no DB schema change). The versioned artifact is `infra/gtm/container.json` (a committed JSON export of the live GTM container).

**Testing**: Vitest (integration, `tests/int/`) + Playwright E2E (`tests/e2e/`) + axe + Lighthouse, per constitution II. New dataLayer events get E2E assertions against `window.dataLayer` reusing `tests/e2e/helpers/consent.ts`. The live GTM fire-matrix is **manual staging verification** (GTM Preview/Debug + Network tab) — not CI-testable, mirroring spec 006's gated tail; the consent-bridge gating it depends on is already covered in CI by 006's `consent-flows.e2e.spec.ts`.

**Target Platform**: Public web (server-rendered Next.js on EC2+ALB+CloudFront); verification on staging `seqtek-preview.com`.

**Project Type**: Web application (single Next.js app with embedded Payload). Existing structure; no new top-level areas beyond files under `infra/gtm/` and a small number of `src/` event emitters.

**Performance Goals**: No regression. No new third-party script loads (GTM + HubSpot remain the only two); dataLayer pushes are synchronous in-page `Array.push` calls with negligible cost. Lighthouse a11y/best-practices/SEO ≥ 0.95 must hold.

**Constraints**: Third-party loaders stay env-gated (`NEXT_PUBLIC_GTM_ID`) so unset dev/CI doesn't hit real endpoints (constitution IV); dataLayer emitters must be inert/safe when `window.dataLayer` is absent (SSR) — reuse the `submit.ts` `pushDataLayer` guard pattern. No secrets; pixel/container/partner IDs are non-secret config (already in INTEGRATIONS.md §2).

**Source/context files read** (per constitution I — no deep framework internals here, but the existing patterns this feature extends):

- `src/components/integrations/GtmScript.tsx` — env-gated GTM loader; `afterInteractive`, nonce via `NONCE_HEADER`.
- `src/components/integrations/ConsentDefault.tsx` — the inline consent default + `_hsp` `addPrivacyConsentListener` → `gtag('consent','update')` → `hubspotConsentUpdate` Custom Event bridge.
- `src/lib/hubspot/submit.ts` — the existing `pushDataLayer()` pattern + `Window.dataLayer` global declaration + `form_submission_*` typed events (the shape the 3 new events mirror).
- `src/app/(frontend)/layout.tsx` — integration wiring + env-gated preconnects.
- `src/components/ui/Button.tsx`, `src/components/sections/{CtaSection,ContactCta}.tsx`, `src/components/richText/inline/InlineCta.tsx` — CTA emission surfaces for `cta_click`.
- `src/app/(frontend)/case-studies/[slug]/page.tsx` — `case_study_view` emission surface.
- `src/components/sections/HubspotMeetings.tsx` — **currently a placeholder** (renders a box, does not load the real Meetings embed); the `booking_complete` source.
- `infra/gtm/README.md` + `specs/006-.../contracts/gtm-consent-governance.md` — the governance contract this plan executes.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Spec Before Code** — ✅ Spec authored, `/speckit-clarify` skipped by choice (scope settled via two upfront decisions). Cites INTEGRATIONS.md §2.1/§2.2/§2.3, §8; composes against spec 006's governance contract by reference rather than re-deriving. No framework-internals estimation risk (no deep `node_modules` reading needed; the GTM/dataLayer patterns are already in-repo and enumerated above).
- **II. Tests Gate Merge** — ✅ under the constitution v1.2.0 **external-verification carve-out** (Principle II). US3 (`cta_click`, `case_study_view`) ships write-first E2E `window.dataLayer` assertions. US1 (live container fire-matrix, T009), US2 (container re-export/diff, T012), and US4 (CAPI decision, T023) are **config/decision/documentation deliverables verified on staging / in docs**, with no in-repo code path to test without padding — the substitution is **declared here** per the carve-out's condition (b). Their load-bearing substrate (consent gating) is already CI-green from spec 006's `consent-flows.e2e.spec.ts` (condition (a)). No coverage padding.
- **III. Docs Are Code** — ✅ This feature **fixes docs in the same change**: `infra/gtm/README.md` (Container ID `TBD` → `GTM-54KBJ2Z3`; add the Meta-deferral note + the live LinkedIn/GoogleAds scope), INTEGRATIONS.md §2.3 (record the CAPI decision + the `booking_complete`/Meta deferral seams), and ROADMAP/PROJECT_HISTORY bookkeeping on merge. New dataLayer events documented in `data-model.md` + `contracts/datalayer-events.md`.
- **IV. Security Baseline** — ✅ No new deps (no dep-trust review needed). GTM stays env-gated; dataLayer emitters are inert without `window`. No secrets (IDs are public config). CSP unaffected — no new third-party origin (GTM already allowlisted; the staged Meta tags don't load until their deferred pages exist). The consent default/bridge is untouched.
- **V. Bleeding-Edge Stack** — ✅ No version changes. No new deprecation surface.

**Gate result: PASS.** No violations; Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
specs/008-gtm-pixel-activation/
├── plan.md              # This file
├── research.md          # Phase 0: CAPI posture, dataLayer emission design, tag built-in consent, export pinning
├── data-model.md        # Phase 1: dataLayer event payloads + GTM tag/trigger entities
├── quickstart.md        # Phase 1: staging fire-matrix runbook + export→commit + local event test
├── contracts/
│   ├── datalayer-events.md   # The 3 new events (cta_click, case_study_view, booking_complete)
│   └── gtm-activation.md      # Delta to spec 006 G1–G5: Meta deferral, live site-wide tags, CAPI
└── checklists/
    └── requirements.md   # Spec quality checklist (from /speckit-specify)
```

### Source Code (repository root) — touched by this feature

```text
infra/gtm/
├── README.md            # UPDATE: container ID, Meta-deferral note, live scope
└── container.json       # NEW: first committed export of GTM-54KBJ2Z3

src/
├── lib/
│   └── analytics/
│       └── dataLayer.ts          # NEW: shared pushDataLayer + typed event union (extract/generalize the submit.ts pattern)
├── components/
│   ├── ui/Button.tsx             # (if it owns CTA semantics) emit cta_click
│   └── sections/CtaSection.tsx   # emit cta_click on the primary CTA path
├── app/(frontend)/
│   └── case-studies/[slug]/page.tsx  # emit case_study_view (client island)
└── components/sections/HubspotMeetings.tsx  # define booking_complete seam (emission gated on the real embed)

tests/
├── e2e/
│   └── datalayer-events.e2e.spec.ts   # NEW: assert window.dataLayer receives cta_click / case_study_view
└── int/                                # (if a pure-unit assertion on the dataLayer helper fits)

docs/INTEGRATIONS.md     # UPDATE §2.3: CAPI decision + booking_complete/Meta deferral seams
docs/ROADMAP.md / docs/PROJECT_HISTORY.md  # bookkeeping on merge (constitution III)
```

**Structure Decision**: Single Next.js app (existing). The only new code is a small `src/lib/analytics/dataLayer.ts` helper (generalizing the proven `submit.ts` push pattern so all events share one typed, SSR-safe emitter) plus thin emit calls at the CTA / case-study / booking seams. Everything else is GTM-web-UI config captured into `infra/gtm/container.json` and documentation reconciliation. No new dependency, route, or DB surface.

## Phasing & gated tail

Mirrors spec 006's convention — code-owned increment merges now; externally-gated verification lands after.

- **Mergeable now (code + docs):** `dataLayer.ts` helper + `cta_click`/`case_study_view` emitters + their E2E tests; the `booking_complete` contract/seam; `infra/gtm/README.md` + INTEGRATIONS.md §2.3 doc updates; the CAPI decision record.
- **External-config tail (verify, don't block):** building the LinkedIn + Google Ads tags in the GTM UI, exporting `container.json`, and running the staging Accept/Deny/Customize fire-matrix (G4). Gated only on doing the GTM-UI work + a staging deploy — no longer on a missing container ID.
- **Deferred (other track):** the 8 Meta browser tags' live triggers (need the per-market landing routes); `booking_complete` live emission (needs the real Meetings embed).

## Complexity Tracking

Not applicable — Constitution Check passed with no violations.
