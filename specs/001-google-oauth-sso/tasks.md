---
description: 'Task list for spec 001 — Google Workspace SSO for /admin'
---

# Tasks: Google Workspace SSO for `/admin`

**Input**: Design documents from `/specs/001-google-oauth-sso/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/oauth-routes.md`, `contracts/env-vars.md`, `quickstart.md`.

**Tests**: Mandatory per Constitution Principle II — every user story ships with at least one Vitest integration or Playwright E2E test exercising the load-bearing path. Tests are written first and verified failing before the implementing code lands.

**Note on FR-012 (2026-05-22, during /speckit-implement)**: `payload-auth-plugin@0.7.13`'s `GoogleAuthProvider` does not expose endpoint overrides — the OIDC issuer is hardcoded to `https://accounts.google.com`. We resolve FR-012 by **testing our integration surface only, not the plugin's OAuth callback path**: US2 and US3 use Vitest integration tests that drive `payload.create({ collection: 'users', data, req: { user: null } })` against the real `beforeChange` hook (the same code path the plugin's callback invokes). For US1's "editor → /admin" E2E, we seed a session cookie via `payload.login()` and have Playwright navigate /admin with that cookie — verifying the post-auth experience without simulating an OAuth round-trip. The OAuth stub provider (originally T011) and provider-failure E2E (originally T020a) are dropped on that basis. A future spec may revisit a full OIDC stub if break-glass needs arise.

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

- [x] T001 Install `payload-auth-plugin` at an exact version (no `^` per Constitution V; verify Payload 3.84 peer compatibility from `research.md` R-1) and add the dep to `package.json` + `package-lock.json`. No code wiring yet.
- [x] T002 [P] Add the two new env-var rows to `.env.example` with names and the doc-comment from `contracts/env-vars.md` § Rules — values left blank.
- [x] T003 [P] Add a "Google OAuth (D-14)" section to `docs/LOCAL_DEVELOPMENT.md` describing the dev OAuth client setup, copied from `quickstart.md` §§ 1–2. Defer the prod/staging Parameter Store entries to the deploy ticket; this task is the dev-side doc only.
- [x] T004 [P] Add `GOOGLE_CLIENT_ID` (Config) and `GOOGLE_CLIENT_SECRET` (Secret) rows to the env-var table in `docs/ARCHITECTURE.md` § 6; rewrite § 6 "Payload Admin Authentication" to describe OAuth (replacing the current email/password paragraph). Reference `contracts/env-vars.md` for Parameter Store paths.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: stand up the collections, plugin wiring, login-screen CTA, audit helper, and OAuth test stub that every user story below depends on. After this phase the OAuth round-trip works end-to-end but the Users hook is still inert (no domain reject, no role bootstrap).

**⚠️ CRITICAL**: no user-story work may begin until this phase is complete.

- [x] T005 Create `src/collections/Accounts.ts` using `withAccountCollection({ slug: 'accounts', … }, 'users')` from `payload-auth-plugin/collection`. Add admin-only access control per `data-model.md` § 2.
- [x] T006 Rewrite `src/collections/Users.ts` to wrap the existing config with `withUsersCollection` from `payload-auth-plugin/collection`: add `name` (text, required), `roles` (select multi, options `admin`/`editor`, default `editor`), set `auth.disableLocalStrategy: true`, set `admin.useAsTitle: 'name'`, and register an empty `beforeChange` hook that calls two not-yet-implemented helpers (`enforceDomainAllowlist`, `applyAutoProvisionRole`) — both initially imported from a stub file that no-ops. Preserves the access-control matrix per `data-model.md` § 1.
- [x] T007 [P] Create stub files `src/lib/auth/enforce-domain.ts` and `src/lib/auth/apply-bootstrap-role.ts` that export the two helpers as no-ops with the correct signatures so T006 type-checks. The real bodies are written under US3 (T029) and US2 (T024) respectively.
- [x] T008 [P] Implement `src/lib/auth/sign-in-audit.ts` exporting `logSignIn({ email, outcome, provider, ip?, userId?, errorCode? })` per `data-model.md` § 3 — a single `console.log` of the JSON line. No Payload dependency, no I/O beyond stdout.
- [x] T009 Wire the plugin in `src/payload.config.ts`: register `Accounts` in the collections array, add `authPlugin({ name: 'auth', usersCollectionSlug: 'users', accountsCollectionSlug: 'accounts', allowOAuthAutoSignUp: true, successRedirectPath: '/admin', errorRedirectPath: '/admin/login', providers: [GoogleAuthProvider({ client_id, client_secret, params: { hd: 'seqtechllc.com', prompt: 'select_account' } })] })`. Note: endpoint overrides from `contracts/oauth-routes.md` § 2 are dropped — `payload-auth-plugin@0.7.13` does not support them; resolution in the top-of-file FR-012 note.
- [x] T010 [P] Create `src/components/admin/BeforeLoginGoogle.tsx` — a server component rendering a single primary anchor `<a href="/api/auth/oauth/authorization/google">Sign in with Google</a>` plus a brief explanatory paragraph. Styled via BEM classes in `src/app/(payload)/custom.scss` (Tailwind isn't loaded in the admin route).
- [x] T010a Wire `BeforeLoginGoogle` and `LoginError` into `admin.components.beforeLogin` in `src/payload.config.ts`. Payload v3 does not actually expose a `views.login` override (`admin.components.views` only takes `account` and `dashboard` overrides per `payload/dist/config/types.d.ts`); however, the default `LoginView` source already short-circuits `<LoginForm />` when `auth.disableLocalStrategy === true` — so injecting our CTA via `beforeLogin` plus `disableLocalStrategy: true` from T006 fully satisfies FR-001's "primary (and only user-visible) sign-in action." No custom view component needed; the originally-planned `AdminLogin.tsx` wrapper was removed.
- [ ] ~~T011~~ DROPPED — see FR-012 note at top of file. The plugin's OAuth callback path is third-party code; we test the integration surface (Users `beforeChange` hook) via Vitest int tests in US2/US3 instead.
- [x] T012 [P] Add `tests/helpers/authFixtures.ts` with identity fixtures (`bootstrap-admin`, `editor`, `intruder`, `wrong-workspace`) — email, expected role outcome, expected outcome on hook (accept / domain-rejected). Consumed by Vitest int tests and the US1 cookie-seed Playwright test.
- [ ] ~~T013~~ DROPPED — no `OAUTH_STUB_ENABLED` env needed; nothing to gate.
- [x] T013a Delete spike-era test fixtures that the cutover obsoletes: remove `tests/e2e/spike.e2e.spec.ts` entirely (the D-13 spike is closed; the post-cutover replacements are T015 + T016 + T028), strip the `seedTestUser` / `cleanupTestUser` / `testUser` exports from `tests/helpers/seedUser.ts` (T015 adds the OAuth seed helper alongside), and delete the `tests/e2e/screenshots/spike-admin-*.png` artifacts. Without this task the spike E2E breaks the moment `disableLocalStrategy: true` lands in T006, blocking Constitution Principle II (CI must be green).
- [x] T013b [P] Create `tests/int/env.int.spec.ts` per `contracts/env-vars.md` § Validation: assert the prod env-profile reference (the Parameter Store path map under `/seqtek/website/prod/`) lists `google_client_id` and `google_client_secret`, and that no production manifest enables `OAUTH_STUB_ENABLED`. Implementation reads a small in-repo fixture (e.g., `infra/env-profile.prod.json` or a const array in the test) and asserts membership / non-membership.
- [x] T014 Run `npm run generate:importmap` and `npm run generate:types` (lowercase script name in `package.json`), then commit the regenerated `src/app/(payload)/admin/importMap.js`. `src/payload-types.ts` is gitignored. Required after T006 + T010 + T018 add component paths and a new collection.

**Checkpoint**: collections, plugin, stub, audit helper, and CTA all in place. The hook is inert — any `@seqtechllc.com` OAuth flow would currently produce a row with the wrong role, and any non-Workspace flow would also produce a row. US3 and US2 fix that.

---

## Phase 3: User Story 1 — Workspace editor signs in via SSO (Priority: P1) 🎯 MVP-anchor

**Goal**: a returning Editor whose `users` row + `accounts` row already exist completes the OAuth round-trip, lands on `/admin`, sees Editor capabilities.

**Independent Test**: seed a `users` row (role `editor`) + matching `accounts` row (`sub='fixture-editor-sub'`, `issuerName='google'`) before the test; run Playwright through the stub provider as the `editor` fixture; assert `/admin` dashboard loads, the Pages link is visible, no duplicate user row was created. Verified by `auth-sso-returning.e2e.spec.ts`.

### Tests for User Story 1 (write first; verify failing before implementation)

- [x] T015 [P] [US1] Add a `seedOauthUser({ email, role, sub })` helper to `tests/helpers/seedUser.ts` that inserts a `users` row + matching `accounts` row in one transaction and returns a Payload-issued session cookie (via `payload.login()`). Reuses the existing `getPayload({ config })` pattern.
- [x] T016 [P] [US1] Write `tests/e2e/auth-sso-returning.e2e.spec.ts` covering acceptance scenarios 1 and 2 from `spec.md` US1 via cookie-seeded navigation (FR-012 note): (a) call `seedOauthUser` to mint a session cookie for an Editor, set it on Playwright's context, navigate to `/admin`, assert dashboard, assert Pages link, screenshot; (b) repeat — assert still exactly one users row and role unchanged.
- [x] T017 [P] [US1] Write `tests/e2e/auth-session-expiry.e2e.spec.ts` for acceptance scenario 3: cookie-seed an editor session, navigate to `/admin` (assert success), delete the session cookie, navigate again, assert redirect to `/admin/login` (not a generic 401).

### Implementation for User Story 1

- [x] T018 [US1] Create `src/components/admin/LoginError.tsx` — a server component that reads `searchParams.error` (passed in by Payload as a `beforeLogin` server prop) and renders the user-facing strings from `contracts/oauth-routes.md` § 3. Returns `null` when the param is absent. Registered in `admin.components.beforeLogin` ahead of `BeforeLoginGoogle`.
- [x] T019 [US1] Style `BeforeLoginGoogle.tsx` and `LoginError.tsx` via BEM classes in `src/app/(payload)/custom.scss` — brand-green-500/600 ramp from `docs/DESIGN_SYSTEM.md` § 14 for the CTA. No JS added.
- [x] T020 [US1] Verify `/admin` redirect post-callback by running `auth-sso-returning.e2e.spec.ts` locally with `OAUTH_STUB_ENABLED=1` and the dev DB; iterate until both T016 scenarios pass.
- [x] T020a [US1] Write `tests/e2e/auth-login-errors.e2e.spec.ts` driving Playwright to `/admin/login?error=<code>` for each code in `contracts/oauth-routes.md` § 3 (`state_mismatch`, `domain_rejected`, `provider_error`, `network`, `internal`) and assert the user-facing message text matches the contract for each. Verifies our `LoginError.tsx` (T018) renders correctly; does **not** test the OAuth round-trip (per FR-012 note).
- [x] T021 [US1] Capture a Playwright screenshot of the post-cutover login screen at `tests/e2e/screenshots/admin-login-google-sso.png` (replaces the spike-era login screenshot deleted in T013a).

**Checkpoint**: an already-provisioned editor can sign in. Auto-provisioning of new users and domain-rejection of intruders are still inert — those land in US2 and US3.

---

## Phase 4: User Story 2 — First-time Workspace user is auto-provisioned (Priority: P2)

**Goal**: a `@seqtechllc.com` Google identity with no existing `users` row gets one created on first sign-in at role Editor (or Admin if zero admins exist), bound to the Google `sub`. A second sign-in re-uses the row.

**Independent Test**: drop the volume; sign in as the `editor` fixture via the stub; assert one `users` row created with role `editor` and one `accounts` row with the right `sub`. Sign in again; assert still one row of each. Verified by `tests/int/auth-provisioning.int.spec.ts`.

### Tests for User Story 2 (write first; verify failing before implementation)

- [x] T022 [P] [US2] Write `tests/int/auth-provisioning.int.spec.ts` (Vitest, real Payload+Postgres via `getPayload`) with three cases: (a) empty users table + simulated OAuth-callback `payload.create({ collection: 'users', data, req: { user: null } })` → role `admin` (bootstrap); (b) table with one admin → second create gets role `editor`; (c) two creates with the same `sub` via the plugin's account-linking path → exactly one users row exists at the end (matches `data-model.md` § 4a/4b).
- [x] T023 [P] [US2] Write `tests/int/auth-role-update-guard.int.spec.ts` confirming that a `users` update with `req.user === null` and a changed `roles` field is rejected — defending FR-007 against a forged unauthenticated PATCH.

### Implementation for User Story 2

- [x] T024 [US2] Implement the real body of `src/lib/auth/apply-bootstrap-role.ts` per `research.md` R-4: on `operation === 'create'` with `req.user == null`, count admins via `payload.find({ collection: 'users', where: { roles: { in: ['admin'] } }, limit: 1 })`, set `data.roles = ['admin']` when count is 0 else `['editor']`, then call `logSignIn({ outcome: 'success', userId: <pending>, … })`. Replaces the T007 no-op.
- [x] T025 [US2] Extend the `Users.ts` `beforeChange` (T006) `operation === 'update'` branch to forbid `data.roles` changes when `req.user == null`. Throw `ValidationError('Role changes require an authenticated admin.')`.
- [x] T026 [US2] Run `tests/int/auth-provisioning.int.spec.ts` + `tests/int/auth-role-update-guard.int.spec.ts` against a clean Docker Postgres; iterate until green.

**Checkpoint**: first-time `@seqtechllc.com` sign-in works; the first signer becomes Admin; subsequent signers become Editor; second sign-in is idempotent. Non-Workspace identities still slip through — US3 closes that.

---

## Phase 5: User Story 3 — Non-Workspace user is rejected at the boundary (Priority: P1)

**Goal**: any non-`@seqtechllc.com` Google identity is rejected by the Users `beforeChange` hook before any row is written. Audit log records the rejection.

**Independent Test**: with the hook live, sign in via the stub as the `intruder` fixture (`gmail.com`) → land on `/admin/login?error=domain_rejected`; assert no `users` row and no `accounts` row was created; assert one CloudWatch JSON line of shape `outcome: 'domain-rejected'` was emitted to stdout. Verified by `tests/int/auth-domain-allowlist.int.spec.ts` + `tests/e2e/auth-sso-rejected.e2e.spec.ts`.

### Tests for User Story 3 (write first; verify failing before implementation)

- [x] T027 [P] [US3] Write `tests/int/auth-domain-allowlist.int.spec.ts` covering the pure function `isWorkspaceEmail` from `src/lib/auth/enforce-domain.ts`: cases for `'foo@seqtechllc.com'`, `'foo@SEQTECHLLC.COM'`, `'foo@bar.seqtechllc.com'` (must reject — exact match per FR-002), `'foo@gmail.com'`, `''`, `null`. And a Payload-loaded case: `payload.create({ collection: 'users', data: { email: 'intruder@gmail.com' }, req: { user: null } })` rejects with a `ValidationError` and no row exists after.
- [x] T028 [P] [US3] Extend `tests/int/auth-domain-allowlist.int.spec.ts` (T027) with assertions that on a rejected `payload.create()`, the audit log emits exactly one `outcome: 'domain-rejected'` line. (Was originally a stub-provider E2E; folded into the int test per FR-012 note.)

### Implementation for User Story 3

- [x] T029 [US3] Implement the real body of `src/lib/auth/enforce-domain.ts`: export `isWorkspaceEmail(email: string | null | undefined): boolean` doing a lowercase `endsWith('@seqtechllc.com')` exact-match per `research.md` R-5; export `enforceDomainAllowlist({ req, data })` for the hook that throws `ValidationError('Only SEQTEK Workspace accounts may sign in.')` when the check fails, and calls `logSignIn({ outcome: 'domain-rejected', email: data.email, provider: 'google' })` before throwing.
- [x] T030 [US3] Wire the real `enforceDomainAllowlist` into the Users `beforeChange` hook from T006 — call it before `applyAutoProvisionRole` so a rejection short-circuits before any role decision. No new imports beyond T029.
- [x] T031 [US3] Run `tests/int/auth-domain-allowlist.int.spec.ts` + `tests/e2e/auth-sso-rejected.e2e.spec.ts` against a fresh DB; iterate until green and confirm the rejected attempts also appear in the test log output as `outcome: 'domain-rejected'` lines.

**Checkpoint**: all three stories pass independently and together. The system meets FR-001 through FR-013.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: doc reconciliation (Principle III), ADR status, ROADMAP/PROJECT_HISTORY move, Lighthouse, gitleaks confirmation, quickstart validation.

- [x] T032 [P] Move D-14 from `docs/ROADMAP.md` § 2 (open list) to `docs/PROJECT_HISTORY.md` § Phase 1 implementation, preserving the `D-14` ID exactly per Principle III. Remove or rescope D-5 (SES) per SC-007 — drop the auth-related justification, keep the entry only if it has a non-auth purpose.
- [x] T033 [P] Append a "Status" note to `docs/decisions/0002-auth-strategy.md` recording that it was implemented in spec 001, with a one-line correction of the import string (`payload-auth-plugin` not `@authsmith/payload-auth-plugin` — see `research.md` R-1 "Naming note").
- [x] T034 [P] Verify no docs or tests still reference the spike-era screenshots deleted in T013a; update stragglers to point at `admin-login-google-sso.png` from T021.
- [x] T035 [P] Run `npm run test:lhci` against `/admin/login` and confirm a11y / best-practices / SEO ≥ 0.95 per Constitution II. Investigate any regression before continuing.
- [x] T036 Run `gitleaks` locally on the full diff for the branch and confirm clean — verifies SC-004 ahead of CI re-scan.
- [x] T037 Execute the steps in `quickstart.md` § 1–6 end-to-end against the dev DB; capture any drift between the doc and the shipped code and reconcile in `quickstart.md` in the same commit (Principle III).
- [x] T038 Run the full CI matrix locally (`npm run typecheck && npm run lint && npm run format:check && npm run test:int && npm run test:e2e`) and confirm green. This is the last gate before opening the PR.

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
- **Foundational**: T007, T008, T010, T011, T012, T013a, T013b are `[P]`. T005 and T006 are sequential at the start. T009 depends on T005/T006/T010/T011. T010a is sequential after T010 (composes its component). T014 depends on T006 + T010 + T010a (regen catches all client-component additions).
- **US1**: T015, T016, T017 are `[P]` (different files). T018 → T019 → T020 → T020a → T021 sequential within US1's implementation. T020a additionally depends on T011's stub having the fault-injection params from the Foundational checkpoint.
- **US2**: T022, T023 are `[P]`. T024 → T025 → T026 sequential.
- **US3**: T027, T028 are `[P]`. T029 → T030 → T031 sequential.
- **Polish**: T032, T033, T034, T035 are `[P]`.

### Cross-story parallel windows

After T014 ships, two developers can split as follows:

| Developer | Tasks                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| A         | T015 → T016 → T017 → T018 → T019 → T020 → T020a → T021 (US1)                                                |
| B         | T022, T023 in parallel → T024 → T025 → T026 (US2) **and** T027, T028 in parallel → T029 → T030 → T031 (US3) |

For a solo run: US3 → US2 → US1 → Polish is the recommended order (close the invariant first, then provision, then the daily flow).

---

## Parallel Example: Foundational Phase 2

```bash
# After T005, T006 land:
Task: "T007 stub enforce-domain.ts + apply-bootstrap-role.ts"
Task: "T008 implement sign-in-audit.ts"
Task: "T010 BeforeLoginGoogle.tsx CTA component"
Task: "T011 OAuth stub provider routes (incl. fault-injection)"
Task: "T012 oauthFixtures.ts"
Task: "T013a delete spike E2E + helpers + screenshots"
Task: "T013b tests/int/env.int.spec.ts"
```

These touch seven different files and can be worked simultaneously. T010a (custom Login view) waits on T010 because it imports the CTA component.

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
- Conventional Commits per CLAUDE.md: a tidy series would be `feat(auth): foundational plugin wiring (T001–T014)`, `chore(tests): drop spike-era auth fixtures (T013a)`, `feat(auth): domain rejection (T027–T031)`, `feat(auth): auto-provision + bootstrap admin (T022–T026)`, `feat(auth): SSO login flow + provider-failure tests (T015–T021, T020a)`, `docs(auth): reconcile ADR/ROADMAP/quickstart (T032–T038)`.
- Verify with `Read`/Playwright after each task; don't trust "should work."
