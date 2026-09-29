# 0002. Google Workspace SSO for `/admin` through custom OAuth handlers

**Status:** Accepted
**Date:** 2026-05-14
**Revised:** 2026-05-24 (custom handlers instead of a plugin), 2026-06-24 (#77, a second Workspace domain)

## Context

Only `/admin` needs authentication; the public site is anonymous. The editors are a handful of SEQTEK staff, all on
Google Workspace. Payload's built-in email/password login would need SMTP for password resets and puts password
handling in a public repo.

## Options considered

- **Payload email/password** — the default; needs SMTP and password management.
- **Custom handlers on `auth.strategies`** — verify Google's ID token ourselves; more code to own, no plugin.
- **`payload-auth-plugin`** — drop-in OAuth with domain restriction; at review (2026-05-24) a single-maintainer
  project with exact-pinned vulnerable dependencies.
- **`payload-authjs`** — wraps Auth.js; more moving parts than a handful of editors need.

## Decision

Custom OAuth handlers: `src/app/(payload)/api/auth/oauth/{authorization,callback}/google/route.ts` and `src/lib/auth/`.
The ID token is verified against Google's JWKS with `jose`, and sessions use Payload's own cookie helpers. The local
strategy is disabled, so Google is the only way in. `src/lib/auth/allowed-domains.ts` admits `seqtechllc.com` and
`seqtek.com`, the company's two Workspace domains. The first account on an empty database becomes the admin; later
accounts are editors.

## Consequences

- No passwords, and no SMTP dependency for sign-in.
- About 250 lines of auth code to own, with no new runtime dependency.
- Every editor needs an account on one of the two domains.
- Leaving Google Workspace means rewriting the handlers.

## Revisit when

An editor outside the two Workspace domains needs `/admin`, or SEQTEK changes identity provider.
