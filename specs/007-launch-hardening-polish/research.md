# Phase 0 Research: Launch Hardening & A11y/Perf Polish

All four tracks are code-owned; there were no `NEEDS CLARIFICATION` markers left after the 2026-06-05 `/speckit-clarify` session (perf gate, US5 deferral, SR scope all resolved in the spec). The research below resolves the **technical-approach** unknowns for each track against the actual codebase + the canonical docs.

---

## D1 — Accent contrast: the `text-accent` naming trap

**Decision**: Remediate **per-usage** — swap meaning-bearing accent usages to the green-700 `accent-strong` family — and do **not** redefine any color token. Document the trap in DESIGN_SYSTEM so it cannot recur.

**The finding**: Tailwind flattens the `colors` theme, so the utility `text-accent` resolves to the color **named** `accent`, i.e. `accent.DEFAULT` = `var(--color-accent)` = **brand-green-500 (#72B94D), 2.4:1 on white — fails AA even for large text (3:1)**. The green-700 text token (`--color-text-accent`, 5.6:1, passes AA body) is a _different_ color group and is reached only via **`text-text-accent`**. So a component author who wrote the natural-looking `text-accent` for an inline accent silently got the failing color. This is the root cause behind the spread across ~20 components.

| Utility written               | Resolves to                                           | Contrast vs white | Verdict                  |
| ----------------------------- | ----------------------------------------------------- | ----------------- | ------------------------ |
| `text-accent`                 | `accent.DEFAULT` → `--color-accent` → green-500       | 2.4:1             | ❌ fails AA (even large) |
| `text-accent-strong`          | `accent.strong` → `--color-accent-strong` → green-700 | 5.6:1             | ✅ AA body               |
| `text-text-accent`            | `text.accent` → `--color-text-accent` → green-700     | 5.6:1             | ✅ AA body               |
| `text-link`                   | `link.DEFAULT` → `--color-link` → green-700           | 5.6:1             | ✅ AA body               |
| `bg-accent` (white/light fg)  | green-500 fill                                        | 2.4:1             | ❌ fails AA              |
| `bg-accent-strong` (white fg) | green-700 fill                                        | 5.6:1             | ✅ AA body               |

**Remediation rule (applied per usage, not globally):**

- **Foreground text/icon that conveys meaning** (eyebrows, stat figures, step numbers, table labels, inline link text, toggle glyphs): `text-accent` → `text-accent-strong`. Prefer `text-accent-strong` over `text-text-accent` for consistency with the existing `bg-accent-strong` CTA fills.
- **Solid fill with light foreground text** (CTA buttons, badges, bullets/dots, timeline nodes): `bg-accent` → `bg-accent-strong`; matching `hover:bg-accent` → `hover:bg-accent-strong`.
- **Visible borders/dividers that carry meaning** (left-rule on blockquotes/metrics, hover outlines on interactive cards/tabs): `border-accent` → `border-accent-strong`. A 3:1 non-text-UI floor applies to focus/interactive boundaries; green-500 borders on white fail it.
- **Decorative-only flourishes** (a faint `bg-accent/5` wash, an illustration tint, an accent that conveys nothing a sighted user relies on): **exempt** — leave the token, and add `aria-hidden` / empty alt where AT would otherwise announce it. Mark each exemption explicitly in the audit so it is neither "fixed into noise" nor re-flagged.
- **Accent on a non-white surface that already passes** (e.g. green-500 on navy meeting large-text AA): **do not swap** — verify with a measurement, record the pass, move on.

**Rationale**: The brand seed green-500 is immutable (DESIGN_SYSTEM §2.1) and legitimately used for decorative/illustration fills; remapping `--color-accent` would corrupt the brand seed and over-correct decorative usages into visual noise. Per-usage is the only correct surgical fix, and it is exactly what the spec's Edge Cases demand.

**Alternatives considered**:

- _Global var remap_ (`--color-accent` → green-700): rejected — violates the immutable seed and blanket-swaps decorative usages the spec explicitly carves out.
- _Add a Tailwind config alias so `text-accent` → green-700_: rejected — silently changes the meaning of an existing utility, breaks any intentional decorative `text-accent`, and hides the trap instead of documenting it.
- _Per-component contrast linter dependency_: rejected — axe-core's `color-contrast` rule already measures rendered contrast across the seeded routes (US2's sweep is the linter); no new dep (Principle V).

**Doc reconciliation (Principle III)**: DESIGN_SYSTEM §2.4 gets a note: "`text-accent` resolves to the green-500 brand seed (decorative only); for meaning-bearing accent text use `text-accent-strong` / `text-text-accent` / `text-link`." §2.2's "Important pattern" callout already covers green buttons; extend it to foreground text.

---

## D2 — Read-timeout placement: outermost wrapper, `Promise.race`, `headers()` constraint

**Decision**: Add a single `withReadTimeout(label, fn)` helper in `src/lib/payload.ts` and apply it as the **outermost** layer of each of the 13 exported readers — i.e. `withReadTimeout(label, React.cache(unstable_cache(rawFn)))`. It races the reader against a 5s timer (`Promise.race`); on timeout it reads `x-request-id` via `headers()` (legal at this layer), emits a warn-level structured log, and throws a typed `PayloadReadTimeoutError` that propagates to `error.tsx`.

**Why outermost, not at the raw read (the load-bearing finding):** `next/headers`' `headers()`/`cookies()` **throw if called inside an `unstable_cache` callback** — that callback runs in a static cache scope with no request binding. The raw reads (`findPublishedBySlug`, `findPublishedList`, `findPublishedSlugs`, the three `findGlobal` calls) run _inside_ `unstable_cache`, so the warn-log's correlation-id read cannot live there (FR-012 requires the id). Placing `withReadTimeout` _outside_ both cache layers puts the `catch` in the normal RSC render scope, where `headers()` is permitted — matching the spec-004 pattern (`JsonLd.tsx`/`GtmScript.tsx` read `headers()` only in dynamic scope). ERROR_PAGES §5's literal "wrap each call site" is reconciled to this cleaner single-layer placement.

**Why `Promise.race`, not the `AbortController` form-timeout precedent:** the HubSpot `submit.ts` 15s timeout wires `controller.signal` into `fetch`, which honors abort. Payload's Local API (`payload.find`/`findGlobal`) accepts **no `AbortSignal`**, so there is nothing to cancel — `Promise.race` against a timer is the right tool (and is exactly what ERROR_PAGES §5 prescribes). Accepted trade-off: the losing query is **orphaned** — it keeps running in the connection pool until Postgres returns or errors — but the response thread is freed immediately, which is the whole point ("fail fast; don't hold a response thread"). At 5s with a connection pool this is a bounded, acceptable cost; a truly wedged DB is an instance-health problem the ALB probe handles separately.

**Happy path (FR-013/SC-006)**: on a cache **hit**, `React.cache`/`unstable_cache` returns synchronously-fast and the race resolves before the timer ever matters; `clearTimeout` fires in `finally`. The only overhead is one `setTimeout`/`clearTimeout` pair per read — no measurable latency, no behavior change.

**Health exemption (FR-014)**: `/api/health` pings the DB in its own route handler (`src/app/(payload)/api/health/route.ts`) and never calls the content readers, so it is exempt **by construction**. The plan verifies this (a quick grep proving the health route imports none of the readers) rather than adding a path branch.

**Telemetry shape**: `console.warn(JSON.stringify({ type: 'payload_read_timeout', ts, requestId, reader, args }))` — mirrors the existing `health_check_failed` / `csp_violation` structured-log convention (single JSON line to stdout → CloudWatch). `ts` is `new Date().toISOString()` at emit time. See `contracts/read-timeout-telemetry.md`.

**Alternatives considered**:

- _Timeout inside each raw read_: rejected — `headers()` is illegal inside `unstable_cache`; would force threading the id through every signature or an `AsyncLocalStorage` shim. More surface, no benefit.
- _Per-call-site `Promise.race` in each page component_: rejected — duplicates the 5s budget across ~10 templates, easy to forget on a new route, and scatters the telemetry. One reader-layer wrapper is the single chokepoint.
- _Caching the timeout error_: a non-issue — `unstable_cache` only caches resolved values; the thrown error is never cached, and the next request re-attempts.

**Candidate ADR**: yes — record the `Promise.race`-outermost-layer decision + the `headers()`/`unstable_cache` constraint + the orphaned-query trade-off, so the next reader added to `payload.ts` inherits the wrapper knowingly.

---

## D3 — Performance proof environment (US4)

**Decision**: Prove §7 **once** in a production-representative run and **record** it; do not touch `.lighthouserc.cjs` assertions. Production-representative = `npm run build && npm run start` (production bundle, ISR active) against a **seeded** DB so detail routes render real content, Lighthouse mobile profile (the §7 ceilings are mobile: LCP < 2.0s, TBT < 100ms, CLS < 0.1, Performance ≥ 0.95). Capture the report + a numbers table in a results doc (`specs/007-launch-hardening-polish/perf-results.md`, cross-linked from ARCHITECTURE §7).

**Rationale**: The 2026-06-05 clarification is explicit — arming the warn → error gate is a Phase 5.5 step; CI budgets stay `warn`. CI runs Lighthouse against the **empty** DB (listing routes render empty grids), which is not representative of tuned, content-bearing pages and is flakier — so the proof is taken in a seeded production build and recorded as an artifact, while the empty-DB CI run keeps its `warn` budgets unchanged. Tuning levers if a page misses: the §7 playbook is already documented (self-hosted fonts + preload, `next/image` with explicit dims + `priority` above-the-fold, ISR, `afterInteractive`/`lazyOnload` for third-party, lazy below-the-fold) — apply only where a measured page falls short.

**Alternatives considered**:

- _Flip the gate in 007 and gate against staging_: rejected — directly contradicts the clarification; couples 007 to staging-availability and re-introduces the flakiness the clarification removed.
- _Prove against the empty CI DB_: rejected — unrepresentative of tuned content pages; would "pass" a hollow page.

---

## D4 — A11y audit coverage + manual SR scope (US2)

**Decision**: Extend automated axe coverage from the homepage-only `a11y.e2e.spec.ts` to the **full in-scope route set** (see `contracts/a11y-perf-acceptance.md`), reusing the `marquee-pages.e2e.spec.ts` Local-API fixture-seeding for the detail routes the empty DB 404s. Add explicit keyboard/focus, landmark/heading-order, accessible-name, alt-text, and reduced-motion assertions. Deliver a manual SR **test script** (per-route landmark/heading/control walk-through) + a **recorded best-effort pass** over two AT/browser pairings (VoiceOver+Safari, NVDA-or-Orca+Firefox). The formal blocking SR sign-off is **Phase 5.5** (FR-010) — not a 007 merge-gate.

**Reduced motion**: already satisfied globally — `styles.css` (67–76) zeroes animation/transition durations under `prefers-reduced-motion: reduce`, and there is **no** framer-motion in the tree; the testimonials carousel (the DS-1 open question) is deferred and unshipped, so 007 _verifies_ reduced-motion rather than building new handling. If a carousel ships later it inherits the global reset and gets its own audit then.

**Third-party/admin chrome**: SR findings originating in Payload admin chrome (not our markup) are triaged out with a recorded rationale (mirrors the `adminAuthoring.e2e.spec.ts` critical/serious-only policy), per the spec's Edge Cases — not silently dropped.

**Rationale**: US1 lands first so the contrast defect isn't re-flagged by the US2 sweep (the spec's stated ordering). The seeded-fixture pattern already exists from spec 004; extending it is lower-risk than inventing a new harness.

**Alternatives considered**:

- _Block merge on the full manual SR matrix_: rejected — the clarification puts the formal sign-off at Phase 5.5; 007 ships the automatable surface + the script + a best-effort recording.
- _New a11y dependency (pa11y, etc.)_: rejected — `@axe-core/playwright` already covers WCAG 2.2 A/AA incl. contrast (Principle V, no new dep).

---

## D5 — Visual-regression baselines (US1)

**Decision**: Re-capture the affected showcase baselines in the **same change set** as the accent edits (FR-004), via the existing mechanism: seed the showcase fixtures, then run the project's visual-capture command to overwrite the affected PNGs under `tests/e2e/visual/screenshots/showcase/` (3 viewports each). Review the diff so only intended accent shifts are committed; no stale snapshots, no unrelated drift. (Confirm the exact npm script names from `package.json` at implementation time — the showcase capture + seed scripts already exist from spec 003/004.)

**Rationale**: FR-004 + the spec's Acceptance Scenario 5 require baselines to move with the visual edits. Re-using the established snapshot harness avoids a parallel mechanism.

---

## Summary of decisions

| ID  | Decision                                                                                                    | Carries                                       |
| --- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| D1  | Per-usage accent swap to `accent-strong`; no token remap; document the `text-accent` trap                   | DESIGN_SYSTEM §2.2/§2.4 reconciliation        |
| D2  | `withReadTimeout` outermost reader-layer wrapper; `Promise.race`; `headers()` read outside `unstable_cache` | ERROR_PAGES §5 reconciliation + candidate ADR |
| D3  | Prove §7 once in a seeded production build; record; do **not** arm the gate                                 | ARCHITECTURE §7 record + Phase 5.5 flip note  |
| D4  | Extend axe to the full in-scope set (seeded); SR script + best-effort pass; formal sign-off → Phase 5.5     | reuse spec-004 fixture pattern                |
| D5  | Re-capture affected visual baselines in the same change                                                     | existing showcase harness                     |
