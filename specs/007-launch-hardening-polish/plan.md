# Implementation Plan: Launch Hardening & A11y/Perf Polish

**Branch**: `feat/007-launch-hardening-polish` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-launch-hardening-polish/spec.md`

## Summary

Four code-owned launch-hardening tracks, one clean acceptance gate (ARCHITECTURE §7 Lighthouse budgets + axe-clean across the shipped surfaces). No external config, GUID, soak window, or content sign-off gates any of it.

- **US1 — accent contrast (P1, the MVP slice).** The block library leans on the brand-green accent for eyebrows, stat figures, icons, dividers, badges, inline links, and solid CTA fills. Remediate every _meaning-bearing_ usage from green-500 to the green-700 `accent-strong` family per DESIGN_SYSTEM §2.2; exempt (and hide from AT) the purely decorative ones; re-capture the affected showcase visual baselines in the same change.
- **US2 — a11y audit (P2).** Extend axe coverage from homepage-only to the full marquee + campaign route set (seeded), plus keyboard/focus/landmark/heading/alt/reduced-motion checks, plus a manual screen-reader test script + a recorded best-effort pass over two AT/browser pairings.
- **US3 — slow/hung requests (P2).** Wrap every server-side Payload content read in a 5s budget (ERROR_PAGES §5) so a hung query aborts and falls through to the branded `error.tsx`, emitting a warn-level log carrying the `x-request-id`. Happy path and the `/api/health` probe stay untouched.
- **US4 — performance proof (P3).** Tune the in-scope pages to the §7 targets and prove them **once** in a production-representative Lighthouse run; **record** the numbers. Per the 2026-06-05 clarification, **007 does NOT arm the warn → error gate** — CI budgets stay `warn`; the flip is a Phase 5.5 launch-readiness step. SEO ≥ 0.95 is kept only as a regression guard (FR-020).

Phase 0 research surfaced the load-bearing finding behind US1: the `text-accent` utility is a **naming trap**. It resolves to the `accent.DEFAULT` color (`var(--color-accent)` = brand-green-500, the _failing_ 2.4:1 token) — **not** to the green-700 `--color-text-accent` token (which is reached via `text-text-accent`). Every component author who wrote `text-accent` for an inline accent got the failing color. That single trap explains why the defect is spread across ~20 components, and it carries a DESIGN_SYSTEM §2.2/§2.4 doc reconciliation so it cannot recur. The second finding shapes US3: `headers()` cannot be called inside an `unstable_cache` scope, so the 5s timeout + telemetry must wrap the cached readers as an **outermost** layer (where the RSC render scope still permits `headers()`), not inside the raw read that runs within the cache.

## Technical Context

**Language/Version**: TypeScript 5.x (strict, no `any`), React 19, Next.js 16 (App Router; `proxy.ts` runtime). Node.js runtime for server reads + the proxy.

**Primary Dependencies**: Payload CMS v3 Local API (`payload.find` / `payload.findGlobal`) behind the `React.cache(unstable_cache(...))` reader layer in `src/lib/payload.ts`; Tailwind v3 semantic-token color system (`tailwind.config.mjs` + `:root` vars in `src/app/(frontend)/styles.css`); the existing per-request `x-request-id` + `error.tsx` machinery from spec 004. **Test/measurement instruments** (all already devDeps — no new runtime dependency): `@axe-core/playwright`, Playwright (incl. visual snapshots), Lighthouse CI (`.lighthouserc.cjs`). The Principle IV dependency-trust review is **N/A** (no new runtime dep on any path).

**Storage**: N/A — no schema change, no new collection or field. Reads only. Postgres/Payload are untouched except that the in-scope **detail** routes are verified against **seeded** content (the empty CI DB 404s per-slug routes); seeding reuses the spec-004 `marquee-pages.e2e.spec.ts` fixture pattern.

**Testing**: Playwright E2E + `@axe-core/playwright` (contrast + full WCAG 2.2 A/AA sweep across the in-scope routes, seeded); Playwright visual snapshots (re-captured showcase baselines for the accent edits); a Playwright integration test that injects a >5s read delay and asserts fall-through to `error.tsx` within ~5s + a correlated warn log; a recorded production-representative Lighthouse run for US4 (artifact, not a CI gate). Lighthouse a11y/best-practices/SEO ≥ 0.95 continue to **gate**; performance budgets stay **warn**.

**Target Platform**: SSR/ISR Next.js on EC2 + ALB + CloudFront; assistive tech (VoiceOver + Safari, NVDA-or-Orca + Firefox) and slow-mobile profiles are first-class targets for US2/US4.

**Project Type**: Web application (single Next.js monolith with embedded Payload CMS).

**Performance Goals**: In-scope pages meet ARCHITECTURE §7 — Performance ≥ 95, mobile LCP < 2.0s, TBT < 100ms, CLS < 0.1 — demonstrated once in a production-representative run and recorded (FR-015). No happy-path latency regression from the timeout wrapper (FR-013/SC-006): the `Promise.race` adds one `setTimeout`/`clearTimeout` per read and is a no-op on cache hits.

**Constraints**:

- **Clarification (hard):** 007 does **not** arm the perf gate. `.lighthouserc.cjs` performance assertions stay `warn`; the warn → error flip is documented as a Phase 5.5 step (FR-016). This keeps 007 off the empty-state CI run's flakiness risk.
- **Clarification (hard):** the formal blocking screen-reader sign-off is a **Phase 5.5** gate, not a 007 merge-gate (FR-010). 007 ships the SR script + a recorded best-effort pass.
- **No token redefinition.** The brand seed `--color-accent` (green-500) stays as-is — it is a legitimate decorative/illustration color (DESIGN_SYSTEM §2.1, immutable seed). Remediation is per-usage, not a global var remap.
- **Health path exempt** (FR-014): `/api/health` runs its own DB ping in `src/app/(payload)/api/health/route.ts` and does **not** route through the content readers, so it is exempt from the timeout-to-error path **by construction**; the plan verifies this rather than adding a branch.
- **Don't blanket-swap** (Edge Cases): accent-on-navy usages that already pass large-text AA, and true decorative flourishes, are not swapped — each usage is classified individually.
- `npm audit --omit=dev --audit-level=high` stays clean (Principle IV CI gate) — trivially satisfied (no new deps). No version bumps (Principle V).

**Framework-internal / third-party source read at plan time (Constitution Principle I):**

- `src/lib/payload.ts` (1–284) — the singleton `getPayloadInstance()` plus 13 exported readers, each `React.cache(unstable_cache(rawFn))`. The three raw chokepoints are `findPublishedBySlug`, `findPublishedList`, `findPublishedSlugs`, plus the three `payload.findGlobal()` calls (`getSiteSettings`/`getNavigation`/`getHomepage`). The timeout wraps these readers as a new **outermost** layer.
- **`unstable_cache` × `next/headers` constraint** (the load-bearing US3 finding): `headers()`/`cookies()` throw if called inside the `unstable_cache` callback (it is a static cache scope). Therefore the warn-log's `x-request-id` read **must** happen in the wrapper that sits _outside_ `unstable_cache`, in the RSC render scope. Verified against the spec-004 pattern (`JsonLd.tsx`, `GtmScript.tsx`) which read `headers()` only in dynamic RSC scope, never inside a cached reader.
- `src/proxy.ts` (1–111) — `REQUEST_ID_HEADER = 'x-request-id'` generated per request (`crypto.randomUUID()`), set on both response header and a non-`httpOnly` cookie; `HEALTH_PATH = '/api/health'` exempted from the maintenance short-circuit via exact-string compare; matcher excludes `_next`, static assets, `api/csp-report`.
- `src/app/(frontend)/error.tsx` + `global-error.tsx` + `src/components/error/requestId.ts` — a thrown server error renders the branded `error.tsx`, which reads `x-request-id` from the cookie (fallback to the Next error `digest`) and surfaces it. The timeout error needs no new error UI — it just throws.
- `src/lib/hubspot/submit.ts` (86–127) — the existing 15s `AbortController` form-timeout precedent. **Not** reused for reads: Payload's Local API takes no `AbortSignal`, so per ERROR_PAGES §5 the read budget uses `Promise.race` (the losing query is orphaned in the background; the response thread is freed). This divergence is intentional and documented.
- `tailwind.config.mjs` (color block) + `src/app/(frontend)/styles.css` (`:root`) — the token wiring proving the `text-accent` (→ `accent.DEFAULT` → green-500) vs `text-text-accent` (→ `text.accent` → green-700) trap, and confirming `bg-accent-strong`/`text-accent-strong`/`border-accent-strong` utilities already exist (no Tailwind config change needed for remediation).
- `.lighthouserc.cjs` — public-route assertions (`accessibility`/`best-practices`/`seo` = `error` @ 0.95; `performance`/LCP/TBT/CLS = `warn`); `/admin/` special-cased to **a11y-only error**. 007 leaves all assertions as-is.
- `tests/e2e/a11y.e2e.spec.ts` (homepage-only axe), `tests/e2e/marquee-pages.e2e.spec.ts` (seeded marquee axe + the fixture-seeding pattern to extend), `tests/e2e/visual/showcase.e2e.spec.ts` (baseline mechanism + `VIEWPORTS`), `playwright.config.ts`, `.github/workflows/ci.yml` (quality + tests jobs, Postgres 18 service).
- `src/app/(frontend)/styles.css` (67–76) — the global `prefers-reduced-motion` reset is already in place; the audit verifies it rather than adding new motion handling (no framer-motion in the tree; the testimonials carousel is deferred, so the DS-1 open question has no shipped surface to fix in 007).

## Constitution Check

_GATE: evaluated against `.specify/memory/constitution.md` v1.1.0. Re-checked after Phase 1 design (below); no change in verdict._

| Principle                    | Verdict | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Spec Before Code**      | ✅ Pass | Spec cites ARCHITECTURE §7, ERROR_PAGES §5, DESIGN_SYSTEM §2.2 by number. **Doc gaps found:** (a) DESIGN_SYSTEM §2.4 does not warn that the `text-accent` utility ≠ the green-700 text token — reconciled in the same change; (b) ERROR_PAGES §5 says "wrap each call site" — reconciled to the as-built outermost-reader-layer design. Framework-internal source enumerated above, including the `unstable_cache` × `headers()` constraint that the constitution exists to catch.                                                                                                                             |
| **II. Tests Gate Merge**     | ✅ Pass | US1: axe color-contrast clean + re-captured visual baselines. US2: axe WCAG 2.2 A/AA clean across the seeded route set + keyboard/landmark/alt assertions. US3: injected-delay E2E asserts `error.tsx` within ~5s + a correlated warn log; happy-path latency unchanged. US4: the proof is a **recorded** production-representative run (artifact), **not** a new CI gate — consistent with Principle II staging perf as `warn` until Phase 5. No coverage padding.                                                                                                                                            |
| **III. Docs Are Code**       | ✅ Pass | Reconciles DESIGN_SYSTEM §2.2/§2.4 (accent trap + remediation guidance), ERROR_PAGES §5 (as-built timeout design), ARCHITECTURE §7 (records the proof + the deferred flip), and **moves** the shipped ROADMAP items (accent-contrast sweep, a11y audit, slow-request handling, perf tuning) to PROJECT_HISTORY per the convention — leaving structured-data/OG (→ spec 008), CSP-enforce, and cross-browser QA as Phase 5.5. **Candidate ADR** (see research.md): the read-timeout mechanism — `Promise.race` (not `AbortController`) as an outermost reader layer, and why `headers()` forces that placement. |
| **IV. Security Baseline**    | ✅ Pass | No new runtime dependency on any path (axe/Lighthouse are devDeps) → dep-trust review N/A; `npm audit` gate unaffected. No CSP change. `/api/health` stays exempt by construction. No secrets.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **V. Bleeding-Edge, Pinned** | ✅ Pass | No version bumps; no new deprecations introduced. The remediation uses utilities Tailwind already emits.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Gate result: PASS.** No violations; Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/007-launch-hardening-polish/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 — decisions (accent strategy, timeout placement, perf-proof env, SR scope)
├── data-model.md        # Phase 1 — conceptual artifacts (no DB entities): accent classification, timeout-telemetry record, route inventory
├── quickstart.md        # Phase 1 — how to run/verify each track locally
├── contracts/
│   ├── read-timeout-telemetry.md   # warn-log record shape + timeout wrapper behavior + health exemption
│   └── a11y-perf-acceptance.md     # axe tag set + in-scope route inventory + Lighthouse budget table (warn vs error)
├── checklists/
│   └── requirements.md  # (pre-existing, all PASS)
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── payload.ts                      # US3: add outermost withReadTimeout(label, fn) wrapper around the 13 readers; new PayloadReadTimeoutError
├── app/(frontend)/
│   ├── styles.css                      # US1: no value change expected (verify reduced-motion reset, §2.4 vars)
│   ├── error.tsx                       # US3: verify it already surfaces the timeout throw + request id (likely no edit)
│   └── (in-scope routes)               # US1: per-usage accent swaps land in the section/inline components these render
├── components/
│   ├── sections/*.tsx                  # US1: ~16 files — bg-accent→bg-accent-strong, text-accent→text-accent-strong, border-accent→border-accent-strong (meaning-bearing only)
│   ├── richText/inline/*.tsx           # US1: QuotePullquote/TestimonialEmbed/InlineCta border/text accent swaps
│   └── error/requestId.ts              # US3: unchanged (reference)
└── proxy.ts                            # US3: reference only — request-id + health exemption already in place

tests/
├── e2e/
│   ├── a11y.e2e.spec.ts                # US2: expand from homepage-only to the in-scope route set (seeded)
│   ├── marquee-pages.e2e.spec.ts       # US2: reuse/extend the fixture-seeding pattern for detail routes
│   ├── slow-request.e2e.spec.ts        # US3: NEW — inject >5s read delay, assert error page within ~5s + warn log
│   └── visual/showcase.e2e.spec.ts     # US1: re-capture affected baselines (npm run visual:capture)
└── e2e/visual/screenshots/showcase/    # US1: updated PNG baselines committed in the same change

docs/
├── DESIGN_SYSTEM.md                    # §2.2/§2.4 — accent remediation guidance + the text-accent trap warning
├── ERROR_PAGES.md                      # §5 — reconcile to the as-built outermost-reader timeout design
├── ARCHITECTURE.md                     # §7 — record the production-representative proof + the deferred warn→error flip
├── ROADMAP.md / PROJECT_HISTORY.md     # move shipped 007 items to history per the convention
└── decisions/00NN-read-timeout.md      # candidate ADR (Promise.race outermost-layer + headers() placement)

specs/007-launch-hardening-polish/
└── perf-results.md (or docs/)          # US4: the recorded production-representative Lighthouse numbers + SR pass notes
```

**Structure Decision**: Single Next.js monolith (Option 2 collapsed — frontend + embedded Payload share one `src/`). No new top-level directories. The only **new** source files are `tests/e2e/slow-request.e2e.spec.ts`, the recorded perf/SR results doc, and a candidate ADR; everything else is in-place edits to existing components, the reader layer, the test route lists, and the docs they reconcile.

## Complexity Tracking

> No Constitution Check violations — section intentionally empty.
