# Implementation Plan: Google Workspace SSO for `/admin`

**Branch**: `001-google-oauth-sso` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-google-oauth-sso/spec.md`

## Summary

Replace Payload's email/password admin auth with Google OAuth (OIDC) restricted to the
`@seqtechllc.com` Google Workspace tenant, satisfying ROADMAP D-14 and the Phase 1
decision in ADR 0002. Implementation uses `payload-auth-plugin` (the npm package by
@authsmith referenced in ADR 0002) configured with `GoogleAuthProvider`, the local
strategy disabled on the `users` collection, and a domain-allowlist check executed in a
Users `beforeChange` hook so the first non-Workspace identity never gets persisted. The
plugin's `accounts` companion collection holds the stable Google `sub` claim, satisfying
the "match by subject ID, not by email" invariant (FR-006). A "first user becomes Admin"
bootstrap rule runs once against the fresh `users` table from cutover (Clarifications
2026-05-21 Q2), avoiding env vars, manual SQL, and admin-of-the-admin chicken-and-egg.

## Technical Context

**Language/Version**: TypeScript 5.7 (`strict`, no `any`), Node ≥ 22 (project `engines.node`).

**Primary Dependencies**: Next.js 16.2 + React 19.2 (App Router); Payload CMS 3.84
(`payload`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`,
`@payloadcms/ui`); **new:** `payload-auth-plugin` (Google OAuth/OIDC + Accounts
collection). No `@payloadcms/email-nodemailer` — we are not adding SMTP for password
flows (ADR 0002 §Consequences; SC-007).

**Storage**: Postgres 16 via `@payloadcms/db-postgres`. Two collections touched: `users`
(extended with `name` + `roles`) and the new `accounts` collection (one-to-many → users,
holds Google `sub`, `issuerName`, tokens). Payload auto-generates the schema; one
auto-generated migration captures the change.

**Testing**: Vitest 4 (integration; real Payload+Postgres via `getPayload({ config })`
in `tests/int/`) and Playwright 1.58 (E2E in `tests/e2e/`, drives the admin UI). OAuth
flows in CI are exercised against a stub provider (a local route that mints fixture
ID tokens) rather than calling Google — keeps tests hermetic and avoids a real Google
account per CI run, per FR-012.

**Target Platform**: Server — Next.js running in Docker on EC2 behind ALB/CloudFront,
fronted by `src/proxy.ts` (CSP nonce). Local dev: `next dev --port 3100` against Docker
Compose Postgres on `:5433`. Admin SPA is the only client surface affected.

**Project Type**: Single Next.js + Payload monorepo. App-Router route groups
`src/app/(frontend)` and `src/app/(payload)`. No new top-level project.

**Performance Goals**: SSO end-to-end (click → admin dashboard) ≤ 10 s wall-clock on
typical broadband (SC-002). Aggregate p95 OAuth callback handling under 500 ms
server-side (Google round-trip + DB write); not a hard gate.

**Constraints**:

- No new secrets in git (Constitution IV; SC-004).
- Token TTL stays at Payload default of 7200 s / 2 h (Clarifications 2026-05-21 Q1)
  — `tokenExpiration` is left unset, not lowered, not raised.
- Domain restriction `seqtechllc.com` is exact-match; no subdomains, no aliased
  domains (FR-002).
- CSP `script-src` already permits Payload admin via nonce + `strict-dynamic` — OAuth
  redirects are top-level navigations (not XHR) so no CSP additions required.
- ARCHITECTURE.md §6 ("Payload Admin Authentication" + Env Variables table) MUST be
  updated in this same PR (Principle III).

**Scale/Scope**: ~5–10 admin user records lifetime (per Assumptions). Sign-in volume
is < 200 events/day even at peak. No performance optimization required.

## Constitution Check

_GATE: Pass required before Phase 0; re-checked after Phase 1._

| Principle                                        | Status | Evidence                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Spec Before Code**                          | ✅     | Spec at `specs/001-google-oauth-sso/spec.md`; references ARCHITECTURE.md §6, ADR 0002, ROADMAP §2 D-14 by section/ID rather than re-deriving. Two clarifications captured (Session 2026-05-21).                                                                                                                                                                                                                       |
| **II. Tests Gate Merge**                         | ✅     | Each of US1/US2/US3 ships with at least one Playwright E2E (drives the SSO button against the stub provider) **or** Vitest integration test (Users-hook auto-provision + domain rejection). Lighthouse a11y/best-practices/SEO gate from day one on `/admin/login`. No coverage gate added.                                                                                                                           |
| **III. Docs Are Code**                           | ✅     | Same PR updates: ARCHITECTURE.md §6 (auth + env-var rows), `docs/LOCAL_DEVELOPMENT.md` (Google OAuth client setup for dev), `.env.example` (new keys, no values), `CLAUDE.md` SPECKIT pointer, ROADMAP D-14 → PROJECT_HISTORY P1 entry, ADR 0002 status note. SES (D-5) reference dropped per SC-007.                                                                                                                 |
| **IV. Security Baseline**                        | ✅     | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` sourced from Parameter Store in staging/prod (per ARCHITECTURE.md §6 env table), `.env.local` in dev; never committed. Gitleaks pre-commit + CI re-scan enforced. No `--no-verify`. CSP unchanged. No new third-party scripts on public pages.                                                                                                                            |
| **V. Bleeding-Edge Stack, Pinned and Defensive** | ✅     | `payload-auth-plugin` peer-compatibility verified against Payload 3.84 in Phase 0 research; exact version pinned in `package.json` (no `^` on this single load-bearing dep until 90 days post-cutover). Migration path documented: if it stalls or breaks against a Payload minor bump, fallback is a custom `auth.strategies` implementation (~50 LOC against `google-auth-library`), explicitly listed in ADR 0002. |

**Result**: 5/5 gates pass. **Complexity Tracking** section is intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-google-oauth-sso/
├── spec.md              # /speckit-specify + /speckit-clarify output (existing)
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output — plugin selection, bootstrap-admin, OAuth mocking
├── data-model.md        # Phase 1 output — Users + Accounts schemas, state transitions
├── quickstart.md        # Phase 1 output — local dev setup (Google OAuth client, .env.local)
├── contracts/
│   ├── oauth-routes.md  # Plugin-exposed REST endpoints and admin-side redirects
│   └── env-vars.md      # New env var contract (added rows for ARCHITECTURE.md §6)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (frontend)/                        # untouched
│   └── (payload)/
│       └── admin/
│           └── importMap.js               # regenerated after adding plugin client components
├── collections/
│   ├── Users.ts                           # extended: roles select, name, disableLocalStrategy, beforeChange hook (domain + bootstrap-admin)
│   ├── Accounts.ts                        # NEW: wraps `withAccountCollection`, ties to 'users'
│   ├── Media.ts                           # untouched
│   └── Pages.ts                           # untouched
├── components/
│   └── admin/
│       └── BeforeLoginGoogle.tsx          # NEW: "Sign in with Google" CTA injected into /admin/login via admin.components.beforeLogin
├── lib/
│   └── auth/
│       ├── domain-allowlist.ts            # NEW: pure fn — isWorkspaceEmail(email): boolean
│       └── sign-in-audit.ts               # NEW: structured log helper → CloudWatch (FR-011)
├── payload.config.ts                      # +authPlugin({ name: 'auth', providers: [GoogleAuthProvider(...)], allowOAuthAutoSignUp: true, successRedirectPath: '/admin', errorRedirectPath: '/admin/login?error=...' })
└── proxy.ts                               # untouched

tests/
├── int/
│   ├── api.int.spec.ts                    # existing
│   └── auth.int.spec.ts                   # NEW: Users beforeChange — domain reject, auto-provision, bootstrap-admin, Google-sub matching (no duplicate)
└── e2e/
    ├── auth-sso.e2e.spec.ts               # NEW: drives /admin via stub OAuth provider; covers US1, US2, US3 acceptance scenarios + token-expiry redirect
    └── helpers/
        └── stubOauthProvider.ts           # NEW: in-process route that mocks Google authorize+token+userinfo for tests (used in lieu of real Google in CI)

.env.example                               # +GOOGLE_CLIENT_ID, +GOOGLE_CLIENT_SECRET (names only, no values)
docs/
├── ARCHITECTURE.md                        # §6 "Payload Admin Authentication" rewritten; env-var table gains 2 rows
├── LOCAL_DEVELOPMENT.md                   # +Google OAuth client setup section for dev
├── ROADMAP.md                             # D-14 removed from open list (moved to history)
├── PROJECT_HISTORY.md                     # new P1 entry preserving the D-14 ID
└── decisions/0002-auth-strategy.md        # +Status note: implemented in spec 001
```

**Structure Decision**: Single project (the existing Next.js + Payload app). No new
modules or packages introduced. All additions land under `src/collections/`,
`src/components/admin/`, `src/lib/auth/`, and `tests/{int,e2e}/` — following the
folder conventions already established by the spike (D-13).

## Complexity Tracking

> Not applicable — Constitution Check passes with no violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _none_    | —          | —                                    |
