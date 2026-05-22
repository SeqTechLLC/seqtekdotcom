# 0002. Payload local auth in spike, Google OAuth in Phase 1

**Status:** Accepted (implemented in spec 001 / D-14, shipped 2026-05-22)
**Date:** 2026-05-14

**Implementation note (2026-05-22):** The npm package is published as `payload-auth-plugin` (unscoped) — `@authsmith` is the GitHub org, not the npm scope. The plugin's `GoogleAuthProvider` does not expose endpoint overrides, so the spec's planned OAuth stub for headless tests was dropped; we test the integration surface only (Users `beforeChange` hook + `LoginError` contract). See `specs/001-google-oauth-sso/tasks.md` for the FR-012 note.

## Context

The site needs admin authentication for `/admin` (Payload CMS panel). It does **not** need any public-facing user accounts — the marketing site is anonymous-only, all lead capture is HubSpot, all booking is HubSpot Meetings, the assessment is ScoreApp. ARCHITECTURE.md §6 originally specified Payload's built-in email/password auth.

Admin user population: SEQTEK content editors and admins only, ~5-10 accounts total, all on Google Workspace (`@seqtechllc.com`). Confirmed 2026-05-14.

Payload v3 exposes `auth.strategies` as an extension point. Several community plugins target this for OAuth/OIDC: `@authsmith/payload-auth-plugin` (Google, Microsoft, GitHub, etc.), `payload-authjs` (wraps Auth.js v5), `payload-oauth2` (zero-dep, configurable).

## Options considered

- **Payload built-in email/password only** — Default. Requires SMTP (AWS SES) for password reset (ROADMAP D-5). Adds password management surface area on a public-repo project.
- **Custom auth strategy (`auth.strategies`)** — Write ~50 lines verifying Google ID tokens against `google-auth-library`. No plugin dependency. More code to own, more edge cases to handle.
- **`@authsmith/payload-auth-plugin`** — Drop-in OAuth2/OIDC with domain restriction. Active project, ~106 documented examples, supports multiple providers if needed later.
- **`payload-authjs`** — Wraps Auth.js v5 (NextAuth ecosystem). More moving parts than we need for 5-10 editors.

## Decision

**Spike phase (D-13):** Use Payload's built-in local strategy (email/password). The spike's purpose is validating the Next 16 / Payload 3.84+ / Tailwind v3 / Postgres combo; auth provider is orthogonal. Adding a plugin in the spike introduces noise that obscures stack issues.

**Phase 1 (post-spike):** Add `@authsmith/payload-auth-plugin` configured for Google OAuth with email domain restriction to `@seqtechllc.com`. Disable Payload's local strategy on the `users` collection so OAuth is the only path to `/admin`. This becomes ROADMAP D-14.

## Consequences

- **Gain:** No password management. No password leakage risk in a public-repo project. No SMTP dependency for password reset emails (ROADMAP D-5 becomes moot for auth — still needed if/when transactional email is added for other reasons).
- **Gain:** Editors have one less credential. Workspace SSO familiar territory.
- **Gain:** Domain restriction at `@seqtechllc.com` provides built-in access control on top of role-based access.
- **Cost:** Plugin dependency. `@authsmith/payload-auth-plugin` becomes a load-bearing piece of the auth path.
- **Cost:** All editors must be Workspace users. If a contractor or non-staff member needs admin access, they need a Workspace account or we re-enable local auth for that one user (defeating the simplification).
- **Cost:** Migrating off Google later (e.g., if SEQTEK switches to Microsoft 365) requires reconfiguring the plugin, not rewriting auth logic. Manageable.

## Revisit when

- Editor set extends meaningfully beyond `@seqtechllc.com` (contractors, agency partners with `/admin` access).
- `@authsmith/payload-auth-plugin` stalls (>6 months without updates, falls behind Payload majors).
- SEQTEK changes identity provider away from Google Workspace.
