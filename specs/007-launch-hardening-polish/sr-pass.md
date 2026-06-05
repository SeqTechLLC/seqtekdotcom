# Screen-Reader Test Script + Best-Effort Pass (US2 / T019)

**Spec:** 007 · **Contract:** `contracts/a11y-perf-acceptance.md` C-3 (FR-010, SC-004)

**Scope note (per the 2026-06-05 clarification):** 007 ships (1) this per-route SR **test script** and (2) a **recorded best-effort pass**. The **formal, blocking SR sign-off** across the full AT/browser matrix is a **Phase 5.5 launch-readiness gate**, _not_ a 007 merge-gate. Findings owned by our markup are fixed in 007 (T018); findings in Payload admin chrome or third-party embeds are triaged out with a recorded rationale.

---

## 1. Test script (run per in-scope route)

In-scope routes (seeded — see `tests/e2e/helpers/seedInScopeRoutes.ts`): `/`, `/team`, `/case-studies` + `/case-studies/<slug>`, `/insights` + `/insights/<slug>`, `/services` + `/services/<pillar>` + `/services/<pillar>/<slug>`, `/touchstone-workshops` + `/touchstone-workshops/<slug>`, `/privacy-policy`, `/about`, `/localshoring`.

For each route, with the screen reader running:

### 1a. Landmark walk

- Pull up the landmarks/regions rotor. Confirm exactly: one `banner` (header), one `navigation` ("Primary"), one `main`, one `contentinfo` (footer). No orphan/duplicate `main`.
- "Skip to main content" is the first focusable; activating it moves focus into `main`.

### 1b. Heading walk

- Pull up the headings rotor. Confirm a single `h1` that names the page, and that levels never jump down by more than one (no `h1 → h3`). Listing-page cards read at `h2` (the page `h1`'s children); section-composed blocks read `h2` section → `h3` card.
- Headings read as a coherent outline of the page (a blind user could navigate by them alone).

### 1c. Control-by-control accessible-name check

- Tab through every interactive control in order. Each must announce a meaningful name + role (no "link", "button" with no label; no raw URL as the only name).
- Specifically verify: primary/secondary CTAs, nav links + the mobile menu trigger ("Open menu") / close ("Close menu"), `<details>`/`<summary>` FAQ + accordion toggles (announce expanded/collapsed state natively — the ▾ glyph must NOT be separately announced), form fields on the workshop/contact surfaces (label + state), the footer consent-preferences control.
- Images: meaningful images announce descriptive alt; decorative images (the `bg-accent/5` wash, bullet dots) are silent.

### 1d. Keyboard + focus

- Every control reachable by Tab, visible focus ring at each stop, logical order, no keyboard trap. The mobile-nav `<dialog>` traps focus while open and `Esc` closes it, returning focus to the trigger.

### 1e. Reduced motion

- With OS "reduce motion" on, no non-essential animation plays (the global `prefers-reduced-motion` reset collapses transitions to ~1ms).

---

## 2. Recorded best-effort pass (2026-06-05)

### 2a. Automated layer (executed, green)

The automatable portions of the script above are encoded in `tests/e2e/a11y.e2e.spec.ts` and **pass across all 14 in-scope routes** (49/49 a11y+US3 assertions green, 2026-06-05):

- **axe WCAG 2.2 A/AA = zero violations** on every in-scope route — this includes the accessible-name family (`link-name`, `button-name`, `image-alt`, `aria-*-name`, `label`) and `color-contrast`. So §1c "every control has an accessible name" and §1c image-alt are machine-verified.
- **Landmarks** (§1a): one `<main>`, header/nav/footer present, on every route.
- **Heading order** (§1b): no downward level skips on any route (verified after the listing-grid `headingLevel="h2"` fix).
- **Keyboard/focus** (§1d): first-Tab reaches the skip link with a visible 2px `:focus-visible` outline; Tab advances through distinct controls with no single-element trap (homepage).
- **Reduced motion** (§1e): with `prefers-reduced-motion: reduce` emulated, surviving transition durations are the 1ms floor.

### 2b. Manual AT pairings (pending human operator → Phase 5.5)

The following require a human driving a real screen reader and are recorded here as **best-effort / not yet executed in this environment** (no AT host available to the implementing agent). They are the Phase 5.5 formal-sign-off matrix:

| Pairing                        | Status    | Notes                                                                                                 |
| ------------------------------ | --------- | ----------------------------------------------------------------------------------------------------- |
| VoiceOver + Safari (macOS/iOS) | ☐ pending | Run §1a–§1e per route. Expect green given the automated layer; record any rotor/announcement nuances. |
| NVDA + Firefox (Windows)       | ☐ pending | As above.                                                                                             |
| Orca + Firefox (Linux)         | ☐ pending | Acceptable substitute for the NVDA pairing per the contract.                                          |

**Triaged out (recorded rationale):** `/admin` Payload chrome keeps its own critical/serious-only policy (`tests/a11y/adminAuthoring.e2e.spec.ts`); SR findings originating in admin/third-party-embed markup are not counted against our content and are logged for upstream, not fixed in 007.

### 2c. Code-owned findings fixed in this spec (T018)

- Listing/grid card headings jumped `h1 → h3` (page `h1` + grid `h3` cards, no intervening `h2`). Fixed by a `headingLevel` prop on `TeamGrid`/`CaseStudyGrid`/`PostList`/`WorkshopList`/`ServiceCards`/`ServicePillarCards`, with the listing/pillar pages passing `headingLevel="h2"`. Visual size unchanged (kept the `text-h4`/`text-h3` class), semantic level corrected.

**Definition of done for 007 (met):** script exists (§1), automated best-effort pass is green (§2a), code-owned findings fixed (§2c), human-AT matrix scoped for Phase 5.5 (§2b). The formal blocking sign-off is explicitly Phase 5.5.
