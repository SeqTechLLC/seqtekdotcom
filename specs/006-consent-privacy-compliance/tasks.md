# Tasks: Consent & Privacy Compliance

**Input**: Design documents from `/specs/006-consent-privacy-compliance/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: MANDATORY per Constitution Principle II — every user story ships ≥1 Vitest integration or Playwright E2E test on the load-bearing path. Where practical, author the test first and watch it FAIL before the implementation turns it green.

**Organization**: grouped by user story (priority order from spec.md) for independent implementation + testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1–US5 (user-story phases only)
- **(GATED)**: blocked on external config/process, NOT engineering — mirrors spec 005's GUID seam. Soft blocks: GTM Container ID (`TBD`), HubSpot portal Privacy & Consent settings, Wix pixel IDs, the ≥7-day CSP soak, production Parameter Store. These tasks land/verify after the external piece arrives; they do not block the code-owned MVP.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Create `infra/gtm/` with `infra/gtm/README.md` documenting the GTM container export → commit workflow and the TBD Container ID (FR-008; first `infra/` use, constitution-sanctioned location).
- [ ] T002 [P] Add a shared Playwright consent harness (stub `window._hsp`, capture `window.dataLayer` consent/`gtag` pushes, seed/clear `__hs_opt_out`/`__hs_cookie_cat_pref`/`hubspotutk` cookies) for reuse across the consent E2E specs, co-located with the existing `tests/e2e/` helpers.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ Blocks the consent stories (US1/US3/US4). US2 (CSP) and US5 (privacy page) are independent of this phase and may proceed in parallel.**

- [ ] T003 Correct the consent bridge in `src/components/integrations/ConsentDefault.tsx`: replace the `window.addEventListener('__hs_opt_in_consent', …)` path with `window._hsp.push(['addPrivacyConsentListener', cb])`; in `cb`, derive `analytics = consent.allowed || consent.categories?.analytics` and `ads = consent.allowed || consent.categories?.advertisement`, call `gtag('consent','update', …)` per the mapping, then `gtag('event','hubspotConsentUpdate')` (contracts/consent-bridge.md C2/C4). Keep the inline consent default (C1) and the nonce/`suppressHydrationWarning` handling unchanged.
- [ ] T004 Reconcile `docs/INTEGRATIONS.md` §2.2 to the official `addPrivacyConsentListener` API (replace the `__hs_opt_in_consent` snippet + prose) — same commit as T003 (Constitution Principle III). Keep ARCHITECTURE.md §6 untouched here (CSP parity handled in T027).
- [ ] T005 [P] Add ADR `docs/decisions/0006-hubspot-consent-bridge.md`: records the bridge-API correction (research R1) and the fail-closed / geo-deferred consent-regime decision (research R5); link from `docs/decisions/README.md`.

**Checkpoint**: the consent bridge fires off the official HubSpot API; consent stories can build on it.

---

## Phase 3: User Story 1 — Deny actually blocks tracking (Priority: P1) 🎯 MVP

**Goal**: a visitor's choice governs tracking — nothing non-essential fires pre-consent or after Deny; consented categories fire after Accept/Customize.

**Independent Test**: stub `_hsp`/`dataLayer`, simulate Accept-all/Deny-all/Customize → assert the `gtag('consent','update')` mapping and **zero** pixel-host network requests on Deny.

### Tests for User Story 1 (MANDATORY) ⚠️

- [ ] T006 [P] [US1] E2E `tests/e2e/consent-flows.e2e.spec.ts` (using the T002 harness): simulate the `addPrivacyConsentListener` callback for Accept-all / Deny-all / Customize(analytics on, ads off); assert the correct `gtag('consent','update')` signals each time AND no request to Meta/LinkedIn/Google-Ads/HubSpot-analytics hosts on Deny (SC-001). Author before T003 to confirm the current bridge fails; T003 turns it green.

### Implementation for User Story 1

- [ ] T007 [US1] (GATED: Container ID + portal) Author the GTM container consent governance — defaults (G1), the `hubspotConsentUpdate` Custom Event trigger (G2), and the per-tag consent requirement on all 10 paid tags (G3) — and export to `infra/gtm/container.json` (contracts/gtm-consent-governance.md).
- [ ] T008 [US1] (GATED: Wix access) Migrate the 8 Meta Pixel IDs + LinkedIn Insight Tag + Google Ads `AW-810041431` from the current Wix site into the container (INTEGRATIONS.md §2.3); feeds T007.
- [ ] T009 [US1] (GATED: T007+T008+portal) Live staging fire-matrix verification (Accept/Deny/Customize) in GTM Preview/Debug + Network no-leak on Deny (G4 / SC-002).

**Checkpoint (MVP)**: T003 + T006 green = the bridge provably gates tracking in CI; live fire-matrix (T007–T009) gated on external config.

---

## Phase 4: User Story 2 — CSP report-only → enforcing (Priority: P1)

**Goal**: production serves an enforcing CSP without breaking legitimate pages, via the documented soak gate.

**Independent Test**: header name + directive set correct per `CSP_MODE`; under enforce, no console CSP block on legitimate resources across marquee surfaces + `/admin`.

### Tests for User Story 2 (MANDATORY) ⚠️

- [ ] T010 [P] [US2] Int test `tests/int/lib/csp.int.spec.ts`: for each `CSP_MODE` (`enforce`/`report-only`/`off`) assert `cspHeaderName` + the built directive set parity with ARCHITECTURE.md §6, and `upgrade-insecure-requests` present only when enforcing (csp.md P2/P6).
- [ ] T011 [P] [US2] Extend `tests/e2e/csp.e2e.spec.ts`: under enforce, assert the `Content-Security-Policy` header is present and no console CSP violation blocks a legitimate resource on the marquee surfaces + the `/admin` Lexical editor (csp.md P6).

### Implementation for User Story 2

- [ ] T012 [P] [US2] Create `docs/CSP_VIOLATIONS_KNOWN.md` with the catalogue schema (data-model §6: `directive`/`blocked-uri`/`source`/`status`/`first-seen`/`note`) seeded with expected browser-extension/third-party noise (FR-011).
- [ ] T013 [US2] (infra/CDK — spec 002 stack) Add the CloudWatch metric filter (per-directive count) + alarm at >100 violations/hour/directive on the CSP report log group (FR-012 / csp.md P3); flag if it lands in the infra repo rather than here.
- [ ] T014 [US2] (GATED: ≥7-day soak) Execute the promote-to-enforce gate (csp.md P5 / INTEGRATIONS.md §8): staging report-only ≥7d, no new violation directives in the trailing 3d, catalogue current, one engineer sign-off + dated cutover recorded in the cutover ticket. **Watch `style-src` specifically.**
- [ ] T015 [US2] (GATED: T014) Flip `CSP_MODE=enforce` in production Parameter Store at the cutover; verify the enforcing header + no breakage (forms/media/tracking/`/admin`). Record in INTEGRATIONS.md §8 / the cutover ticket.
- [ ] T016 [US2] (CONDITIONAL on soak) If the soak shows the HubSpot banner is style-blocked, relax public `style-src` to include `'unsafe-inline'` in `src/lib/csp.ts` and re-soak that directive (csp.md P4); otherwise leave `style-src 'self'`.

**Checkpoint**: T010–T012 mergeable now (policy shape + no-self-break + catalogue); the production flip (T014/T015) is the gated cutover.

---

## Phase 5: User Story 3 — Returning visitor not re-prompted (Priority: P2)

**Goal**: a returning visitor with a prior choice sees no banner and their state is restored before any tag evaluates.

**Independent Test**: pre-seed `__hs_opt_out` + `__hs_cookie_cat_pref`; assert no banner + restored consent applied before any (stubbed) pixel host.

### Tests for User Story 3 (MANDATORY) ⚠️

- [ ] T017 [P] [US3] E2E in `tests/e2e/consent-flows.e2e.spec.ts` (T002 harness): seed the consent cookies for a prior Accept-all and a prior Deny; assert the banner is not shown and the consent `update` matches the seeded choice before any pixel host appears (SC-003).

### Implementation for User Story 3

- [ ] T018 [US3] Confirm the rehydration ordering in `src/components/integrations/ConsentDefault.tsx` + `src/app/(frontend)/layout.tsx`: `_hsp.push(['addPrivacyConsentListener', …])` runs in `<head>` before the tracking script loads so HubSpot invokes the callback on init for returning visitors (research R3). No new code expected beyond T003; adjust ordering only if T017 reveals a race.
- [ ] T019 [US3] (GATED: live config) Staging confirm: returning Accept-all fires consented tags, returning Deny stays blocked (R3 inferred guarantee verified empirically).

**Checkpoint**: returning-visitor persistence proven in CI (T017); live confirm gated.

---

## Phase 6: User Story 4 — Change / withdraw via footer (Priority: P2)

**Goal**: a persistent footer control lets a visitor re-open or withdraw consent from any page.

**Independent Test**: control present on every page, keyboard-operable, axe-clean; activating calls `_hsp showBanner`; withdraw calls `revokeCookieConsent`.

### Tests for User Story 4 (MANDATORY) ⚠️

- [ ] T020 [P] [US4] E2E `tests/e2e/privacy-consent-ui.e2e.spec.ts` (T002 harness): assert the footer consent control renders on a sample of pages, is keyboard-focusable + axe-clean, pushes `['showBanner']` on activate and `['revokeCookieConsent']` on withdraw (contracts/consent-bridge.md C3).

### Implementation for User Story 4

- [ ] T021 [P] [US4] Create `src/components/layout/ConsentPreferences.tsx` (`'use client'`): a "Cookie preferences" control → `window._hsp.push(['showBanner'])` and a "Withdraw consent" affordance → `window._hsp.push(['revokeCookieConsent'])`; render inert (no-op, no throw) when `window._hsp` is absent (env-unset local/CI).
- [ ] T022 [US4] Mount `ConsentPreferences` in `src/components/layout/SiteFooter.tsx` `legalNav` with an accessible label, present on every page.

**Checkpoint**: footer consent control live + a11y-clean.

---

## Phase 7: User Story 5 — Privacy policy page (Priority: P3)

**Goal**: a privacy policy reachable from every page describing data/cookie/third-party practices at the canonical address.

**Independent Test**: footer privacy link → `/privacy-policy`; disclosures present, links the consent control, shows the canonical Cheyenne address, in sitemap, axe-clean.

### Tests for User Story 5 (MANDATORY) ⚠️

- [ ] T023 [P] [US5] E2E in `tests/e2e/privacy-consent-ui.e2e.spec.ts`: `/privacy-policy` renders the data/cookie/third-party disclosures, links the `ConsentPreferences` control, shows **12 N Cheyenne Ave, Tulsa, OK 74103** with 0 "Sapulpa" matches, is reachable from the footer, and is axe-clean (SC-007).

### Implementation for User Story 5

- [ ] T024 [US5] Create `src/app/(frontend)/privacy-policy/page.tsx` — static route with a metadata export (via `src/lib/metadata.ts`), the data/cookie-category/third-party disclosures (data-model §7), the canonical address, and a link to the footer consent control. Legal prose is a reviewable placeholder pending the Phase 5.5 "Legal / privacy" sign-off.
- [ ] T025 [P] [US5] Add `/privacy-policy` to `src/app/(frontend)/sitemap.ts`.
- [ ] T026 [US5] Add the "Privacy policy" link to `src/components/layout/SiteFooter.tsx` `legalNav` (alongside the T022 consent control).

**Checkpoint**: all five stories independently functional (code-owned scope).

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T027 [P] Reconcile the ARCHITECTURE.md §6 CSP directive table with `src/lib/csp.ts` (Principle III; keep INTEGRATIONS.md §8 authoritative per its own note).
- [ ] T028 [P] On ship, MOVE the consent-bridge + CSP-enforce ROADMAP items (Phase 5 "Deferred from spec 004" + "Cookie consent flow E2E" + "CSP promoted to enforcing") into a `PROJECT_HISTORY.md` P-entry — do not checkbox-flip (Principle III).
- [ ] T029 [P] Run the `quickstart.md` validation pass (US1–US5 checklist) and record results.
- [ ] T030 (GATED: live config) Cross-browser/device QA of the consent banner + enforcing CSP (Chrome/Safari/Firefox; iOS/Android) — Phase 5 QA item.
- [ ] T031 Confirm Lighthouse a11y/best-practices/SEO ≥ 0.95 on `/privacy-policy` + the footer-control surfaces; verify enforcing CSP does not regress best-practices (Principle II).

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (P1)** → no deps.
- **Foundational (P2: T003–T005)** → blocks US1/US3/US4 (the consent cluster). **US2 and US5 do not depend on it.**
- **US1 (P3)** → needs T003 (bridge). T006 mergeable now; T007–T009 GATED.
- **US2 (P4)** → independent (CSP). T010–T012 mergeable now; T013 infra; T014–T016 GATED/conditional.
- **US3 (P5)** → needs T003 (bridge). T017 mergeable now; T019 GATED.
- **US4 (P6)** → needs T003 (bridge surface) for live behavior; T020/T021/T022 mergeable now (inert without `_hsp`).
- **US5 (P7)** → independent (static route). All mergeable now.
- **Polish (P8)** → after the stories it summarizes; T028 on ship.

### Within each story

Tests authored first (watch fail) → implementation → integration. Models/contracts → components → wiring.

### Parallel opportunities

- Setup: T001, T002 in parallel.
- Foundational: T005 (ADR) parallel to T003/T004 (which are one commit).
- **Once T003 lands**, US1/US3/US4 can proceed concurrently; US2 and US5 can run from the start (independent of T003).
- `[P]` test tasks (T006, T010, T011, T017, T020, T023) touch distinct files — parallelizable.
- US5 (T023/T024/T025/T026) is fully independent and a good parallel track.

---

## Implementation Strategy

### MVP (mergeable without any external config)

1. Phase 1 Setup → Phase 2 Foundational (T003–T005: the bridge fix + doc + ADR).
2. T006 (US1 bridge E2E) green → **consent provably gates tracking in CI.**
3. T010–T012 (US2 CSP shape + catalogue) + T020–T022 (US4 footer control) + T023–T026 (US5 privacy page) — all code-owned, no external dependency.
4. **STOP & VALIDATE**: run `quickstart.md`; this is the shippable engineering increment.

### Gated tail (lands as external config arrives — the spec-005 seam)

- GTM container + pixel IDs + portal config → T007/T008/T009, T019, T030 (live fire-matrix + cross-browser).
- The ≥7-day CSP soak + prod Parameter Store → T013 (infra alarm), T014/T015, T016 (conditional `style-src`).
- Phase 5.5 → final privacy legal prose sign-off (T024 placeholder), the recorded enforce cutover.

### Incremental delivery

Foundation → US1 (MVP) → US2 / US4 / US5 in parallel → gated live verifications → enforce cutover. Each story is independently testable and adds value without breaking the others.

---

## Notes

- `[P]` = different files, no incomplete-task dependency. `(GATED)` = external config/process, not engineering.
- Constitution IV: `lib/csp.ts` default stays `report-only`; enforce is the env flip at the §8-gated cutover (T014/T015) — never a premature code default.
- The single highest-impact change is T003 (bridge correction) — without it consent never propagates. Its doc reconciliation (T004) ships in the same commit.
- No new runtime dependency → no Principle IV dep-trust review; `npm audit` gate unaffected.
- Commit after each task or logical group; keep tests green.
