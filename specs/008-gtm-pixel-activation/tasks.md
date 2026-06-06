---
description: 'Task list for GTM Pixel Activation'
---

# Tasks: GTM Pixel Activation

**Input**: Design documents from `/specs/008-gtm-pixel-activation/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Per constitution Principle II, every user story ships with a load-bearing test. This feature has a **documented carve-out** (plan.md Constitution Check II): only **US3** (dataLayer events) is CI-testable and ships a Playwright E2E written-first. **US1** (live container fire-matrix), **US2** (export/drift diff), and **US4** (CAPI decision) are config/decision deliverables whose "test" is **manual staging verification / re-export diff / doc review** — not CI-automatable, mirroring spec 006's gated tail. The CI-provable substrate (consent gating) is already green from spec 006's `consent-flows.e2e.spec.ts`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files/artifacts, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Web-UI tasks cite the GTM container (`GTM-54KBJ2Z3`) and the captured artifact / runbook as their "path"

## Gated-tail legend

Per plan.md "Phasing & gated tail", tasks fall into three lanes:

- **Mergeable now (code + docs):** all of US3 + US4 + their doc updates + the `infra/gtm/README.md` update — no external dependency.
- **External-config tail (verify, don't block merge):** 🔶 marked tasks — the GTM-UI build, the container export, and the staging fire-matrix. Gated only on doing the web-UI work + a staging deploy (no longer on a missing container ID).
- **Deferred (other tracks):** the 8 Meta browser tags' live triggers (need per-market landing routes) and `booking_complete` live emission (needs the real Meetings embed). Staged/seam-only here.

---

## Phase 1: Setup (Shared Preconditions)

**Purpose**: Confirm the external access and the in-repo patterns this feature composes against (no new project scaffolding — the app, container, and consent foundation already exist).

- [ ] T001 Confirm preconditions for the GTM-UI work: admin access to container `GTM-54KBJ2Z3`, access to the Google Ads (`AW-810041431`) and LinkedIn (partner `3952964`, Justine's ad account) accounts, and that `NEXT_PUBLIC_GTM_ID=GTM-54KBJ2Z3` is set for staging — cross-check against `docs/INTEGRATIONS.md` §2.3 and `.env.example`
- [x] T002 [P] Review the existing consent foundation (`src/components/integrations/GtmScript.tsx`, `src/components/integrations/ConsentDefault.tsx`, `src/lib/csp.ts`) and the `pushDataLayer` pattern in `src/lib/hubspot/submit.ts`; confirm it is reused **unchanged** (FR-012) so US1 mirrors its consent defaults and US3 generalizes its emitter faithfully — no code change

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Container-level consent scaffolding that the live tags (US1) and the committed export (US2) both bind to / capture.

**⚠️ Scope note**: Phase 2 blocks **US1 and US2 only**. US3 (code) and US4 (docs) have **no Phase-2 dependency** and may start immediately in parallel with this phase.

- [ ] T003 🔶 Confirm the container Consent Mode default (governance G1) in `GTM-54KBJ2Z3`: `analytics_storage` / `ad_storage` / `ad_user_data` / `ad_personalization` = denied, `functionality_storage` = granted, "Wait for update" on — mirroring `src/components/integrations/ConsentDefault.tsx` (belt-and-suspenders to the authoritative inline default). Capture into `infra/gtm/container.json` at export time (US2)
- [ ] T004 🔶 Create the `hubspotConsentUpdate` Custom Event trigger (governance G2) in `GTM-54KBJ2Z3` using the exact event-name string emitted by `ConsentDefault.tsx`; this is the trigger the live tags re-evaluate on (research R1)

**Checkpoint**: Consent default + consent trigger exist in the container — US1 tags can now bind to them, and US2's export will capture them.

---

## Phase 3: User Story 1 - Consent-gated site-wide conversion tracking (Priority: P1) 🎯 MVP

**Goal**: The LinkedIn Insight Tag and Google Ads conversion tag fire on existing pages only after advertising consent is granted, and never under Deny — the core compliance path.

**Independent Test**: In GTM Preview/Debug on staging, run accept-all / deny-all / customize / returning-visitor on an existing page and confirm tag fire/hold matches the consent state, corroborated by the Network tab (no advertising host under Deny).

### Implementation for User Story 1 (GTM web UI — captured to `infra/gtm/container.json` in US2)

- [ ] T005 🔶 [US1] Build the **LinkedIn Insight Tag** (partner `3952964`) in `GTM-54KBJ2Z3`: set "Require additional consent for tag to fire" = `ad_storage` (G3); trigger = Page View paired with the `hubspotConsentUpdate` Custom Event (T004). Per `contracts/gtm-activation.md` A1 + `quickstart.md` §2.3 (FR-001/FR-002/FR-004)
- [ ] T006 🔶 [US1] Build the **Google Ads conversion tag** (`AW-810041431`) in `GTM-54KBJ2Z3`: "Require additional consent for tag to fire" = `ad_storage` (G3); trigger = Page View + the `hubspotConsentUpdate` Custom Event (T004). Per `contracts/gtm-activation.md` A1 (FR-001/FR-004)
- [ ] T007 🔶 [US1] Handle the 8 Meta Pixel browser tags per FR-011 / A2: either omit them, or stage them in `GTM-54KBJ2Z3` with **no bound live trigger** and a label "pending per-market landing routes — content track". Do **NOT** wire the `/…casestudyworkshop` path triggers (the routes don't exist; an unbound/mis-bound Meta tag firing on an unintended page is the Deny/Network leak this guards against)
- [ ] T008 🔶 [US1] Deploy the container to staging `seqtek-preview.com` with `NEXT_PUBLIC_GTM_ID=GTM-54KBJ2Z3` set, so the fire-matrix can run against live consent flows

### Verification for User Story 1 (manual staging — the mandatory independent test, per the carve-out)

- [ ] T009 🔶 [US1] Run the staging **fire-matrix** (`quickstart.md` §3 / `contracts/gtm-activation.md` A3 / governance G4) via GTM Preview/Debug + browser Network tab across **Accept all / Deny all / Customize (analytics-on, ads-off) / Returning visitor**: confirm LinkedIn + Google Ads fire after the consent `update` on Accept, are held on Customize, and **emit no advertising-host request on Deny**. Capture Tag Assistant screenshots + a Deny-flow Network HAR and attach the results to the verification record under `specs/008-gtm-pixel-activation/` (FR-003/FR-005/FR-010; satisfies SC-001/SC-002/SC-003/SC-007)

**Checkpoint**: Consent-gated site-wide conversion tracking is live and verified on staging — MVP delivered. Meta rows remain N/A (deferred).

---

## Phase 4: User Story 2 - Versioned, reviewable container configuration (Priority: P2)

**Goal**: The live container is captured to a committed, diff-able, rollback-able file with a documented export-on-change convention.

**Independent Test**: Export the live container, confirm the committed `infra/gtm/container.json` matches; make a trivial change, re-export, confirm the diff is meaningful and reviewable.

**Dependency**: Export (T010) reflects the US1 container config (T005–T007) + Phase-2 scaffolding (T003/T004), so it follows US1. The README update (T011) is independent of export content.

### Implementation for User Story 2

- [ ] T010 🔶 [US2] Export the live container (GTM **Admin → Export Container**, the full `containerVersion` JSON) and commit it **verbatim** over `infra/gtm/container.json` — the first real export of `GTM-54KBJ2Z3`, replacing the `TBD` posture (FR-006; A5/G5; research R4). No transform/redaction (no credentials in a GTM export)
- [x] T011 [P] [US2] Update `infra/gtm/README.md`: container ID `TBD` → `GTM-54KBJ2Z3`; add the Meta-deferral note + the live-vs-deferred tag scope (LinkedIn/Google Ads live; 8 Meta staged); re-affirm the **export-on-change convention** (export → save over the file → commit `feat(gtm):`/`chore(gtm):` on the same change); record the per-market Meta URL triggers from INTEGRATIONS.md §2.3 as a **documented TODO** for the content track (FR-007; FR-011 doc side; A5)

### Verification for User Story 2 (re-export diff — the independent test)

- [ ] T012 🔶 [US2] Re-export the container and diff against the committed `infra/gtm/container.json`; confirm **zero drift** and record the result (SC-004)

**Checkpoint**: The container is version-controlled, reviewable, and provably drift-free.

---

## Phase 5: User Story 3 - Complete conversion-signal surface (Priority: P2)

**Goal**: The dataLayer emits `cta_click`, `case_study_view`, and `booking_complete` (seam) alongside the existing `form_submission_*`, via one SSR-safe typed emitter — so GTM triggers build on stable events, not DOM scraping.

**Independent Test**: Drive each interaction (click a CTA, view a case study) and confirm the corresponding event with its documented payload appears on `window.dataLayer` / GTM Preview. (`booking_complete` is seam-only — no live assertion until the Meetings embed exists.)

**Note**: This is the **mergeable-now code increment** — no GTM-UI or staging dependency. Can start in parallel with Phase 2/3.

### Tests for User Story 3 (MANDATORY — per constitution Principle II) ⚠️

> **Write these FIRST and verify they FAIL before the implementation tasks (T015–T019) turn them green.** With only the helper present and no emitters, the CTA click / case-study view produce no push → red.

- [x] T013 [P] [US3] Write the E2E test `tests/e2e/datalayer-events.e2e.spec.ts`: clicking a primary CTA pushes **exactly one** `cta_click` with `event` + `ctaId` present; navigating to `/case-studies/<slug>` pushes **exactly one** `case_study_view` with the correct `slug`. Reuse `tests/e2e/helpers/consent.ts` patterns and the `revalidateDevCache` helper if the test depends on seeded case-study content (contracts D1/D2; quickstart §1)
- [x] T014 [P] [US3] Add an integration test in `tests/int/` asserting `pushDataLayer` is **SSR-safe** (no-op when `window` is undefined) and produces the documented shapes for the new event union (INV-1, INV-4)

### Implementation for User Story 3

- [x] T015 [US3] Create `src/lib/analytics/dataLayer.ts`: the SSR-safe `pushDataLayer()` (`typeof window === 'undefined'` guard), the **single** `Window.dataLayer` global declaration, and the typed event union (`cta_click`, `case_study_view`, `booking_complete`) generalizing the proven `src/lib/hubspot/submit.ts` pattern (research R3; data-model §A; INV-1/INV-2)
- [x] T016 [P] [US3] Refactor `src/lib/hubspot/submit.ts` to import `pushDataLayer` + the `Window.dataLayer` declaration from `src/lib/analytics/dataLayer.ts` (remove its local copy so there is **one** SSR guard / **one** global declaration); keep the `form_submission_*` event shapes **unchanged** (INV-3) (depends on T015)
- [x] T017 [P] [US3] Emit `cta_click` from the CTA surfaces — `src/components/ui/Button.tsx` (when rendered as a CTA), `src/components/sections/CtaSection.tsx`, `src/components/sections/ContactCta.tsx`, `src/components/richText/inline/InlineCta.tsx` — via a client `onClick`, **non-blocking** (never delay/swallow navigation), payload `{ event, ctaId, label, location, href? }` (contract D1; FR-008) (depends on T015)
- [x] T018 [P] [US3] Add a `'use client'` `<TrackView slug title/>` island and emit `case_study_view` **once on mount** (not on client re-render) from `src/app/(frontend)/case-studies/[slug]/page.tsx`, sourcing `slug`/`title` from the already-loaded document (contract D2; FR-008) (depends on T015)
- [x] T019 [P] [US3] Define the `booking_complete` listener **seam** in `src/components/sections/HubspotMeetings.tsx` (HubSpot Meetings `onMeetingBookSucceeded` cross-window `message` → `pushDataLayer({ event: 'booking_complete', meetingUrl })`); emission stays **gated** on the real Meetings embed (placeholder today) and is documented as deferred (contract D3) (depends on T015)
- [x] T020 [US3] Run `npm run test:e2e -- datalayer-events` (and `npm run test:int -- dataLayer`) and make T013/T014 **green** (depends on T015–T018)

### Docs for User Story 3

- [x] T021 [P] [US3] Document the three new events (payloads + Live/seam status) in `docs/INTEGRATIONS.md` §2.4, consistent with `specs/008-gtm-pixel-activation/contracts/datalayer-events.md` and `data-model.md` §A (FR-008 documented-payload; constitution III)

**Checkpoint**: The conversion-signal surface is complete, tested, and documented; `booking_complete` is a reviewable seam awaiting the embed.

---

## Phase 6: User Story 4 - Server-side CAPI consent posture decided and recorded (Priority: P2)

**Goal**: A written, auditable answer to whether the six CAPI-fed Meta datasets continue post-launch, where consent is enforced if they do, and who owns any enforcement work.

**Independent Test**: A reviewer can determine the CAPI post-launch posture and its enforcement owner from `docs/INTEGRATIONS.md` alone, without asking a person.

**Note**: Mergeable-now documentation deliverable — no code, no GTM-UI dependency.

### Implementation for User Story 4

- [x] T022 [US4] Record the CAPI decision in `docs/INTEGRATIONS.md` §2.3: whether the six CAPI-fed Meta datasets continue post-launch and the rationale; if continuing, that consent is enforced **at the CAPI source (off-site)** with a named owner/action; if stopping, the cutoff and who actions it. Resolve the open question (does the new site even feed CAPI post-cutover?) per research R2 / `contracts/gtm-activation.md` A4 (FR-009)
- [x] T023 [US4] Confirm the §2.3 decision is self-contained (posture + enforcement point + owner all present) so the SC-006 doc-review test passes; link the deferral from the relevant ROADMAP item

**Checkpoint**: The CAPI consent gap is on the record with an owner — no silent "yes, it keeps running".

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Bookkeeping and whole-feature validation across all stories.

- [x] T024 [P] On merge, move the relevant `docs/ROADMAP.md` item to `docs/PROJECT_HISTORY.md` (preserve the ID; don't checkbox-flip), leaving the Meta-trigger, CAPI-enforcement, and `booking_complete`-emission deferrals as **open items** pointing at their gating tracks (constitution III; quickstart §4) — _ROADMAP block added recording US3/US4 shipped + the four open items (US1/US2 external tail, Meta triggers, CAPI enforcement, booking_complete emission); the PROJECT_HISTORY move is deferred until the full feature lands (external verification tail still open), so nothing is prematurely flipped to done._
- [ ] T025 Run the full `specs/008-gtm-pixel-activation/quickstart.md` validation (§1 events, §2 export, §3 fire-matrix) and confirm SC-001…SC-007 are each satisfied or explicitly deferred (Meta rows N/A) — _§1 (events) DONE: `datalayer-events.e2e.spec.ts` + `dataLayer.int.spec.ts` green (SC covered for the dataLayer surface). §2 (export) + §3 (fire-matrix) are the external-config tail (SC-001/002/003/004/007) — gated on GTM-UI work + staging deploy; SC-006 (CAPI doc review) DONE via §2.3._
- [x] T026 [P] Run `npm run lint`, `npm run typecheck`, and the full test suite; confirm CI is green (the consent-gating substrate is already covered by spec 006's `consent-flows.e2e.spec.ts`) — _lint clean (4 pre-existing migration warnings, 0 errors), typecheck clean; `dataLayer` + `hubspot-submit` int green, `datalayer-events` + `a11y` (14/14) + `layout` E2E green. The consent/CSP/best-practices specs are env-gated locally (real `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` in `.env.local`) and gate in CI with IDs unset — my change touches neither the consent bridge, CSP, nor the loaders._

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup. **Blocks US1 + US2 only** (not US3/US4).
- **US1 (Phase 3, P1)**: Depends on Phase 2. The MVP.
- **US2 (Phase 4, P2)**: Export (T010) depends on US1's container config (T005–T007); README (T011) is independent.
- **US3 (Phase 5, P2)**: **No dependency on Phase 2/3/4** — pure code, can run fully in parallel.
- **US4 (Phase 6, P2)**: **No dependency on any other phase** — pure docs, can run fully in parallel.
- **Polish (Phase 7)**: Depends on the stories being shipped that it bookkeeps/validates.

### User Story Dependencies

- **US1 (P1)** → needs Phase 2 (consent default + trigger). No dependency on other stories.
- **US2 (P2)** → export depends on US1's container build; otherwise independent.
- **US3 (P2)** → fully independent (mergeable-now code).
- **US4 (P2)** → fully independent (mergeable-now docs).

### Within US3

- T013/T014 (tests) written FIRST and FAIL → T015 (shared emitter) → T016/T017/T018/T019 (emitters, parallel) → T020 (green).

### Parallel Opportunities

- T002 (Setup) runs alongside T001.
- **US3 and US4 can start at t=0**, in parallel with the GTM-UI track (Phases 2–4) — different files, no shared artifact.
- Within US3 after T015: T016, T017, T018, T019, T021 are all `[P]` (distinct files).
- US3 tests T013/T014 are `[P]` with each other.
- Polish T024/T026 are `[P]`.

---

## Parallel Example: User Story 3 (the mergeable-now code track)

```bash
# 1. Tests first (must FAIL):
Task: "E2E datalayer-events in tests/e2e/datalayer-events.e2e.spec.ts"   # T013
Task: "Int SSR-safety test for pushDataLayer in tests/int/"             # T014

# 2. Shared emitter (blocks the emitters):
Task: "Create src/lib/analytics/dataLayer.ts"                           # T015

# 3. Emitters in parallel (distinct files):
Task: "Refactor src/lib/hubspot/submit.ts to import the shared emitter" # T016
Task: "Emit cta_click from the 4 CTA surfaces"                          # T017
Task: "case_study_view <TrackView/> island in case-studies/[slug]"     # T018
Task: "booking_complete seam in HubspotMeetings.tsx"                    # T019
Task: "Document events in docs/INTEGRATIONS.md §2.4"                    # T021
```

---

## Implementation Strategy

### Two tracks, run concurrently

This feature is "almost entirely external config + documentation + a small dataLayer increment" (plan Summary). The two tracks have **no shared artifact** and should run in parallel:

1. **Code/doc track (mergeable now):** US3 (`dataLayer.ts` + emitters + E2E) + US4 (CAPI decision) + the `infra/gtm/README.md` update. Lands via PR without waiting on anything external.
2. **GTM-UI + verification track (external-config tail — 🔶):** Phase 2 scaffolding → US1 tag build → staging deploy → fire-matrix (T009) → US2 export + drift diff. Gated on doing the web-UI work + a staging deploy, not on code review.

### MVP (compliance core)

The P1 MVP is **US1** — consent-gated LinkedIn + Google Ads on existing pages, proven by the staging fire-matrix. Shipping just US1 delivers a working, compliant, demonstrable conversion-tracking setup (spec US1 "Why this priority"). US2 protects it (versioning), US3 enriches its triggers (signals), US4 closes the off-site consent gap (CAPI).

### Out of scope (do not task)

- The 8 Meta browser tags' **live triggers** — deferred to the per-market landing-page/content track (FR-011); staged-without-trigger here.
- `booking_complete` **live emission** — gated on the real HubSpot Meetings embed (seam only here).
- **ScoreApp** landing page / `assessment_start`, and the **contact-form HubSpot GUID** wiring (FR-013).

---

## Notes

- 🔶 = external-config tail: verify on staging, do not block the code/doc PR.
- `[P]` = different files/artifacts, no incomplete-task dependency.
- `[Story]` labels (US1–US4) map tasks to spec.md user stories for traceability.
- The consent foundation (loader, consent default, `_hsp` bridge, CSP) is **reused unchanged** (FR-012) — no task re-implements it.
- Commit the container export and the README update in the **same** change (`feat(gtm):`) per the export-on-change convention.
