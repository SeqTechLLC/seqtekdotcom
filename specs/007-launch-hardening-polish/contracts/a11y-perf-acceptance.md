# Contract: A11y + Performance Acceptance (US1/US2/US4)

The measurement instruments and pass thresholds 007 commits to. Authoritative for FR-001…FR-010, FR-015…FR-017, FR-020 and SC-001…SC-004, SC-007, SC-008. Tools (axe, Lighthouse) are acceptance instruments, not new runtime deps.

## C-1. axe coverage (US1 contrast + US2 full WCAG)

- **Tag set** (matches the existing suite): `['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']`.
- **Assertion**: `expect(results.violations).toEqual([])` — zero WCAG 2.2 A/AA violations, including the `color-contrast` rule (which is US1's automated proof — SC-001, SC-002).
- **Routes** (the in-scope set; detail routes seeded via the `marquee-pages.e2e.spec.ts` Local-API fixture pattern):

| Route                                                            | Seeding for E2E            |
| ---------------------------------------------------------------- | -------------------------- |
| `/`                                                              | homepage global content    |
| `/team`                                                          | ≥1 teamMember (with photo) |
| `/case-studies` + `/case-studies/[slug]`                         | ≥1 published caseStudy     |
| `/insights` + `/insights/[slug]`                                 | ≥1 published post          |
| `/services` + `/services/[pillar]` + `/services/[pillar]/[slug]` | ≥1 pillar + service        |
| `/touchstone-workshops` + `/touchstone-workshops/[slug]`         | ≥1 published workshop      |
| `/privacy-policy`                                                | none (static)              |
| `/about`, `/localshoring`                                        | ≥1 `pages` doc each        |

- **Admin chrome carve-out**: Payload `/admin` keeps the existing critical/serious-only policy (`adminAuthoring.e2e.spec.ts`); SR findings originating in admin/third-party chrome are triaged with a recorded rationale, not counted against our markup.

## C-2. Non-axe a11y assertions (US2)

Per in-scope route, automated where practical:

- **Landmarks/headings** (FR-006): one `<main>`, correct `header`/`nav`/`footer`, non-skipping heading order (no h1→h3 jump).
- **Keyboard/focus** (FR-007): every interactive control reachable by Tab with a visible focus ring (the `:focus-visible` 2px `border-focus` outline in `styles.css`), logical order, no trap, every control has an accessible name.
- **Images** (FR-008): meaningful images carry descriptive alt; decorative carry empty `alt=""`.
- **Reduced motion** (FR-009): with `prefers-reduced-motion: reduce`, non-essential motion is suppressed — verified against the existing global reset (`styles.css` 67–76); no shipped carousel today.

## C-3. Manual SR deliverable (US2 — FR-010, SC-004)

- A **test script**: per in-scope route, the landmark walk, heading walk, and control-by-control accessible-name checklist.
- A **recorded best-effort pass** over ≥2 AT/browser pairings (VoiceOver+Safari, NVDA-or-Orca+Firefox), code-owned findings fixed, others logged with rationale.
- **Not a 007 merge-gate** — the formal blocking SR sign-off is a Phase 5.5 launch-readiness gate.

## C-4. Lighthouse budgets (US4 — the explicit no-flip contract)

`.lighthouserc.cjs` stays **as-is in 007**. Recorded here so the warn→error flip is unambiguous for Phase 5.5.

| Category / metric           | Public routes (`^(?!.*/admin/).*$`)   | 007 action                                              |
| --------------------------- | ------------------------------------- | ------------------------------------------------------- |
| `categories:accessibility`  | `error` @ ≥ 0.95                      | **gates** (unchanged) — SC-003                          |
| `categories:best-practices` | `error` @ ≥ 0.95                      | **gates** (unchanged) — SC-003                          |
| `categories:seo`            | `error` @ ≥ 0.95                      | **gates** (unchanged) — regression guard, FR-020/SC-008 |
| `categories:performance`    | `warn` @ ≥ 0.95                       | **stays warn** (FR-016)                                 |
| `largest-contentful-paint`  | `warn` @ ≤ 2000ms                     | **stays warn**                                          |
| `total-blocking-time`       | `warn` @ ≤ 100ms                      | **stays warn**                                          |
| `cumulative-layout-shift`   | `warn` @ ≤ 0.1                        | **stays warn**                                          |
| `/admin/` surface           | `accessibility` `error` @ ≥ 0.95 only | **unchanged** (FR-017)                                  |

- **Phase 5.5 flip (documented, not done here)**: change the four `performance` rows from `warn` → `error` once the production-representative proof is stable. 007 records the proof; it does not edit these lines.

## C-5. Performance proof (US4 — FR-015, SC-007)

- **Environment**: `npm run build && npm run start` (production bundle, ISR), seeded DB, Lighthouse **mobile** profile.
- **Thresholds proven once**: Performance ≥ 0.95, mobile LCP < 2.0s, TBT < 100ms, CLS < 0.1.
- **Artifact**: a results doc (numbers table + run conditions) cross-linked from ARCHITECTURE §7. This is a **recorded artifact, not a CI gate**.
