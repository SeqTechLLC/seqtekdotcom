# Contract: accessibility and performance acceptance

The instruments and thresholds the public site is accepted against.

## C-1. axe coverage

- **Tag set.** `['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']` (`tests/e2e/a11y.e2e.spec.ts`).
- **Assertion.** `expect(results.violations).toEqual([])`: zero WCAG 2.2 A/AA violations, including
  `color-contrast`.
- **Routes.** The in-scope set is `inScopeRoutes()` in `tests/e2e/helpers/seedInScopeRoutes.ts`,
  which seeds the fixtures each route needs.
- **Admin.** Payload `/admin` keeps its critical/serious-only policy
  (`tests/a11y/adminAuthoring.e2e.spec.ts`). Findings from admin or third-party chrome are triaged
  with a recorded rationale, not counted against our markup.

## C-2. Non-axe checks, per in-scope route

- One `<main>`, correct `header`/`nav`/`footer`, and no skipped heading levels.
- Every interactive control is reachable by Tab, shows the `:focus-visible` ring, sits in a
  logical order, has an accessible name, and traps nothing.
- Meaningful images carry descriptive alt text; decorative ones carry `alt=""`.
- With `prefers-reduced-motion: reduce`, non-essential motion stops (the global reset in
  `src/app/(frontend)/styles.css`).

## C-3. Lighthouse budgets

`.lighthouserc.cjs` holds them. On public routes, accessibility, best practices and SEO fail
the build below 0.95. Performance ≥ 0.95, LCP ≤ 2000 ms, TBT ≤ 100 ms and CLS ≤ 0.1 are
warnings. `/admin` gates accessibility only. The performance rows move from `warn` to
`error` once a run against the deployed lane holds them (`ROADMAP.md` P3).
