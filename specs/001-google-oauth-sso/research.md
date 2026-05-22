# Phase 0 Research — Google Workspace SSO for `/admin`

**Feature**: 001-google-oauth-sso · **Date**: 2026-05-21 · **Status**: complete

Each entry below resolves a question that was either marked "NEEDS CLARIFICATION" by the
plan template or surfaced while scoping the implementation. Decisions referenced inline
by other artifacts (`plan.md`, `data-model.md`, `contracts/*.md`, `quickstart.md`).

---

## R-1 — OAuth plugin selection: `payload-auth-plugin` (by @authsmith)

**Decision**: Adopt `payload-auth-plugin` (npm), authored by the GitHub org `authsmith`.
Pin the exact version in `package.json` (no `^`).

**Rationale**:

- ADR 0002 §Decision pre-selected this plugin; Phase 0's job is to confirm fit, not
  re-evaluate.
- Verified peer-compatibility against Payload 3.84 in Context7 v3.84.0 docs — plugin
  exposes `authPlugin({ name, providers, usersCollectionSlug, accountsCollectionSlug,
allowOAuthAutoSignUp, successRedirectPath, errorRedirectPath })`, registers all
  endpoints under `/api/{name}/...`, and ships `withUsersCollection` /
  `withAccountCollection` helpers compatible with Payload v3's `CollectionConfig` shape.
- `GoogleAuthProvider({ client_id, client_secret })` is OIDC-backed — returns a
  verified `sub` claim suitable for FR-006 (match by stable subject ID).
- Plugin's `accounts` collection holds `sub` + `issuerName` per identity, naturally
  satisfying the "Google account email change must not duplicate users" requirement
  without extra schema work.

**Naming note**: ADR 0002 calls the dependency `@authsmith/payload-auth-plugin`. The
published npm name is `payload-auth-plugin` (unscoped); `@authsmith` is the GitHub org.
We will import from `payload-auth-plugin` and add a one-line correction to ADR 0002 in
the same PR. Behaviour is identical; only the import string changes.

**Alternatives considered**:

- **`@payloadcms/email-nodemailer` + custom `auth.strategies`** — ~50 LOC against
  `google-auth-library`; gives full control. Rejected here because the plugin already
  ships the Accounts collection, error redirects, and session refresh endpoints —
  three things the spec requires that we'd otherwise reinvent.
- **`payload-authjs`** — wraps Auth.js v5. Strictly more moving parts than 5–10
  editors need (per ADR 0002 §Options).
- **`payload-oauth2`** — only 2 documented code examples in Context7; insufficient
  surface area for confidence on a load-bearing dep.

**Revisit when**: plugin goes ≥ 6 months without updates, or fails against a Payload
minor bump. Fallback is the custom `auth.strategies` route above; ADR 0002 already
sanctions it.

---

## R-2 — Disabling Payload's local strategy

**Decision**: Set `auth.disableLocalStrategy: true` on the `users` collection. Do
**not** delete the email field (the plugin's `withUsersCollection` adds it back
anyway, and Google's email is the human-readable identifier in the admin UI).

**Rationale**: Confirmed against Payload v3.84 docs — `disableLocalStrategy: true`
removes the email/password endpoint from `/api/users/login` entirely. With the
strategy off, FR-004 is satisfied at the framework level: no password is _ever_
accepted, even if a user URL-guesses the local-login endpoint. The plugin still
authenticates via its own `/api/seqtek/session/*` cookie path.

**Edge**: The default Payload admin login UI at `/admin/login` will still try to
POST to `/api/users/login` if a user types into the form. With `disableLocalStrategy`
on, that returns an error. We mitigate this UX dead-end by injecting a prominent
"Sign in with Google" CTA via `admin.components.beforeLogin` (the most discoverable
extension point per Payload v3 docs), so the email/password form is visually
de-emphasised even when present. Hiding the form entirely would require overriding
`admin.components.views.login` and re-implementing it; not worth the maintenance
debt for 5–10 editors. The spec is satisfied: SSO is the _only viable_ path
(FR-001/FR-004), not necessarily the only visible widget.

**Alternatives considered**: Replacing `views.login` outright was rejected for the
maintenance-debt reason above.

---

## R-3 — Token lifetime / cookie / session

**Decision**: Leave `tokenExpiration` unset on the `users` collection — Payload's
default is 7200 seconds (2 h), which matches Clarifications 2026-05-21 Q1 exactly.
Leave `cookies` defaulted (`sameSite: 'Lax'`, `secure` derived from `serverURL`
protocol).

**Rationale**: Setting a value we'd then have to keep in sync with the doc is
strictly worse than relying on the framework default. ARCHITECTURE.md §6 will state
"Payload default: 2 h" so readers don't have to grep the codebase. Workspace
deprovisioning lag of up to 2 h was accepted in clarification Q1 for a 5–10 person
staff.

---

## R-4 — Bootstrap-Admin strategy

**Decision**: A `beforeChange` hook on `users` ("first user becomes Admin") plus a
Postgres unique partial index to make the race tractable.

**Logic** (in `src/collections/Users.ts`):

```text
beforeChange (operation === 'create'):
  1. If req.user is set → respect req.data.role (an existing Admin is promoting).
  2. If req.user is null (OAuth auto-provision path):
       - Count users with role='admin'.
       - If count === 0 → set role='admin' (bootstrap).
       - Else            → set role='editor' (default for OAuth provisioning).
```

**Index**: `CREATE UNIQUE INDEX users_admin_singleton ON users ((role = 'admin'))
WHERE role = 'admin';` is **not** added — it would forbid multiple admins, which is
not what we want. The race window (two concurrent first-sign-ins, both seeing
"0 admins exist") is acknowledged but accepted:

- The user population is 5–10 staff (Assumption: ADR 0002).
- Worst-case outcome of the race is "both early users land as Admin"; demoting one
  is a one-click op in the existing admin UI (FR-008).
- The mechanism only runs against a fresh `users` table (Clarification Q2). It is a
  _one-time_ concern, not an ongoing failure mode.

**Rationale for rejecting alternatives**:

- **One-shot `BOOTSTRAP_ADMIN_EMAIL` env var** — requires deploying a value, then
  redeploying to remove it. Adds a Parameter-Store entry whose only purpose is to be
  deleted later. Anti-pattern: env-var state for a one-time action.
- **Manual `psql` UPDATE** — requires DB access on cutover day; trades shell access
  for a Parameter Store entry, no real improvement.
- **Designate first signer by hostname / IP** — fragile, not testable.

**Test coverage**: `tests/int/auth.int.spec.ts` exercises both branches (empty table
→ Admin; non-empty → Editor) and an idempotency check (second OAuth sign-in by the
bootstrap admin keeps role=admin).

---

## R-5 — Domain restriction enforcement

**Decision**: Enforce `email.endsWith('@seqtechllc.com')` in a `beforeChange` hook on
`users` (`operation === 'create'`) — rejects via `throw new ValidationError(...)`
before any row is written. Pair with `params: { hd: 'seqtechllc.com' }` passed to
Google's authorize endpoint via `GoogleAuthProvider({ params: { hd, prompt:
'select_account' } })` so most non-Workspace users never even see the consent screen.

**Rationale**:

- The `hd` parameter on Google's authorize URL hints to Google to filter — but it is
  client-side and trivially bypassable. The server-side `beforeChange` hook is the
  load-bearing check (FR-003).
- The pure function `isWorkspaceEmail(email)` in `src/lib/auth/domain-allowlist.ts`
  is unit-testable (Vitest, no Payload bootstrapping required) and reused by the
  audit logger.
- Exact-match per FR-002: case-insensitive `endsWith('@seqtechllc.com')` after
  lowercasing the email. No `.seqtechllc.com` subdomains, no aliases. If multi-domain
  ever surfaces, it becomes its own spec (Assumption).

**Audit log shape** (FR-011, R-6 below): a rejected sign-in attempt is logged before
the throw, so it surfaces in CloudWatch the same as a successful one.

---

## R-6 — Sign-in audit logging

**Decision**: Plain `console.log` of a structured JSON line with shape
`{ event: 'admin_sign_in', email, ts, outcome, provider, ip? }`. AWS CloudWatch's
container-logs agent already ingests stdout from the EC2 Docker container per
ARCHITECTURE.md §6.1 (Container Strategy). No Payload collection is added.

**Rationale**:

- The spec explicitly notes audit entries are "persisted in CloudWatch logs (not
  necessarily a Payload collection)" — see Key Entities §Sign-in Audit Entry.
- Adding a Payload collection would require access-control rules, admin UI, and a
  growing table; CloudWatch already exists, has retention rules, and is queryable
  via CloudWatch Insights.
- The helper `src/lib/auth/sign-in-audit.ts` exposes one function: `logSignIn({
email, outcome, provider, ip? })`. Called from (a) the Users `beforeChange` hook
  on both reject and accept paths, and (b) the plugin's `errorRedirectPath` landing
  if we expose it via a tiny `/admin/login` interstitial server component (optional —
  fallback is to rely on the in-hook log alone).

---

## R-7 — Playwright OAuth mocking for CI

**Decision**: Implement a tiny in-process stub OAuth provider as a Next.js API
route enabled only when `OAUTH_STUB_ENABLED=1` (set by `playwright.config.ts`).
Route shape:

```text
GET  /api/test/oauth/google/authorize?...  → 302 → /api/seqtek/oauth/callback/google?code=...
GET  /api/test/oauth/google/token          → JSON id_token + access_token (fixture-signed JWT)
GET  /api/test/oauth/google/userinfo       → JSON { sub, email, hd, name, ... }
```

The stub is wired into the plugin by overriding `GoogleAuthProvider({
authorization_endpoint, token_endpoint, userinfo_endpoint })` _only_ when
`OAUTH_STUB_ENABLED=1`. In dev and prod those endpoints fall back to plugin defaults
(Google's real endpoints).

**Rationale**:

- FR-012 mandates headless-test SSO without hitting Google.
- Playwright drives a real browser through a real plugin flow; the only swap is
  _where the OAuth provider lives_. This catches integration bugs that mocking the
  plugin client would hide.
- Fixture identities (`editor@seqtechllc.com`, `intruder@gmail.com`, etc.) are
  parameterised on the stub query string so one stub route services all test cases.

**Security**: The stub is gated by an env flag that is _never set in production_
(verified by a tiny CI assertion that the prod env profile omits it). The stub
route itself is registered behind the same `OAUTH_STUB_ENABLED` check, so even if
the env flag leaks the route is absent from the build.

**Alternatives considered**:

- **Record-and-replay against real Google** — adds OAuth-client management, fixture
  rotation, and a token that gets stale.
- **Mock `AuthClient` at the JS layer** — bypasses the plugin entirely, defeating
  the point of an E2E test.

---

## R-8 — Env var loading and `.env.example`

**Decision**: Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to:

1. `.env.example` (committed — names + comments only, no values).
2. ARCHITECTURE.md §6 env-var table (two new rows; both Server scope; one Config,
   one **Secret**).
3. `docs/LOCAL_DEVELOPMENT.md` (new section: "Setting up a Google OAuth client for
   local dev" with redirect URI `http://localhost:3100/api/seqtek/oauth/callback/google`).

In staging and production the values are sourced from AWS Systems Manager Parameter
Store via the EC2 instance profile (ARCHITECTURE.md §6 already documents this chain
for the existing `PAYLOAD_SECRET` / `DATABASE_URL`).

**Rationale**: Mirrors the established secrets pattern. No new infrastructure;
`GOOGLE_CLIENT_SECRET` is `SecureString` in Parameter Store, the launch template's
user-data script already exports Parameter Store values into the container
environment.

**Validation**: SC-004 (gitleaks pre-commit + CI) catches anything that escapes.
`.env.example` lists the names only, marked with `# secret — set via Parameter Store
in prod/staging, .env.local in dev`.

---

## R-9 — Custom admin login UI

**Decision**: Inject `<BeforeLoginGoogle />` via `admin.components.beforeLogin`,
which renders a single primary button above the (now-non-functional) email/password
form. The button is a plain `<a href="/api/seqtek/oauth/authorize/google">` — no
client JS needed; the plugin handles the rest.

**Rationale**: FR-001 requires SSO as the _primary_ action. An anchor link with a
visually-dominant style satisfies "primary action" without rebuilding the login view.
React Server Component compatible (no hooks, no state). Lighthouse-clean (single
anchor, no JS).

---

## Open items deferred to `/speckit-tasks`

- Concrete naming of the plugin instance — currently planned as `name: 'seqtek'`,
  which yields URLs like `/api/seqtek/oauth/callback/google`. Final spelling is a
  task-time micro-decision.
- Exact wording of the user-facing error message on `/admin/login?error=...` — needs
  a one-line review against `docs/BRAND_STRATEGY_RESEARCH.md` voice (no em-dashes per
  feedback memory).
- Whether to add a maintenance toggle that re-enables local strategy for break-glass
  — explicitly **out of scope** per spec Assumptions (recovery is DB-level).
