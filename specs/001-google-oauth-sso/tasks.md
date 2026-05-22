---
description: 'Task list for spec 001 — Google Workspace SSO for /admin'
---

# Tasks: Google Workspace SSO for `/admin`

**Input**: Design documents from `/specs/001-google-oauth-sso/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/oauth-routes.md`, `contracts/env-vars.md`, `quickstart.md`.

**Tests**: Mandatory per Constitution Principle II — every user story ships with at least one Vitest integration or Playwright E2E test exercising the load-bearing path. Tests are written first and verified failing before the implementing code lands.

**Organization**: Phases mirror the user stories in `spec.md`. Within each story, tests precede implementation. File paths are absolute-from-repo-root. Tasks marked `[P]` touch a different file from every other `[P]` task in the same phase and have no in-phase ordering constraint.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different file, no in-phase predecessor)
- **[Story]**: which user story (US1, US2, US3) — omitted in Setup, Foundational, and Polish
- Each task description names the exact file(s) it touches.

## Path Conventions

Single project — Next.js + Payload at repo root. Code under `src/`, tests under `tests/`, design docs under `docs/`. See `plan.md` § "Project Structure" for the file layout this feature adds or modifies.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: install the new dependency and document the new env vars so every later phase has the package and the documented configuration surface in place.

- [ ] T001 Install `payload-auth-plugin` at an exact version (no `^` per Constitution V; verify Payload 3.84 peer compatibility from `research.md` R-1) and add the dep to `package.json` + `package-lock.json`. No code wiring yet.
- [ ] T002 [P] Add the two new env-var rows to `.env.example` with names and the doc-comment from `contracts/env-vars.md` § Rules — values left blank.
- [ ] T003 [P] Add a "Google OAuth (D-14)" section to `docs/LOCAL_DEVELOPMENT.md` describing the dev OAuth client setup, copied from `quickstart.md` §§ 1–2. Defer the prod/staging Parameter Store entries to the deploy ticket; this task is the dev-side doc only.
- [ ] T004 [P] Add `GOOGLE_CLIENT_ID` (Config) and `GOOGLE_CLIENT_SECRET` (Secret) rows to the env-var table in `docs/ARCHITECTURE.md` § 6; rewrite § 6 "Payload Admin Authentication" to describe OAuth (replacing the current email/password paragraph). Reference `contracts/env-vars.md` for Parameter Store paths.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: stand up the collections, plugin wiring, login-screen CTA, audit helper, and OAuth test stub that every user story below depends on. After this phase the OAuth round-trip works end-to-end but the Users hook is still inert (no domain reject, no role bootstrap).

**⚠️ CRITICAL**: no user-story work may begin until this phase is complete.

- [ ] T005 Create `src/collections/Accounts.ts` using `withAccountCollection({ slug: 'accounts', … }, 'users')` from `payload-auth-plugin/collection`. Add admin-only access control per `data-model.md` § 2.
- [ ] T006 Rewrite `src/collections/Users.ts` to wrap the existing config with `withUsersCollection` from `payload-auth-plugin/collection`: add `name` (text, required), `roles` (select multi, options `admin`/`editor`, default `editor`), set `auth.disableLocalStrategy: true`, set `admin.useAsTitle: 'name'`, and register an empty `beforeChange` hook that calls two not-yet-implemented helpers (`enforceDomainAllowlist`, `applyAutoProvisionRole`) — both initially imported from a stub file that no-ops. Preserves the access-control matrix per `data-model.md` § 1.
- [ ] T007 [P] Create stub files `src/lib/auth/enforce-domain.ts` and `src/lib/auth/apply-bootstrap-role.ts` that export the two helpers as no-ops with the correct signatures so T006 type-checks. The real bodies are written under US3 (T029) and US2 (T024) respectively.
- [ ] T008 [P] Implement `src/lib/auth/sign-in-audit.ts` exporting `logSignIn({ email, outcome, provider, ip?, userId?, errorCode? })` per `data-model.md` § 3 — a single `console.log` of the JSON line. No Payload dependency, no I/O beyond stdout.
- [ ] T009 Wire the plugin in `src/payload.config.ts`: register `Accounts` in the collections array, add `authPlugin({ name: 'seqtek', usersCollectionSlug: 'users', accountsCollectionSlug: 'accounts', allowOAuthAutoSignUp: true, successRedirectPath: '/admin', errorRedirectPath: '/admin/login', providers: [GoogleAuthProvider({ … })] })` exactly per `contracts/oauth-routes.md` § 2 including the `OAUTH_STUB_ENABLED` ternaries on the three endpoint overrides.
- [ ] T010 [P] Create `src/components/admin/BeforeLoginGoogle.tsx` — a server component rendering a single primary anchor `<a href="/api/seqtek/oauth/authorize/google">Sign in with Google</a>` plus a brief explanatory paragraph. No client JS. Add `admin.components.beforeLogin: ['/components/admin/BeforeLoginGoogle']` to the Payload admin config in `src/payload.config.ts`.
- [ ] T011 [P] Create the test-only OAuth stub provider at `src/app/(payload)/admin/api/test/oauth/google/[...slug]/route.ts` (or a sibling path under `/api/test/oauth/google/`) implementing the three handlers (`authorize`, `token`, `userinfo`) per `contracts/oauth-routes.md` § 5. Routes throw at module load unless `process.env.OAUTH_STUB_ENABLED === '1'` so prod/staging builds tree-shake them away.
- [ ] T012 [P] Add `tests/e2e/helpers/oauthFixtures.ts` with the four fixture identities from `contracts/oauth-routes.md` § 5 (`bootstrap-admin`, `editor`, `intruder`, `wrong-workspace`). Pure data export; consumed by the stub route and by E2E tests.
- [ ] T013 Update `playwright.config.ts` `webServer.env` to set `OAUTH_STUB_ENABLED=1` so the stub routes are live for the E2E run. No other Playwright config changes.
- [ ] T014 Run `npm run generate:importMap` and `npm run generate:types`, then commit the regenerated `src/app/(payload)/admin/importMap.js` and `src/payload-types.ts`. (Required after T006 + T010 add a client-component path and a new collection.)

**Checkpoint**: collections, plugin, stub, audit helper, and CTA all in place. The hook is inert — any `@seqtechllc.com` OAuth flow would currently produce a row with the wrong role, and any non-Workspace flow would also produce a row. US3 and US2 fix that.

---

## Phase 3: User Story 1 — Workspace editor signs in via SSO (Priority: P1) 🎯 MVP-anchor

**Goal**: a returning Editor whose `users` row + `accounts` row already exist completes the OAuth round-trip, lands on `/admin`, sees Editor capabilities.

**Independent Test**: seed a `users` row (role `editor`) + matching `accounts` row (`sub='fixture-editor-sub'`, `issuerName='google'`) before the test; run Playwright through the stub provider as the `editor` fixture; assert `/admin` dashboard loads, the Pages link is visible, no duplicate user row was created. Verified by `auth-sso-returning.e2e.spec.ts`.

### Tests for User Story 1 (write first; verify failing before implementation)

- [ ] T015 [P] [US1] Add a `seedOauthUser({ email, role, sub })` helper to `tests/helpers/seedUser.ts` that inserts a `users` row and a matching `accounts` row in one transaction. Reuses the existing `getPayload({ config })` pattern.
- [ ] T016 [P] [US1] Write `tests/e2e/auth-sso-returning.e2e.spec.ts` covering acceptance scenarios 1 and 2 from `spec.md` US1: (a) seeded editor signs in via stub → land on `/admin`, screenshot, assert Pages link, assert exactly one users row; (b) sign in a second time → still one users row, still role `editor`.
- [ ] T017 [P] [US1] Write `tests/e2e/auth-session-expiry.e2e.spec.ts` covering acceptance scenario 3 (token expiry → redirect to entry screen, not 401). Simulate expiry by deleting the session cookie mid-test rather than waiting 2 h.

### Implementation for User Story 1

- [ ] T018 [US1] Create `src/app/(payload)/admin/login/page.tsx` (or extend whatever Payload renders at `/admin/login` via an `error` server component) to read `searchParams.error` and render the user-facing strings from `contracts/oauth-routes.md` § 3. Renders nothing when no error is present so the default login chrome (with the `beforeLogin` CTA) remains the primary view.
- [ ] T019 [US1] Confirm `BeforeLoginGoogle.tsx` (from T010) styles the CTA as the visually-dominant primary action — Tailwind classes for size, weight, and the SEQTEK accent color from `docs/DESIGN_SYSTEM.md` § 14. No JS added.
- [ ] T020 [US1] Verify `/admin` redirect post-callback by running `auth-sso-returning.e2e.spec.ts` locally with `OAUTH_STUB_ENABLED=1` and the dev DB; iterate until both T016 scenarios pass.
- [ ] T021 [US1] Capture a Playwright screenshot of the post-cutover login screen at `tests/e2e/screenshots/admin-login-google-sso.png` (replaces the spike-era `spike-admin-login.png` in the next polish task).

**Checkpoint**: an already-provisioned editor can sign in. Auto-provisioning of new users and domain-rejection of intruders are still inert — those land in US2 and US3.

---

## Phase 4: User Story 2 — First-time Workspace user is auto-provisioned (Priority: P2)

**Goal**: a `@seqtechllc.com` Google identity with no existing `users` row gets one created on first sign-in at role Editor (or Admin if zero admins exist), bound to the Google `sub`. A second sign-in re-uses the row.

**Independent Test**: drop the volume; sign in as the `editor` fixture via the stub; assert one `users` row created with role `editor` and one `accounts` row with the right `sub`. Sign in again; assert still one row of each. Verified by `tests/int/auth-provisioning.int.spec.ts`.

### Tests for User Story 2 (write first; verify failing before implementation)

- [ ] T022 [P] [US2] Write `tests/int/auth-provisioning.int.spec.ts` (Vitest, real Payload+Postgres via `getPayload`) with three cases: (a) empty users table + simulated OAuth-callback `payload.create({ collection: 'users', data, req: { user: null } })` → role `admin` (bootstrap); (b) table with one admin → second create gets role `editor`; (c) two creates with the same `sub` via the plugin's account-linking path → exactly one users row exists at the end (matches `data-model.md` § 4a/4b).
- [ ] T023 [P] [US2] Write `tests/int/auth-role-update-guard.int.spec.ts` confirming that a `users` update with `req.user === null` and a changed `roles` field is rejected — defending FR-007 against a forged unauthenticated PATCH.

### Implementation for User Story 2

- [ ] T024 [US2] Implement the real body of `src/lib/auth/apply-bootstrap-role.ts` per `research.md` R-4: on `operation === 'create'` with `req.user == null`, count admins via `payload.find({ collection: 'users', where: { roles: { in: ['admin'] } }, limit: 1 })`, set `data.roles = ['admin']` when count is 0 else `['editor']`, then call `logSignIn({ outcome: 'success', userId: <pending>, … })`. Replaces the T007 no-op.
- [ ] T025 [US2] Extend the `Users.ts` `beforeChange` (T006) `operation === 'update'` branch to forbid `data.roles` changes when `req.user == null`. Throw `ValidationError('Role changes require an authenticated admin.')`.
- [ ] T026 [US2] Run `tests/int/auth-provisioning.int.spec.ts` + `tests/int/auth-role-update-guard.int.spec.ts` against a clean Docker Postgres; iterate until green.

**Checkpoint**: first-time `@seqtechllc.com` sign-in works; the first signer becomes Admin; subsequent signers become Editor; second sign-in is idempotent. Non-Workspace identities still slip through — US3 closes that.

---

## Phase 5: User Story 3 — Non-Workspace user is rejected at the boundary (Priority: P1)

**Goal**: any non-`@seqtechllc.com` Google identity is rejected by the Users `beforeChange` hook before any row is written. Audit log records the rejection.

**Independent Test**: with the hook live, sign in via the stub as the `intruder` fixture (`gmail.com`) → land on `/admin/login?error=domain_rejected`; assert no `users` row and no `accounts` row was created; assert one CloudWatch JSON line of shape `outcome: 'domain-rejected'` was emitted to stdout. Verified by `tests/int/auth-domain-allowlist.int.spec.ts` + `tests/e2e/auth-sso-rejected.e2e.spec.ts`.

### Tests for User Story 3 (write first; verify failing before implementation)

- [ ] T027 [P] [US3] Write `tests/int/auth-domain-allowlist.int.spec.ts` covering the pure function `isWorkspaceEmail` from `src/lib/auth/enforce-domain.ts`: cases for `'foo@seqtechllc.com'`, `'foo@SEQTECHLLC.COM'`, `'foo@bar.seqtechllc.com'` (must reject — exact match per FR-002), `'foo@gmail.com'`, `''`, `null`. And a Payload-loaded case: `payload.create({ collection: 'users', data: { email: 'intruder@gmail.com' }, req: { user: null } })` rejects with a `ValidationError` and no row exists after.
- [ ] T028 [P] [US3] Write `tests/e2e/auth-sso-rejected.e2e.spec.ts`: stub-provider flow as the `intruder` and `wrong-workspace` fixtures both land on `/admin/login?error=domain_rejected`, the user-facing message matches `contracts/oauth-routes.md` § 3, and no rows are persisted.

### Implementation for User Story 3

- [ ] T029 [US3] Implement the real body of `src/lib/auth/enforce-domain.ts`: export `isWorkspaceEmail(email: string | null | undefined): boolean` doing a lowercase `endsWith('@seqtechllc.com')` exact-match per `research.md` R-5; export `enforceDomainAllowlist({ req, data })` for the hook that throws `ValidationError('Only SEQTEK Workspace accounts may sign in.')` when the check fails, and calls `logSignIn({ outcome: 'domain-rejected', email: data.email, provider: 'google' })` before throwing.
- [ ] T030 [US3] Wire the real `enforceDomainAllowlist` into the Users `beforeChange` hook from T006 — call it before `applyAutoProvisionRole` so a rejection short-circuits before any role decision. No new imports beyond T029.
- [ ] T031 [US3] Run `tests/int/auth-domain-allowlist.int.spec.ts` + `tests/e2e/auth-sso-rejected.e2e.spec.ts` against a fresh DB; iterate until green and confirm the rejected attempts also appear in the test log output as `outcome: 'domain-rejected'` lines.

**Checkpoint**: all three stories pass independently and together. The system meets FR-001 through FR-013.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: doc reconciliation (Principle III), ADR status, ROADMAP/PROJECT_HISTORY move, Lighthouse, gitleaks confirmation, quickstart validation.

- [ ] T032 [P] Move D-14 from `docs/ROADMAP.md` § 2 (open list) to `docs/PROJECT_HISTORY.md` § Phase 1 implementation, preserving the `D-14` ID exactly per Principle III. Remove or rescope D-5 (SES) per SC-007 — drop the auth-related justification, keep the entry only if it has a non-auth purpose.
- [ ] T033 [P] Append a "Status" note to `docs/decisions/0002-auth-strategy.md` recording that it was implemented in spec 001, with a one-line correction of the import string (`payload-auth-plugin` not `@authsmith/payload-auth-plugin` — see `research.md` R-1 "Naming note").
- [ ] T034 [P] Delete the spike-era login screenshot `tests/e2e/screenshots/spike-admin-login.png` and update any test or doc reference to point at the new `admin-login-google-sso.png` from T021.
- [ ] T035 [P] Run `npm run test:lhci` against `/admin/login` and confirm a11y / best-practices / SEO ≥ 0.95 per Constitution II. Investigate any regression before continuing.
- [ ] T036 Run `gitleaks` locally on the full diff for the branch and confirm clean — verifies SC-004 ahead of CI re-scan.
- [ ] T037 Execute the steps in `quickstart.md` § 1–6 end-to-end against the dev DB; capture any drift between the doc and the shipped code and reconcile in `quickstart.md` in the same commit (Principle III).
- [ ] T038 Run the full CI matrix locally (`npm run typecheck && npm run lint && npm run format:check && npm run test:int && npm run test:e2e`) and confirm green. This is the last gate before opening the PR.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 Setup**: no predecessors.
- **Phase 2 Foundational**: requires Phase 1.
- **Phase 3 US1**: requires Phase 2 _and_ the auto-provision logic from US2 (T024) for the seeded-user happy path to function end-to-end. In practice US2 ships at the same time as US1.
- **Phase 4 US2**: requires Phase 2.
- **Phase 5 US3**: requires Phase 2. Strongly recommended before US1 ships publicly because it is the load-bearing invariant (`spec.md` US3 §Why this priority).
- **Phase 6 Polish**: requires Phases 1–5.

### User-story dependencies

- **US1 (P1)** — depends on US2 (auto-provision) and US3 (domain rejection) to be deploy-safe. Its E2E tests are independent because they seed their own user.
- **US2 (P2)** — independent of US1/US3 at the test level. Code touches `apply-bootstrap-role.ts`; no overlap with US3's `enforce-domain.ts`.
- **US3 (P1)** — independent of US1/US2 at the test level. Owns `enforce-domain.ts`.

The three stories are deliberately decomposed by file under `src/lib/auth/` so that US2 and US3 implementation tasks (T024, T029) touch disjoint files and can be worked in parallel.

### Within each user story

- Tests written and verified failing before implementation lands (Constitution II + template guidance).
- Lib helpers before hook integration before Payload-level tests.

### Parallel opportunities

- **Setup**: T002, T003, T004 are all `[P]`.
- **Foundational**: T007, T008, T010, T011, T012 are `[P]`. T005 and T006 are sequential at the start (they unblock T014's regen). T009 depends on T005/T006/T010/T011 (it imports all of them).
- **US1**: T015, T016, T017 are `[P]` (different files). T018 → T019 → T020 → T021 sequential within US1's implementation.
- **US2**: T022, T023 are `[P]`. T024 → T025 → T026 sequential.
- **US3**: T027, T028 are `[P]`. T029 → T030 → T031 sequential.
- **Polish**: T032, T033, T034, T035 are `[P]`.

### Cross-story parallel windows

After T014 ships, two developers can split as follows:

| Developer | Tasks                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| A         | T015 → T016 → T017 → T018 → T019 → T020 → T021 (US1)                                                        |
| B         | T022, T023 in parallel → T024 → T025 → T026 (US2) **and** T027, T028 in parallel → T029 → T030 → T031 (US3) |

For a solo run: US3 → US2 → US1 → Polish is the recommended order (close the invariant first, then provision, then the daily flow).

---

## Parallel Example: Foundational Phase 2

```bash
# After T005, T006 land:
Task: "T007 stub enforce-domain.ts + apply-bootstrap-role.ts"
Task: "T008 implement sign-in-audit.ts"
Task: "T010 BeforeLoginGoogle.tsx + admin.components.beforeLogin wiring"
Task: "T011 OAuth stub provider routes"
Task: "T012 oauthFixtures.ts"
```

These five tasks touch five different files and can be worked simultaneously.

---

## Implementation Strategy

### MVP-first (the minimum shippable to satisfy ROADMAP D-14)

The MVP for this feature is **all three user stories together** — see Dependencies above. There is no honest sub-MVP that leaves either US3 (invariant) or US2 (provisioning) out:

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 5 US3 (invariant first)
4. Phase 4 US2 (provisioning)
5. Phase 3 US1 (login UI + happy path)
6. Phase 6 Polish

### Incremental review checkpoints

Even when shipped as one PR, intermediate checkpoints exist for code review:

- After T014 — Foundational green-CI build (auth wiring without enforcement).
- After T031 — feature-complete, before docs polish.
- After T038 — PR-ready.

### Parallel team strategy

Two developers can split as in "Cross-story parallel windows" above. A reviewer cycles through checkpoints rather than reviewing one giant diff.

---

## Notes

- `[P]` strictly means "different file and no in-phase predecessor." Cross-phase parallelism is governed by the Dependencies section.
- The bootstrap-Admin race (two near-simultaneous first-sign-ins both seeing zero admins) is intentionally untested — `research.md` R-4 accepts the failure mode for the 5–10 user population.
- No SES, no transactional email, no password flows anywhere in this task list — `PasswordProvider` is not registered and the `nodemailer` adapter is not installed (per ADR 0002 + SC-007).
- Conventional Commits per CLAUDE.md: a tidy series would be `feat(auth): foundational plugin wiring (T001–T014)`, `feat(auth): domain rejection (T027–T031)`, `feat(auth): auto-provision + bootstrap admin (T022–T026)`, `feat(auth): SSO login flow (T015–T021)`, `docs(auth): reconcile ADR/ROADMAP/quickstart (T032–T038)`.
- Verify with `Read`/Playwright after each task; don't trust "should work."
