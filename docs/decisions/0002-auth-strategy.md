# 0002. Payload local auth in spike, Google OAuth in Phase 1

**Status:** Superseded by implementation. The Decision section's "Phase 1 (post-spike)" choice to adopt `@authsmith/payload-auth-plugin` was reverted during /speckit-implement on 2026-05-24; the **custom `auth.strategies` alternative listed in this ADR's Options section was taken instead**. The shape of the high-level outcome — Google OAuth, Workspace-domain restriction, no SMTP, ~5-10 admin users — is unchanged. The domain restriction widened from one domain to two on 2026-06-24 (see the implementation note below) — the "revisit when" condition this ADR anticipated.

**Date:** 2026-05-14 · **Revised:** 2026-05-24, 2026-06-24

**Implementation note (2026-05-24):**

- The npm package is published as `payload-auth-plugin` (unscoped) — `@authsmith` is the GitHub org, not the npm scope. We _briefly_ installed it (pinned 0.7.13) before reversing the choice.
- The reversal was driven by trust-surface review: 305 stars, one named maintainer, exact-pinned vulnerable transitive deps (`js-cookie 3.0.5` HIGH, `uuid 11.1.0` MODERATE), and an inconvenient route-naming docs error that masked itself behind a generic 500. None individually disqualifying; in aggregate enough to take the listed fallback.
- Custom implementation is **~250 LOC** across `src/app/(payload)/api/auth/oauth/{authorization,callback}/google/route.ts` and `src/lib/auth/{google-oauth,session-cookie}.ts`. Uses Google's OIDC discovery + JWKS via `jose` (mature, widely used by NextAuth/Auth0/etc.) and Payload's own session-cookie helpers (`getFieldsToSign`, `jwtSign`, `generatePayloadCookie`). No new runtime dependency beyond what Payload + Next already ship.
- `npm audit --omit=dev --audit-level=high` added to CI `quality` job as a defence-in-depth check for future dep introductions.

**Implementation note (2026-06-24) — two Workspace domains:**

- SEQTEK runs **two** live Google Workspace domains: the legal entity (`seqtechllc.com`) and the public brand (`seqtek.com`). Staff exist under both (marketing is on `@seqtek.com`), so a `@seqtek.com` editor (Megan) was domain-rejected at `/admin` by the original single-domain allowlist. This is exactly the "Revisit when: editor set extends beyond `@seqtechllc.com`" trigger below.
- Fix: a shared allowlist (`src/lib/auth/allowed-domains.ts`, `ALLOWED_WORKSPACE_DOMAINS = ['seqtechllc.com', 'seqtek.com']`) now backs all three domain gates — the email-suffix check (`enforce-domain.ts`), the Google `hd` account-picker hint (relaxed from a single domain to `*`, since `hd` takes only one value and pinning one would hide the other's accounts), and the callback `hd`-claim check. First sign-in still auto-provisions an `editor`; access is otherwise unchanged. Adding/removing a domain is a one-line edit to the shared array.

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
