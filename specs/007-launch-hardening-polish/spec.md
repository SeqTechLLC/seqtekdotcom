# Feature Specification: Launch Hardening & A11y/Perf Polish

**Feature Branch**: `feat/007-launch-hardening-polish`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Spec 007 — Launch hardening & a11y/perf polish (all code-owned, no external gate, one clean acceptance gate = ARCHITECTURE §7 Lighthouse budgets across a11y/perf/best-practices/SEO on the shipped surfaces, axe-clean + SR pass): accent-contrast sweep (~12 remaining bg-accent components → accent-strong, re-capture visual baselines); accessibility audit (axe + manual screen-reader) on marquee + campaign pages; performance optimization → flip Lighthouse perf budgets warn → gate; slow-request / hung-request handling (ERROR_PAGES §5); (maybe) deeper structured data + per-page OG images."

## Clarifications

### Session 2026-06-05

- Q: Performance-gate environment — where does the hard `warn → error` budget gate get armed? → A: Neither now. 007 tunes the in-scope pages to the §7 targets and proves them **once** in a production-representative run; arming the gate (warn → error) is **deferred to Phase 5.5 launch readiness**. CI budgets stay `warn`.
- Q: US5 (richer structured data + per-page OG images) — in 007 or deferred? → A: **Deferred to spec 008** (discoverability/AICO). 007 = US1–US4. SEO ≥ 0.95 is kept only as a regression guard (FR-020).
- Q: Manual screen-reader pass — a 007 merge-gate or deferred? → A: 007 ships all **automatable** a11y (axe-clean, contrast, keyboard/focus, landmarks, alt, reduced-motion) and produces the SR test script + a recorded best-effort pass; the **formal blocking SR sign-off rolls into Phase 5.5** launch readiness (not a 007 merge-gate).

## User Scenarios & Testing _(mandatory)_

The "users" here are site **visitors** — especially those using assistive technology, low-vision visitors, and visitors on slow mobile connections — plus the **launch-readiness gate** (CI) as the stakeholder that must be able to prove the site meets its quality bar before DNS cutover. Every story below is code-owned: no external configuration, content sign-off, or soak window gates it.

### User Story 1 - Low-vision visitors can read every accent element (Priority: P1)

The shipped page templates lean on the brand-green accent (green-500, `#72B94D`) for heading eyebrows, icons, stat figures, inline links, badges, dividers, and solid CTA fills. At green-500 on white/light backgrounds the contrast is ~2.4:1 — below the WCAG 2.2 AA floor (4.5:1 body text, 3:1 large text and non-text UI). A low-vision visitor cannot reliably read a green stat number or a green link label. Every accent element that conveys meaning must meet AA.

**Why this priority**: It is the highest-volume, launch-blocking accessibility defect — it spans nearly the whole section/inline/layout component library (~34 component files reference the accent token today) — and it is entirely code-owned with no content or external dependency. It is the MVP slice: fixing it alone materially improves the site for real users.

**Independent Test**: Run automated contrast checks (axe + a contrast linter) across the rendered marquee + campaign surfaces; every meaningful text/icon/UI accent element reports ≥ AA. Manually spot-check the green stat figures, eyebrows, inline links, and solid CTA fills.

**Acceptance Scenarios**:

1. **Given** any shipped public page, **When** axe runs, **Then** zero color-contrast violations are reported.
2. **Given** a solid accent CTA/badge with light foreground text, **When** its contrast is measured, **Then** it is ≥ 4.5:1 (body) or ≥ 3:1 (large/non-text).
3. **Given** an accent foreground element (stat figure, eyebrow, icon, inline link) on a white/light surface, **When** measured, **Then** it is ≥ AA for its size and role.
4. **Given** an accent usage that is purely decorative, **When** the audit classifies it, **Then** it is explicitly marked exempt (and hidden from assistive tech where appropriate) rather than blanket-swapped.
5. **Given** remediation changes a component's appearance, **When** the visual-regression baselines run, **Then** the affected showcase baselines are re-captured in the same change set (no stale snapshots).

---

### User Story 2 - Assistive-tech and keyboard visitors can operate every marquee/campaign page (Priority: P2)

Beyond contrast, the marquee + campaign pages have never had a full accessibility audit: landmark structure, heading order, visible focus, focus order, keyboard operability, form labels, image alt text, reduced-motion behavior, and a manual screen-reader pass. A keyboard-only or screen-reader visitor must be able to perceive, navigate, and operate every page without a trap or an unlabeled control.

**Why this priority**: Launch-blocking, but it builds on US1 (contrast fixed first so the audit isn't re-flagging the same defect). Code-owned; the only soft dependency is that campaign pages are verified against representative content.

**Independent Test**: axe reports zero violations across the audited routes in automated E2E; keyboard/focus/landmark/alt checks pass; and a manual SR test script plus a recorded best-effort pass (two mainstream AT/browser pairings) exist with code-owned findings fixed or triaged. The formal SR sign-off is a Phase 5.5 gate, not a 007 merge-gate.

**Acceptance Scenarios**:

1. **Given** each audited route, **When** axe runs in CI, **Then** zero WCAG 2.2 A/AA violations are reported.
2. **Given** keyboard-only navigation, **When** a visitor tabs through a page, **Then** focus is always visible, the order is logical, and no element traps focus.
3. **Given** a screen reader, **When** a visitor navigates by landmark and heading, **Then** regions and heading hierarchy are announced correctly and every interactive control has an accessible name.
4. **Given** a visitor with "reduce motion" enabled, **When** animated sections render, **Then** non-essential motion is suppressed.
5. **Given** every image, **When** inspected, **Then** meaningful images carry descriptive alt text and decorative images carry empty alt.

---

### User Story 3 - Visitors never hit a blank or hung page (Priority: P2)

A stuck Payload query currently has no request-level timeout; a hung database call can hold a response thread and leave the visitor on a blank or spinning page. Per ERROR_PAGES §5 ("no dead ends"), every server-side content call must fail fast within a 5-second budget and fall through to the branded error page with telemetry.

**Why this priority**: A robustness guarantee that protects every route under degraded conditions. Code-owned and independently testable, but lower day-one visitor risk than the always-present a11y defects.

**Independent Test**: Inject a >5s delay into a Payload call site; assert the request resolves to the branded error page within ~5s (not a hang) and that a warn-level telemetry event with the request correlation id is emitted.

**Acceptance Scenarios**:

1. **Given** a server-side content call that exceeds 5s, **When** the budget elapses, **Then** the request aborts and renders the branded error page (not a blank or hung response).
2. **Given** a timeout fires, **When** it is handled, **Then** a warn-level log carrying the request correlation id is recorded.
3. **Given** a healthy call (<5s), **When** it completes, **Then** behavior and latency on the happy path are unchanged.
4. **Given** the ALB health-probe path, **When** the timeout machinery is added, **Then** the probe remains exempt so instances are not cycled on a slow content query.

---

### User Story 4 - Pages meet the §7 performance targets (Priority: P3)

Lighthouse performance budgets currently run as `warn`. In 007, launch hardening tunes the in-scope pages until they meet the ARCHITECTURE §7 targets and proves it once in a production-representative run. Per the Session 2026-06-05 clarification, **arming the hard gate (warn → error) is deferred to Phase 5.5 launch readiness** — 007 demonstrates and records the numbers but leaves the CI budgets at `warn`.

**Why this priority**: High long-term value but lower immediate visitor risk than US1–US3, and it depends on the pages being tuned first. Decoupling the proof (007) from arming the gate (Phase 5.5) keeps 007 off the empty-state CI run's flakiness risk.

**Independent Test**: In a production-representative Lighthouse run the in-scope pages meet the §7 thresholds and the result is recorded; the CI budget assertions remain `warn` in 007, with the warn → error flip documented as a Phase 5.5 step.

**Acceptance Scenarios**:

1. **Given** the in-scope pages in a production-representative environment, **When** Lighthouse runs, **Then** Performance ≥ 0.95 and LCP/TBT/CLS meet the §7 ceilings (mobile LCP < 2.0s, TBT < 100ms, CLS < 0.1), and the run is recorded.
2. **Given** the §7 targets are demonstrated, **When** 007 closes, **Then** the warn → error budget flip is recorded as a Phase 5.5 launch-readiness step and the CI budgets remain `warn` (007 does not arm the gate).
3. **Given** the admin login surface, **When** Lighthouse runs, **Then** it retains only its accessibility assertion (no performance/SEO/best-practices gate), per existing policy.

---

_User Story 5 (richer structured data + per-page Open Graph images) was scoped out on 2026-06-05 — **deferred to spec 008 (discoverability/AICO)** per the Clarifications below. 007 covers US1–US4; the SEO ≥ 0.95 gate survives only as a regression guard (FR-020). This is why the story numbering stops at US4._

### Edge Cases

- An accent used as a decorative-only flourish (conveys no information) is exempt from contrast but must be explicitly identified, so it is neither "fixed" into visual noise nor wrongly flagged.
- An accent on a non-white surface (e.g., navy) that already passes large-text AA must not be blanket-swapped — remediate only true failures.
- A component rendered on both light and dark surfaces must hold contrast on both.
- A timeout that fires mid-stream after a partial render must still resolve to a coherent error state, not a half-painted page.
- Reduced-motion plus an autoplaying carousel (the DS-1 open question) — motion suppressed without breaking the control.
- Manual screen-reader findings that originate in third-party / Payload admin chrome rather than our markup are triaged out of scope with a recorded rationale, not silently dropped.

## Requirements _(mandatory)_

### Functional Requirements

**Accessibility — contrast (US1)**

- **FR-001**: Every text, icon, and non-text UI element that conveys meaning MUST meet WCAG 2.2 AA contrast (4.5:1 body text, 3:1 large text and non-text UI) on every background it renders against.
- **FR-002**: Accent elements currently rendered in brand-green-500 as a foreground or a solid fill against white/light surfaces MUST be remediated to a compliant token (the green-700 `accent-strong` family per DESIGN_SYSTEM §2.2) wherever they carry meaning.
- **FR-003**: Purely decorative accent usages MUST be identified and exempted, and hidden from assistive technology where they would otherwise be announced.
- **FR-004**: Any visual change produced by remediation MUST be reflected in updated visual-regression baselines within the same change set.

**Accessibility — audit (US2)**

- **FR-005**: The marquee and campaign routes MUST report zero axe WCAG 2.2 A/AA violations in automated testing.
- **FR-006**: Every in-scope page MUST expose correct landmark structure and a logical, non-skipping heading hierarchy.
- **FR-007**: All interactive controls MUST have accessible names; focus MUST be visible, focus order MUST be logical, and there MUST be no keyboard trap.
- **FR-008**: Meaningful images MUST carry descriptive alt text; decorative images MUST carry empty alt.
- **FR-009**: Non-essential motion MUST be suppressed when the visitor requests reduced motion.
- **FR-010**: 007 MUST deliver a manual screen-reader test script for the in-scope routes plus a recorded best-effort pass (code-owned findings fixed, others logged). The **formal blocking SR sign-off is a Phase 5.5 launch-readiness gate, not a 007 merge-gate** (per the Session 2026-06-05 clarification).

**Robustness — slow / hung requests (US3)**

- **FR-011**: Every server-side content call MUST be bounded by a 5-second timeout; exceeding it MUST abort and fall through to the branded error page.
- **FR-012**: A timeout MUST emit a warn-level telemetry record carrying the request correlation id.
- **FR-013**: Calls completing under budget MUST be unaffected — no added latency and no behavior change on the happy path.
- **FR-014**: The health-probe path MUST remain exempt from the timeout-to-error behavior so instances are not cycled on a slow content query.

**Performance gate (US4)**

- **FR-015**: The in-scope pages MUST meet the ARCHITECTURE §7 performance targets (Performance ≥ 95, mobile LCP < 2.0s, TBT < 100ms, CLS < 0.1), demonstrated once in a production-representative measurement and recorded.
- **FR-016**: 007 MUST NOT arm the performance budgets as hard failures; the CI budgets remain `warn`. The warn → error flip MUST be documented as a Phase 5.5 launch-readiness step (per the Session 2026-06-05 clarification).
- **FR-017**: The admin login surface MUST retain only its accessibility assertion (no performance/SEO/best-practices gate).

**Discoverability / regression guard**

- **FR-018**: _(withdrawn 2026-06-05 → moved to spec 008: structured data passing Rich Results validation per content type)_
- **FR-019**: _(withdrawn 2026-06-05 → moved to spec 008: per-page Open Graph / Twitter images)_
- **FR-020**: The SEO and best-practices Lighthouse categories MUST remain ≥ 0.95 on the public routes — the contrast / a11y / perf changes MUST NOT regress them.

**Cross-cutting**

- **FR-021**: All changes MUST be code-owned and free of external-config, GUID, soak-window, or content sign-off gates; any content dependency is limited to rendering against representative/seeded content for verification only.
- **FR-022**: Documentation this work reconciles (DESIGN_SYSTEM accent guidance, ERROR_PAGES §5, ARCHITECTURE §7, the relevant ROADMAP items) MUST be updated in the same change set, and shipped items moved to PROJECT_HISTORY per the roadmap convention.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Zero axe WCAG 2.2 A/AA violations across all in-scope marquee + campaign routes (automated).
- **SC-002**: 100% of meaningful accent elements meet AA contrast; automated tooling reports zero color-contrast violations.
- **SC-003**: Lighthouse Accessibility ≥ 0.95 and Best Practices ≥ 0.95 on every public route (already gating; must hold after the change).
- **SC-004**: A manual screen-reader test script plus a recorded best-effort pass exist for each in-scope route, with code-owned findings resolved or triaged. (The formal SR sign-off is verified at Phase 5.5, not as a 007 merge-gate.)
- **SC-005**: An injected >5s content-call delay resolves to the branded error page within ~5s (no hang) and emits a correlated warn-level telemetry event, on 100% of attempts.
- **SC-006**: The happy-path render shows no measurable latency regression versus pre-change.
- **SC-007**: In a production-representative run, the in-scope pages meet the §7 performance targets, demonstrated once and recorded. (Arming the budgets as hard failures is deferred to Phase 5.5 and is out of 007's Definition of Done.)
- **SC-008**: Lighthouse SEO ≥ 0.95 holds on every public route after the change (regression guard). (Structured-data validation and per-page OG image coverage are deferred to spec 008.)
- **SC-009**: No external configuration, GUID, soak window, or new content is required to ship and verify the feature; the gated launch items remain explicitly excluded.

## Assumptions

- **In-scope surfaces** = the routes already under Lighthouse/axe coverage (homepage, `/team`, `/case-studies` + detail, `/insights` + detail, `/services` + pillar/detail, `/touchstone-workshops` + detail, `/privacy-policy`) plus the `pages`-driven routes (`/about`, `/localshoring`). Per-slug detail routes are verified in a seeded environment, since the empty CI DB 404s them.
- **Performance gate (resolved — Session 2026-06-05)**: 007 tunes the in-scope pages to the §7 targets and proves them once in a production-representative Lighthouse run (seeded content, production build, conditions mirroring CloudFront); it does NOT arm the warn → error gate. CI budgets stay `warn`; arming the hard gate is a Phase 5.5 launch-readiness step. This keeps 007 off the empty-state CI run's flakiness risk.
- **Manual SR coverage (resolved — Session 2026-06-05)**: 007 delivers the SR test script + a recorded best-effort pass over at least two mainstream AT/browser pairings (e.g., VoiceOver + Safari and NVDA-or-Orca + Firefox); the **formal blocking SR sign-off is a Phase 5.5 launch-readiness gate**. An exhaustive AT matrix and full cross-browser/device QA remain the gated launch item, not this spec.
- **Contrast remediation reuses existing tokens** — the green-700 `accent-strong` family from DESIGN_SYSTEM §2.2; no new brand colors are introduced. Each accent usage is audited individually (some `bg-accent` on navy already passes large-text AA and must not be swapped).
- **Slow-request handling** follows ERROR_PAGES §5 (5s `Promise.race` budget, fall-through to `error.tsx`) and the existing proxy / error-page / `x-request-id` machinery shipped in spec 004; the health path stays exempt as it already is for maintenance mode.
- **US5 deferred (resolved — Session 2026-06-05)**: richer structured data + per-page OG images move to spec 008 (discoverability/AICO); 007 = US1–US4. The SEO ≥ 0.95 gate already holds from the spec-004 baseline and is kept here only as a regression guard (FR-020).
- **Out of scope**: deeper structured data + per-page OG images (→ spec 008); and the gated launch tail tracked elsewhere — CSP enforce flip, live consent fire-matrix, Contact-form GUID go-live, and full cross-browser/device QA. 007 ships none of these.
- **Visual-regression baselines** re-use the existing showcase snapshot mechanism from spec 003/004; re-capture lands in the same change as the visual edits.
