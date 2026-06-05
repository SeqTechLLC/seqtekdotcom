# Quickstart: Verifying Launch Hardening & A11y/Perf Polish

How to run and verify each of the four tracks locally. Dev server is port 3100; Lighthouse runs against a production build on 3200. (Confirm any script flag against `package.json` before relying on it — script names below are current as of this plan.)

## Prerequisites

```bash
# Local dev DB (project Postgres on 5433+ per project convention), then:
npm install
cp .env.example .env.local   # if not already present; never commit .env*
npm run seed:showcase        # seeds showcase fixtures (US1 visual baselines + content for seeded routes)
```

## US1 — Accent contrast

```bash
# 1. After swapping meaning-bearing accent usages to the *-strong family, run the a11y sweep:
npm run test:e2e -- a11y            # axe color-contrast must report zero violations (SC-001/SC-002)

# 2. Re-capture the showcase visual baselines that the accent edits shifted (FR-004):
npm run seed:showcase               # ensure fixtures are seeded
npm run visual:capture -- --update-snapshots   # overwrite affected PNGs under tests/e2e/visual/screenshots/showcase/
git status                          # review the diff — only intended accent shifts should appear; commit baselines in the SAME change
```

Spot-check by eye: green stat figures (`MetricDisplay`, `StatsBar`), eyebrows, inline links, solid CTA fills, and the blockquote/timeline rules now read at green-700, not the washed-out green-500. Confirm any decorative exemption is `aria-hidden` and visually unchanged.

## US2 — A11y audit (axe + keyboard + SR)

```bash
# Automated WCAG 2.2 A/AA sweep across the in-scope route set (seeded):
npm run test:e2e                    # marquee + campaign routes axe-clean; keyboard/landmark/alt assertions pass

# Reduced motion: verify the global reset still suppresses non-essential motion
#   (DevTools → Rendering → emulate prefers-reduced-motion: reduce, walk the pages)
```

Manual SR pass (deliverable, not a merge-gate): follow the per-route SR test script; record a best-effort pass on VoiceOver+Safari and NVDA-or-Orca+Firefox; fix code-owned findings, log the rest with rationale. Save notes alongside the perf results doc.

## US3 — Slow / hung request handling

```bash
# The injected-delay E2E proves fall-through to error.tsx within ~5s + a correlated warn log:
npm run test:e2e -- slow-request    # tests/e2e/slow-request.e2e.spec.ts

# Manual: temporarily make a reader sleep >5s, hit a route, observe:
#   - the branded error page renders within ~5s (no hang)
#   - stdout shows: {"type":"payload_read_timeout","requestId":"…","reader":"…",…}
#   - the requestId on the page == the x-request-id in the response
#   - GET /api/health still returns 200 throughout (FR-014)
```

Confirm the happy path is unchanged: with no delay, page latency and behavior match pre-change (SC-006).

## US4 — Performance proof (recorded, not gated)

```bash
# Production-representative run (seeded DB, production bundle):
npm run build
PORT=3200 npm run start &           # or rely on lhci's startServerCommand
npm run test:lhci                   # Lighthouse CI — a11y/best-practices/seo GATE; performance budgets stay WARN
```

Record the mobile numbers (Performance ≥ 0.95, LCP < 2.0s, TBT < 100ms, CLS < 0.1) into the results doc and cross-link from ARCHITECTURE §7. **Do not** edit the `warn` performance assertions in `.lighthouserc.cjs` — the warn→error flip is a Phase 5.5 step (FR-016).

## Full gate (what CI runs)

```bash
npm run typecheck && npm run lint && npm run format:check
npm audit --omit=dev --audit-level=high
npm run test:int
npm run test:e2e        # Playwright + axe (seeded Postgres in CI)
npm run test:lhci       # Lighthouse (empty CI DB; perf=warn, a11y/bp/seo=error@0.95)
```

## Definition of done (007)

- axe: zero WCAG 2.2 A/AA violations across the in-scope routes (incl. color-contrast). [SC-001/002]
- Lighthouse a11y + best-practices + SEO ≥ 0.95 hold on every public route. [SC-003/008]
- Visual baselines re-captured in the same change; no stale snapshots. [FR-004]
- Injected >5s read → branded error page within ~5s + correlated warn log, 100% of attempts; `/api/health` unaffected. [SC-005, FR-014]
- Happy-path latency unchanged. [SC-006]
- §7 perf targets proven once in a production-representative run and recorded; CI budgets remain `warn`. [SC-007]
- SR test script + recorded best-effort pass exist (formal sign-off → Phase 5.5). [SC-004]
- DESIGN_SYSTEM §2.2/§2.4, ERROR_PAGES §5, ARCHITECTURE §7 reconciled; shipped ROADMAP items moved to PROJECT_HISTORY. [FR-022]
