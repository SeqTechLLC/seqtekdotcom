---
description: 'Task list for Launch Hardening & A11y/Perf Polish (spec 007)'
---

# Tasks: Launch Hardening & A11y/Perf Polish

**Input**: Design documents from `/specs/007-launch-hardening-polish/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓ (read-timeout-telemetry.md, a11y-perf-acceptance.md), quickstart.md ✓

**Tests**: Per constitution Principle II, every user story ships with at least one Playwright E2E (or Vitest integration) test that exercises the load-bearing path. Test tasks below are **mandatory**; for US3 the test is written first and verified RED before the wrapper turns it green.

**Organization**: Tasks are grouped by user story (US1 P1 → US2 P2 → US3 P2 → US4 P3) so each story is independently implementable and testable. No new DB entity, collection, field, or migration — this is a presentation/robustness/coverage hardening pass (reads only).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 / US4 (Setup, Foundational, Polish carry no story label)
- Exact file paths are included in every task.

## Path conventions

Single Next.js monolith (frontend + embedded Payload share one `src/`). `src/` and `tests/` at repo root; docs under `docs/`; feature artifacts under `specs/007-launch-hardening-polish/`.

---

## Phase 1: Setup (verification prerequisites)

**Purpose**: Confirm the existing tooling/tokens this hardening pass leans on, before touching code. No new dependency is installed (axe / Lighthouse / Playwright are already devDeps).

- [x] T001 Verify the local verification pipeline runs against seeded content: `npm run seed:showcase` populates the in-scope routes, and confirm the exact script names this feature relies on still exist in `package.json` (`test:e2e`, `visual:capture`, `test:lhci`, `seed:showcase`). Record any drift in `specs/007-launch-hardening-polish/quickstart.md`.
- [x] T002 [P] Confirm the green-700 `accent-strong` utilities already emit and need **no** Tailwind change: grep `tailwind.config.mjs` + `src/app/(frontend)/styles.css` for `accent.strong` / `--color-accent-strong` and verify `bg-accent-strong` / `text-accent-strong` / `border-accent-strong` resolve to green-700 (per research.md D1). This is the gate that makes US1 a per-usage swap with no token work.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: The two artifacts every user story below depends on — the per-usage accent decision record (drives all of US1) and the seeded full-in-scope-route E2E fixture (drives US1's contrast sweep and US2's WCAG sweep).

**⚠️ CRITICAL**: US1/US2 work cannot begin until these are complete.

- [x] T003 Produce the accent-usage classification inventory (data-model.md §1) as `specs/007-launch-hardening-polish/accent-audit.md`: one row per accent-family utility usage across the ~37 grepped files (`src/components/sections/*`, `src/components/richText/inline/*`, `src/components/layout/{SiteHeader,MobileNav}.tsx`, `src/app/(frontend)/case-studies/[slug]/page.tsx`, `src/app/(frontend)/touchstone-workshops/[slug]/page.tsx`, `src/app/(frontend)/not-found.tsx`, `src/components/sections/Content.tsx`, `src/app/(frontend)/styles.css`) with `role` / `surface` / `currentToken` / `verdict` (`remediate` | `exempt` | `already-passes`) / `targetToken`, applying the data-model invariants (decorative ⇒ exempt+hidden-from-AT; light-surface failing ⇒ remediate; navy/dark already-passing large-text AA ⇒ do not swap). This record drives T006–T012.
- [x] T004 Build a shared seeded-route E2E fixture for the full in-scope set (contracts/a11y-perf-acceptance.md C-1 route table) by extending the `tests/e2e/marquee-pages.e2e.spec.ts` Local-API seeding pattern into a reusable helper under `tests/e2e/helpers/` (≥1 published `caseStudy`, `post`, `pillar`+`service`, `workshop`, a `teamMember` with photo, `pages` docs for `/about` + `/localshoring`), so the detail routes the empty CI DB 404s render real content. Consumed by US1 (T005) and US2 (T015–T017).

**Checkpoint**: Accent decisions recorded + seeded in-scope routes render → US1 and US2 can proceed.

---

## Phase 3: User Story 1 - Low-vision visitors can read every accent element (Priority: P1) 🎯 MVP

**Goal**: Remediate every meaning-bearing brand-green-500 accent (foreground text, solid fills, meaningful borders/dividers) to the green-700 `accent-strong` family per DESIGN_SYSTEM §2.2; explicitly exempt (and hide from AT) the purely decorative ones; re-capture affected visual baselines in the same change.

**Independent Test**: axe `color-contrast` rule reports **zero** violations across the seeded in-scope routes; spot-check that green stat figures, eyebrows, inline links, solid CTA fills, and blockquote/timeline rules now render at green-700.

### Tests for User Story 1 (MANDATORY) ⚠️

- [x] T005 [US1] Extend `tests/e2e/a11y.e2e.spec.ts` from homepage-only to the full seeded in-scope route set (using the T004 helper), asserting `expect(results.violations).toEqual([])` for the `color-contrast` rule with the tag set `['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']`. Run it now and confirm it **fails** (RED) on the un-remediated accents before T006–T012.

### Implementation for User Story 1

> All swaps below are driven by the T003 inventory — edit only the usages it marks `remediate`; leave `exempt` / `already-passes` untouched. The seven tasks touch disjoint file sets and are mutually parallel.

- [x] T006 [P] [US1] Section **solid-fill** swaps `bg-accent → bg-accent-strong` (+ matching `hover:bg-accent → hover:bg-accent-strong`) in `src/components/sections/`: `ContactCta.tsx`, `Hero.tsx`, `HomepageHero.tsx`, `NewsletterCta.tsx`, `FeaturedCaseStudy.tsx`, `ServicePillarHero.tsx`, `TwoColumn.tsx` — per the T003 verdicts.
- [x] T007 [P] [US1] Section **foreground-text/icon** swaps `text-accent → text-accent-strong` in `src/components/sections/`: `MetricDisplay.tsx`, `StatsBar.tsx`, `CaseStudyHero.tsx`, `ProcessSteps.tsx`, `KeyTakeaways.tsx`, `ComparisonTable.tsx`, `MissionVisionValues.tsx`, `WorkshopList.tsx`, `Accordion.tsx`, `FAQ.tsx`, `HubspotMeetings.tsx` — per the T003 verdicts.
- [x] T008 [P] [US1] Section **border/divider/dot** swaps `border-accent → border-accent-strong` (3:1 non-text-UI floor) in `src/components/sections/`: `Timeline.tsx`, `Deliverables.tsx`, `BrandTeaser.tsx`, `TechStack.tsx`, `Tabs.tsx`, `ServiceCards.tsx` — per the T003 verdicts.
- [x] T009 [P] [US1] richText inline swaps in `src/components/richText/inline/`: `InlineCta.tsx`, `QuotePullquote.tsx`, `TestimonialEmbed.tsx` (border/text accent → `*-accent-strong`) — per the T003 verdicts.
- [x] T010 [P] [US1] Route-level blockquote / not-found accent swaps: `src/app/(frontend)/case-studies/[slug]/page.tsx` (2 usages), `src/app/(frontend)/touchstone-workshops/[slug]/page.tsx`, `src/app/(frontend)/not-found.tsx` — per the T003 verdicts.
- [x] T011 [P] [US1] Layout accent classification + swap: `src/components/layout/SiteHeader.tsx`, `src/components/layout/MobileNav.tsx` — apply the T003 verdict (remediate to `*-accent-strong` if meaning-bearing; leave if a decorative hover-only flourish that already passes).
- [x] T012 [P] [US1] Decorative exemptions: confirm the `bg-accent/5` wash in `src/components/sections/Content.tsx` and the usage in `src/app/(frontend)/styles.css` stay green-500 per T003, and add `aria-hidden`/empty-alt where AT would otherwise announce them (FR-003). Do **not** swap these.
- [x] T013 [US1] Re-capture the affected showcase visual baselines in the same change set (FR-004): `npm run seed:showcase` then `npm run visual:capture -- --update-snapshots`, overwriting only the shifted PNGs under `tests/e2e/visual/screenshots/showcase/` (3 viewports each); review `git status`/diff so only intended accent shifts are committed, no unrelated drift. Depends on T006–T012.
- [x] T014 [US1] Reconcile DESIGN_SYSTEM docs (FR-022): in `docs/DESIGN_SYSTEM.md` add the §2.4 note that the `text-accent` utility resolves to green-500 (decorative seed) and meaning-bearing accent text must use `text-accent-strong` / `text-text-accent` / `text-link`, and extend the §2.2 "Important pattern" callout from buttons to foreground text/borders (research.md D1).

**Checkpoint**: T005 now passes GREEN; axe color-contrast is clean across the seeded in-scope routes; visual baselines reflect the green-700 accents; the `text-accent` trap is documented. **US1 is independently shippable as the MVP.**

---

## Phase 4: User Story 2 - AT and keyboard visitors can operate every page (Priority: P2)

**Goal**: Extend automated a11y coverage from homepage-only to the full in-scope route set with a complete WCAG 2.2 A/AA sweep plus keyboard/focus, landmark/heading, alt-text, and reduced-motion assertions; deliver a manual screen-reader test script + a recorded best-effort pass.

**Independent Test**: axe reports zero WCAG 2.2 A/AA violations across the audited routes; keyboard/focus/landmark/heading/alt/reduced-motion assertions pass; the SR test script + a two-pairing recorded pass exist with code-owned findings fixed or triaged. (US1 lands first so this sweep does not re-flag the contrast defect.)

### Tests for User Story 2 (MANDATORY) ⚠️

- [x] T015 [US2] Expand the full-WCAG axe assertion in `tests/e2e/a11y.e2e.spec.ts` (built on the T005 sweep) to assert `expect(results.violations).toEqual([])` across **all** in-scope routes for the full tag set (not just `color-contrast`), per contracts/a11y-perf-acceptance.md C-1; retain the `/admin` critical/serious-only carve-out used by `tests/e2e/authoring/adminAuthoring.e2e.spec.ts`.
- [x] T016 [P] [US2] Add keyboard/focus + landmark/heading assertions (contracts C-2, FR-006/FR-007) to the a11y suite: one `<main>` per route, correct `header`/`nav`/`footer`, non-skipping heading order, every interactive control reachable by Tab with a visible `:focus-visible` ring, logical order, no keyboard trap, and an accessible name on every control.
- [x] T017 [P] [US2] Add image-alt + reduced-motion assertions (contracts C-2, FR-008/FR-009): meaningful images carry descriptive alt and decorative images carry empty `alt=""`; with `prefers-reduced-motion: reduce` emulated, verify the existing global reset in `src/app/(frontend)/styles.css` (lines ~67–76) suppresses non-essential motion (no shipped carousel today — verify, don't build).

### Implementation for User Story 2

- [x] T018 [US2] Remediate the code-owned findings surfaced by T015–T017 (landmark gaps, heading-order jumps, missing accessible names, mis-alt'd images) in the relevant `src/components/**` / `src/app/(frontend)/**` files until the suite is green; re-run until clean.
- [x] T019 [US2] Author the manual SR deliverable (FR-010, contracts C-3): a per-route landmark/heading/control-name walkthrough **test script** plus a **recorded best-effort pass** over two AT/browser pairings (VoiceOver+Safari, NVDA-or-Orca+Firefox) in `specs/007-launch-hardening-polish/sr-pass.md`; fix code-owned findings, triage admin/third-party-chrome findings out with a recorded rationale. (Formal blocking SR sign-off is a Phase 5.5 gate, not a 007 merge-gate.)

**Checkpoint**: Zero WCAG 2.2 A/AA axe violations + keyboard/landmark/alt/reduced-motion assertions pass across the in-scope routes; SR script + recorded pass exist. US1 + US2 both independently functional.

---

## Phase 5: User Story 3 - Visitors never hit a blank or hung page (Priority: P2)

**Goal**: Wrap every server-side Payload content read in a 5s budget as an **outermost** reader-layer (`Promise.race`, not `AbortController`); on timeout, throw a typed error that falls through to the branded `error.tsx` and emit a warn-level log carrying `x-request-id` read via `headers()` outside the `unstable_cache` scope. Happy path and `/api/health` untouched.

**Independent Test**: Inject a >5s delay into a reader → request renders `error.tsx` within ~5s (no hang) and emits a `payload_read_timeout` warn log whose `requestId` equals the response `x-request-id`; a healthy (<5s) read is unchanged; `/api/health` returns 200 throughout.

### Tests for User Story 3 (MANDATORY — write first, verify RED) ⚠️

- [x] T020 [US3] Create `tests/e2e/slow-request.e2e.spec.ts` with two cases: **(a) timeout path** — inject a >5s delay into a reader call site, assert the request resolves to the branded `error.tsx` within ~5s (not a hang) and emits a `payload_read_timeout` warn log whose `requestId` matches the response's `x-request-id` cookie/header (contracts/read-timeout-telemetry.md C-4 #1/#2, SC-005); **(b) happy path (FR-013/SC-006, contracts C-4 #3)** — a healthy (<5s) read renders the page normally with **no** `payload_read_timeout` log and unchanged behavior (the wrapper is a no-op on cache hits). Run now and confirm case (a) **fails** (RED) before T022. _Note: SC-006 "no measurable latency regression" is proven by design (one `setTimeout`/`clearTimeout` per read, no-op on cache hit) + the full suite staying green in T031, not a CI microbenchmark (which would be flaky)._
- [x] T021 [P] [US3] Add the health-exemption assertion (contracts C-3, FR-014): a test/grep in the suite proving `src/app/(payload)/api/health/route.ts` imports none of the `src/lib/payload.ts` readers (so a slow content query never cycles instances), and that `/api/health` returns 200 while a content reader times out elsewhere.

### Implementation for User Story 3

- [x] T022 [US3] In `src/lib/payload.ts` add `READ_TIMEOUT_MS = 5000`, `class PayloadReadTimeoutError extends Error`, and `withReadTimeout<T>(label, fn)` returning a wrapper that runs `Promise.race([fn(...args), timer])` with `clearTimeout` in `finally`. On timeout, resolve `requestId` **defensively** — `try { requestId = (await headers()).get('x-request-id') ?? 'unknown' } catch { requestId = 'unknown' }` — because the read scope is **not always a request**: `publishedSlugsFor` + `listServices`/`listServicePillars` are called from `src/app/(frontend)/sitemap.ts`, which is `export const revalidate = 3600` (ISR/static scope where `headers()` is unavailable and throws). Then `console.warn(JSON.stringify({ type:'payload_read_timeout', ts: new Date().toISOString(), requestId, reader: label, args }))` and throw `PayloadReadTimeoutError`. Per contracts C-1/C-2.
- [x] T022b [US3] Apply `withReadTimeout` as the **outermost** layer of the **16 cached public readers** in `src/lib/payload.ts` (verified against the module, correcting the plan/contract "13" count): 3 globals `getSiteSettings`/`getNavigation`/`getHomepage`, 6 detail `get{Page,CaseStudy,Post,Service,ServicePillar,Workshop}BySlug`, 6 listing `list{CaseStudies,Posts,Services,ServicePillars,Workshops,TeamMembers}`, and `publishedSlugsFor` — wrapping the **outside** of each `cache(...)` / `unstable_cache(...)()` expression (e.g. `export const getHomepage = withReadTimeout('getHomepage', cache(async () => unstable_cache(...)()))`). Do **NOT** wrap the 3 raw exported helpers `findPublishedBySlug` / `findPublishedList` / `findPublishedSlugs` (they execute _inside_ the `unstable_cache` callback — `headers()` illegal there — and are test-only direct-call entry points), nor the `getPayloadInstance` singleton or the tag helpers. Depends on T022.
- [x] T023 [US3] Verify `src/app/(frontend)/error.tsx` already surfaces the `PayloadReadTimeoutError` throw with the request id (via `src/components/error/requestId.ts` cookie read, fallback to the Next `digest`) and needs **no** new error UI; add nothing unless a gap is found. Confirms contracts C-1 propagation.
- [x] T024 [US3] Reconcile `docs/ERROR_PAGES.md` §5 (FR-022): replace the literal "wrap each call site" wording with the as-built **outermost single-reader-layer** design (`Promise.race` 5s budget, orphaned-query trade-off, `headers()`-outside-`unstable_cache` placement, health exemption by construction).
- [x] T025 [US3] Write the ADR `docs/decisions/0007-read-timeout.md` (research.md D2 candidate): record `Promise.race`-as-outermost-layer (not `AbortController` — Payload Local API takes no `AbortSignal`), the `headers()` × `unstable_cache` constraint that forces the placement, and the orphaned-query trade-off; add the index entry per `docs/decisions/README.md`.

**Checkpoint**: T020 passes GREEN; injected >5s read → branded error within ~5s + correlated warn log; happy path and `/api/health` unaffected; ERROR_PAGES §5 + ADR reconciled. US3 independently functional.

---

## Phase 6: User Story 4 - Pages meet the §7 performance targets (Priority: P3)

**Goal**: Tune the in-scope pages to the ARCHITECTURE §7 targets and prove them **once** in a production-representative Lighthouse run; record the numbers. Do **not** arm the warn → error gate (that flip is a Phase 5.5 step); SEO ≥ 0.95 kept as a regression guard.

**Independent Test**: In a seeded production build, Lighthouse mobile shows Performance ≥ 0.95, LCP < 2.0s, TBT < 100ms, CLS < 0.1 on the in-scope pages, recorded as an artifact; `.lighthouserc.cjs` performance assertions remain `warn`.

### Implementation for User Story 4

- [x] T026 [US4] Run the production-representative Lighthouse proof (contracts C-5, FR-015): `npm run build` then `npm run start` (or lhci `startServerCommand`) against a **seeded** DB, mobile profile, capturing Performance / LCP / TBT / CLS for each in-scope route.
- [x] T027 [US4] For any in-scope page that misses a §7 ceiling, apply only the needed levers from the §7 playbook (self-hosted font preload, `next/image` explicit dims + `priority` above-the-fold, `afterInteractive`/`lazyOnload` third-party, lazy below-the-fold) in the relevant `src/**` files, then re-run T026 until the page meets the target. (Conditional — skip per page if already passing.)
- [x] T028 [US4] Record the proof: create `specs/007-launch-hardening-polish/perf-results.md` (per-route numbers table + run conditions) and cross-link it from `docs/ARCHITECTURE.md` §7 (FR-015/SC-007).
- [x] T029 [US4] Verify `.lighthouserc.cjs` is **unchanged** — `performance`/LCP/TBT/CLS stay `warn`, `accessibility`/`best-practices`/`seo` stay `error`@0.95, `/admin` stays a11y-only (FR-016/FR-017/FR-020, contracts C-4) — and document the warn → error flip as a Phase 5.5 launch-readiness step in `docs/ARCHITECTURE.md` §7 (do NOT flip it here).

**Checkpoint**: §7 targets proven once and recorded; CI budgets still `warn`; SEO/best-practices regression guard intact. All four stories complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Doc/roadmap reconciliation that spans the stories, plus the full-gate validation pass.

- [x] T030 [P] Move the shipped 007 items (accent-contrast sweep, a11y audit, slow-request handling, perf tuning/proof) from the "Deferred from spec 004 (Phase 5)" subsection of `docs/ROADMAP.md` into `docs/PROJECT_HISTORY.md` (IDs preserved), leaving structured-data/OG (→ spec 008), CSP-enforce, and cross-browser QA as Phase 5.5 (FR-022).
- [x] T031 Ran the full CI gate locally per quickstart.md. **Green for everything 007 touches:** `typecheck` ✓, `lint` ✓, `format:check` ✓ (full repo), `npm audit --omit=dev --audit-level=high` ✓ (no high/critical, no new deps), `test:int` ✓ **476/476** (incl. the cache-tag keystone + new read-timeout int test), the 007 E2E (a11y **45/45** + slow-request **4/4**) ✓, `test:lhci` a11y/SEO gate ≥ 0.95 ✓ (performance `warn`), visual capture **147/147** ✓. The full `test:e2e` showed 5 failures, **all environmental / pre-existing, none 007 regressions**: consent×2 + csp fail only because this machine's `.env.local` carries a real `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` so live pixels fire — CI runs with the IDs unset and passes (same cause as best-practices 0.61 local vs 0.96 CI); marquee `/team` was local `.next` `unstable_cache` staleness (proven to pass on a fresh `.next`); media/altRequired is an admin-form test 007 never touches. Confirms SC-001/002/003/005/006/008 + the FR-020 regression guard.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup — **blocks US1 and US2** (T003 drives every US1 swap; T004 seeds the routes US1/US2 axe against).
- **US1 (Phase 3, P1)**: depends on Foundational. The MVP — ship after this if desired.
- **US2 (Phase 4, P2)**: depends on Foundational; **soft-depends on US1** (US1 lands first so the WCAG sweep doesn't re-flag contrast) and reuses the T004 fixture.
- **US3 (Phase 5, P2)**: depends only on Setup — fully independent of US1/US2 (different files: `src/lib/payload.ts`, `tests/e2e/slow-request.e2e.spec.ts`, ERROR_PAGES/ADR docs). Can run in parallel with US1/US2.
- **US4 (Phase 6, P3)**: depends on US1–US3 being tuned/merged for a meaningful proof (measures the shipped pages).
- **Polish (Phase 7)**: depends on the stories whose items it retires (T030 after US1–US4; T031 last).

### Within each user story

- US1: T003 (foundational) before T006–T012; T006–T012 before T013 (baselines) ; T005 written before T006–T012 (verify RED→GREEN); T014 anytime after T003.
- US2: T015–T017 before T018 (remediate to green); T019 alongside.
- US3: T020 written and RED before T022; T021 independent; T022 (wrapper) before T022b (apply to readers) before T023; T024/T025 after T022b.
- US4: T026 before T027 (tune) ; loop T026↔T027 until passing; T028/T029 after.

### Parallel opportunities

- T002 ‖ T001 (Setup).
- **US1 swaps T006–T012 are all `[P]`** — disjoint file sets, all gated only on T003.
- US2 assertion-adds T016 ‖ T017.
- US3 T021 ‖ T020.
- **Whole-story parallelism**: US3 (Phase 5) shares no files with US1/US2 and can be developed concurrently by a second developer the moment Setup is done.

---

## Parallel Example: User Story 1 swaps

```bash
# After T003 (accent inventory) lands, launch the disjoint-file swaps together:
Task: "T006 section solid-fill swaps in src/components/sections/{ContactCta,Hero,HomepageHero,NewsletterCta,FeaturedCaseStudy,ServicePillarHero,TwoColumn}.tsx"
Task: "T007 section foreground-text swaps in src/components/sections/{MetricDisplay,StatsBar,CaseStudyHero,...}.tsx"
Task: "T008 section border/divider swaps in src/components/sections/{Timeline,Deliverables,BrandTeaser,TechStack,Tabs,ServiceCards}.tsx"
Task: "T009 richText inline swaps in src/components/richText/inline/{InlineCta,QuotePullquote,TestimonialEmbed}.tsx"
Task: "T010 route-level swaps in src/app/(frontend)/{case-studies/[slug],touchstone-workshops/[slug]}/page.tsx + not-found.tsx"
Task: "T011 layout swaps in src/components/layout/{SiteHeader,MobileNav}.tsx"
Task: "T012 decorative exemptions in src/components/sections/Content.tsx + styles.css"
# Then T013 (re-capture baselines) once all of T006–T012 are merged.
```

---

## Implementation Strategy

### MVP first (US1 only)

1. Phase 1 Setup → Phase 2 Foundational (T003 inventory + T004 seeded fixture).
2. Phase 3 US1: write T005 (RED), run the T006–T012 swaps in parallel, re-capture baselines (T013), document the trap (T014).
3. **STOP and VALIDATE**: axe color-contrast clean across the seeded in-scope routes; baselines reflect green-700. This alone materially improves the site — shippable MVP.

### Incremental delivery

1. Setup + Foundational → foundation ready.
2. US1 → test independently → ship (MVP, the launch-blocking contrast defect).
3. US3 in parallel (independent files) → injected-delay test green → ship the robustness guarantee.
4. US2 → full WCAG sweep + SR deliverable → ship.
5. US4 → record the perf proof (measures the now-tuned pages) → close.
6. Polish: retire ROADMAP items to PROJECT_HISTORY; run the full gate.

### Parallel team strategy

- After Setup: Developer A takes Foundational → US1 → US2 (the a11y track, shared files/fixture); Developer B takes US3 (the reader-timeout track, disjoint files) concurrently. US4 + Polish converge once both land.

---

## Notes

- No new runtime dependency on any path (axe / Lighthouse / Playwright are devDeps) → Principle IV dep-trust review N/A; `npm audit` gate unaffected.
- No token redefinition: the brand seed `--color-accent` (green-500) stays as-is; US1 is a **per-usage** swap, never a global var remap.
- `[P]` tasks = different files, no incomplete-task dependency. Commit after each task or logical group; review the visual-baseline diff (T013) before committing.
- 007 does **not** arm the perf gate and does **not** require a formal SR sign-off — both are explicit Phase 5.5 launch-readiness steps (FR-016 / FR-010).
