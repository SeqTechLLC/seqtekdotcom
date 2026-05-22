# Feature Specification: Google Workspace SSO for `/admin`

**Feature Branch**: `001-google-oauth-sso`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "D-14 Google OAuth SSO for /admin via @authsmith/payload-auth-plugin, restricted to the @seqtechllc.com Google Workspace domain. Replaces email/password as the primary admin auth. See ROADMAP §2 D-14, ADR 0002 (docs/decisions/0002-auth-strategy.md), and ARCHITECTURE.md §6 for context"

## Clarifications

### Session 2026-05-21

- Q: Session/token TTL for admin sign-ins → A: Keep Payload defaults (2h JWT TTL, matching cookie). Workspace deprovisioning lag of up to 2h is acceptable for a 5–10-person staff; tighten only if a real incident demands it.
- Q: How does the spike-era admin record migrate to OAuth? → A: No migration. Cutover happens against a fresh `users` table — the spike-era `kenn` row is discarded along with any spike-era authored content. Bootstrap of the first Admin is a one-time deploy concern, deferred to /speckit-plan.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Workspace editor signs in via Google SSO (Priority: P1)

A SEQTEK content editor opens `/admin` to publish or edit content. They are not currently signed in. They see a single primary action — "Sign in with Google" — click it, complete the Google consent screen using their `@seqtechllc.com` Workspace account, and land on the Payload admin dashboard with their editor permissions intact. Email and password fields are not the primary path on the login screen.

**Why this priority**: This is the daily workflow for every admin user. Without it, the feature delivers no value. ADR 0002 §Decision establishes this as the only `/admin` entry path post-Phase 1.

**Independent Test**: Provision a `@seqtechllc.com` Google test account with the Editor role, visit `/admin` in a fresh browser context, complete the SSO flow, and confirm the dashboard renders with editor capabilities (can view drafts, can create a Page, cannot manage users). Verified end-to-end with Playwright.

**Acceptance Scenarios**:

1. **Given** an editor with a `@seqtechllc.com` Workspace account and no active Payload session, **When** they visit `/admin` and click "Sign in with Google", **Then** Google's consent screen is shown, and after consent they are redirected to the admin dashboard with an Editor role active.
2. **Given** a returning editor whose admin user record was created on a prior OAuth sign-in, **When** they sign in via Google again, **Then** the existing user record is reused (no duplicate created) and their role assignment is preserved.
3. **Given** an editor signs in successfully, **When** their session token expires, **Then** they are returned to the SSO entry screen rather than a generic 401 dead-end.

---

### User Story 2 - First-time Workspace user is auto-provisioned (Priority: P2)

A SEQTEK staff member whose `@seqtechllc.com` Google account has no corresponding Payload user record clicks "Sign in with Google" for the first time. The system creates an admin user record bound to their Google identity at the default Editor role and lands them on the admin dashboard. An existing admin can subsequently promote them to the Admin role through the standard user-management UI.

**Why this priority**: Removes the manual pre-provisioning step that ADR 0002's "no SMTP for password reset" simplification would otherwise re-introduce. Acceptable risk because the domain restriction (User Story 3) already gates who can reach this code path.

**Independent Test**: Wipe an existing admin user record for a `@seqtechllc.com` test account, then sign in fresh. Confirm a new record is created with the Editor role, the Google subject ID is persisted, and a second sign-in re-uses the same record (no duplication).

**Acceptance Scenarios**:

1. **Given** a `@seqtechllc.com` user with no Payload record, **When** they complete Google SSO, **Then** an admin user record is created with role Editor and they are signed in.
2. **Given** the auto-provisioned user signs in a second time, **When** OAuth succeeds, **Then** the same user record is matched (by stable Google subject ID, not by email alone) and no duplicate is created.
3. **Given** an existing Admin wishes to promote the new user, **When** they edit the user record and change the role to Admin, **Then** the next sign-in reflects the elevated permissions.

---

### User Story 3 - Non-Workspace user is rejected at the boundary (Priority: P1)

A non-SEQTEK person (`gmail.com`, a different Google Workspace domain, or a personal Google account) attempts to sign in via the `/admin` SSO entry point. The system rejects the attempt before any admin user record is created or modified and shows a clear, non-disclosive error message. The attempt is recorded so unexpected access patterns are observable.

**Why this priority**: Without domain restriction, "Sign in with Google" is open to the entire Google identity universe. This is the access-control invariant ADR 0002 leans on; it must hold from the first deploy, not be added later.

**Independent Test**: Using a Google account on a non-`@seqtechllc.com` domain, attempt SSO. Confirm no admin user record is created, the admin dashboard is not reached, and the rejection is logged.

**Acceptance Scenarios**:

1. **Given** a Google user on any domain other than `@seqtechllc.com`, **When** they complete the Google consent screen and the callback fires, **Then** the system rejects the sign-in, returns to the entry screen with a brief failure message, and creates no user record.
2. **Given** a `@seqtechllc.com` account that has been suspended or deleted in Google Workspace, **When** they attempt to sign in, **Then** Google's own auth failure surfaces and Payload does not grant access.
3. **Given** a previously valid user whose Google account is later removed from the Workspace domain, **When** their existing Payload session token expires, **Then** their next sign-in attempt is rejected at the OAuth boundary.

---

### Edge Cases

- An `@seqtechllc.com` user's Google account is disabled mid-session — current session continues until token expiry, then re-auth fails (acceptable; documented).
- The OAuth callback URL is hit with a tampered or missing `state` parameter — request is rejected and the user is returned to the entry screen with a generic error.
- An admin attempts the `/admin` email/password endpoint directly (e.g., by URL guessing) — the endpoint either does not exist or returns the SSO entry screen; no password is ever accepted.
- The plugin's network call to Google's token endpoint times out — the user sees a retry-friendly error, no partial state is persisted.
- Multiple users sign in concurrently for the first time — each lands on its own user record, no race-condition collision.
- An Admin demotes themselves to Editor accidentally — they lose user-management access on next sign-in but retain Editor access (acceptable; recovery is a DB-level fix or another Admin promoting them back).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The `/admin` login screen MUST present "Sign in with Google" as the primary (and only user-visible) sign-in action.
- **FR-002**: The system MUST restrict admin sign-in to Google accounts whose email domain is exactly `seqtechllc.com`. Sub-domain or aliased domains are out of scope.
- **FR-003**: The system MUST reject sign-in attempts from any non-`@seqtechllc.com` account without creating or modifying any user record.
- **FR-004**: The system MUST disable Payload's local email/password strategy on the admin user collection so it is not a viable parallel entry path.
- **FR-005**: The system MUST auto-provision a new admin user record on first successful Google sign-in from a Workspace account, assigning the Editor role by default.
- **FR-006**: The system MUST match returning users by a stable Google identity claim (subject ID), not by email alone, so an email-change in Workspace does not create a duplicate.
- **FR-007**: The system MUST preserve role assignments across sign-ins — re-auth does not reset a previously promoted Admin back to Editor.
- **FR-008**: An existing Admin MUST be able to promote a user from Editor to Admin (and vice versa) through the standard admin UI.
- **FR-009**: OAuth client credentials (client ID and client secret) MUST be sourced from AWS Parameter Store in staging and production, and from `.env.local` in development. They MUST NOT be committed to the repository.
- **FR-010**: The system MUST treat OAuth callback errors (state mismatch, network failure, user-cancelled consent) as recoverable — the user is returned to the entry screen with a non-disclosive error message and may retry.
- **FR-011**: The system MUST log every sign-in attempt with email, timestamp, outcome (success / domain-rejected / OAuth-error), and provider, so unexpected access patterns are observable in CloudWatch.
- **FR-012**: The system MUST behave correctly in headless test environments — Playwright E2E tests can drive the SSO flow against a stub or mock that does not require a real Google account.
- **FR-013**: The system MUST keep the role-based access matrix from ARCHITECTURE.md §6 ("Access Control") intact — Editor and Admin retain the same capability boundaries regardless of how they authenticated.

### Key Entities

- **Admin User**: A SEQTEK staff member with `/admin` access. Carries an email (Workspace identity), a role (`editor` or `admin`), creation/update timestamps, and a binding to one or more OAuth provider identities. There is no password attribute in active use post-cutover.
- **OAuth Provider Identity**: A persisted binding between an Admin User and a specific Google account, keyed by the stable Google subject ID. Allows a Workspace user to keep their Payload record across email changes within the Workspace.
- **Sign-in Audit Entry**: A record of one sign-in attempt — email, timestamp, outcome, IP if available, provider. Persisted in CloudWatch logs (not necessarily a Payload collection).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of `/admin` sign-ins in the first 30 days post-cutover use Google SSO; zero password-based sign-ins recorded.
- **SC-002**: An editor with a clean browser session can reach the admin dashboard via SSO in under 10 seconds from clicking "Sign in with Google" on a typical broadband connection.
- **SC-003**: 100% of sign-in attempts from non-`@seqtechllc.com` accounts are rejected at the OAuth boundary, verified in CI by an automated test that simulates the rejection path.
- **SC-004**: No OAuth client credentials appear in any git commit, verified by gitleaks (pre-commit hook and CI scan both clean) across the implementation PR.
- **SC-005**: A new `@seqtechllc.com` user signing in for the first time reaches the admin dashboard without an admin needing to pre-create their record.
- **SC-006**: Removing a user from the SEQTEK Google Workspace revokes their `/admin` access at the next token validation (within one token TTL — up to 2 hours given the Payload-default TTL locked in by Clarifications 2026-05-21 Q1), with no manual Payload-side action required.
- **SC-007**: Zero references to AWS SES for admin password reset remain in the docs after this feature ships — ROADMAP D-5 is closed or rescoped to non-auth uses.

## Assumptions

- The admin user population is the ~5–10 SEQTEK staff with `@seqtechllc.com` Workspace accounts, per ADR 0002 (confirmed 2026-05-14). External collaborators and contractors do not need `/admin` access.
- A Google Cloud project belonging to SEQTEK is available for the OAuth client; redirect URIs for `localhost`, the staging hostname, and `seqtek.com` will be registered there.
- The Google Workspace tenant exposes domain-level restriction sufficient to enforce `hd=seqtechllc.com` on the OAuth flow. If a future requirement extends access to multiple domains, that becomes a separate feature.
- `@authsmith/payload-auth-plugin` is the chosen plugin (ADR 0002). If during planning the plugin is found to be unmaintained or insufficient, the chosen alternative (`payload-oauth2` or a custom `auth.strategies` implementation) still satisfies these requirements — the spec is plugin-neutral.
- Cutover starts from a fresh `users` table — no spike-era records or content are preserved (Clarifications 2026-05-21 Q2).
- Bootstrap Admin: with a fresh table and FR-005's default-to-Editor rule, no Admin exists immediately after cutover. The mechanism for seeding the first Admin (one-shot env var, manual DB update, "first user is Admin if no Admin exists" rule, etc.) is a one-time deploy concern deferred to `/speckit-plan`.
- Local development still uses a real Google OAuth client (dev redirect URI) by default. CI and Playwright suites use a mock or recorded flow so tests do not hit Google on every run.
- Break-glass access (plugin outage, IdP outage, lockout): out of scope for this feature. Recovery path is documented as a database-level admin operation, not a parallel application-level credential. This matches ADR 0002 §Costs.
- The decision to drop SES password-reset dependency (ADR 0002 §Consequences) is honored — this feature does not introduce any transactional email path.
- Session lifetime / token TTL is Payload-default (2-hour JWT TTL with a matching cookie) per Clarifications 2026-05-21 Q1. This is the upper bound on the SC-006 revocation lag.

## Dependencies

- **ADR 0002** (`docs/decisions/0002-auth-strategy.md`) — auth-strategy decision and rationale.
- **ARCHITECTURE.md §6** — security model, env-var classification, current access-control matrix. This spec updates §6 ("Payload Admin Authentication") rather than re-deriving it.
- **ROADMAP.md §2 D-14** — open work entry; closing this feature moves D-14 to PROJECT_HISTORY per Constitution Principle III.
- **`@authsmith/payload-auth-plugin`** — third-party dependency; load-bearing per ADR 0002.
- **Google Workspace `@seqtechllc.com`** — identity provider; outage there is an outage of `/admin` access.
- **AWS Parameter Store** — source of `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in staging and production; already in the IAM instance profile per ARCHITECTURE.md §6.
