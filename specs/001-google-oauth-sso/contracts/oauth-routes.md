# Contract — OAuth routes & redirects

**Feature**: 001-google-oauth-sso · **Date**: 2026-05-24 (rewritten during /speckit-implement)

This spec ships a **custom OAuth integration**, not the `payload-auth-plugin` dependency originally planned. Decision recorded in ADR 0002 (post-implementation note) and in `tasks.md` "FR-012 note" block at the top of the file. Trust-surface reasoning: small ecosystem (305-star plugin, one maintainer, exact-pinned vulnerable deps); ADR 0002's listed fallback was a custom `auth.strategies`-style implementation.

## 1. Routes we register

| #   | Method | Path                                   | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Status codes |
| --- | ------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | GET    | `/api/auth/oauth/authorization/google` | Browser entry. Generates a PKCE pair + CSRF state, stores both in HttpOnly cookies, 302s to `https://accounts.google.com/o/oauth2/v2/auth?...` with `client_id`, `redirect_uri`, `scope=openid email profile`, `state`, `code_challenge`, `code_challenge_method=S256`, `hd=seqtechllc.com`, `prompt=select_account`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 302          |
| 2   | GET    | `/api/auth/oauth/callback/google`      | Google → us with `?code&state` (or `?error`). Validates state cookie matches the returned state, exchanges the code for tokens at Google's token endpoint, verifies the ID token's signature against `https://www.googleapis.com/oauth2/v3/certs` and validates `iss`, `aud`, `exp`. Enforces the `hd` claim server-side (defence-in-depth on top of the `hd=` URL hint). Looks up the user by `googleSub`; if absent, calls `payload.create({ collection: 'users', data, req: { user: null } })` which runs the Users `beforeChange` hook chain (domain allowlist, bootstrap-admin role assignment, audit log). Mints a Payload-compatible session cookie via Payload's own `getFieldsToSign` + `jwtSign` + `generatePayloadCookie` and 302s to `/admin`. On any failure (state mismatch, network, provider error, domain reject) redirects to `/admin/login?error=<code>` and clears the OAuth cookies. | 302          |

Files:

- `src/app/(payload)/api/auth/oauth/authorization/google/route.ts`
- `src/app/(payload)/api/auth/oauth/callback/google/route.ts`
- `src/lib/auth/google-oauth.ts` — PKCE/state generation, authorization-URL builder, token exchange, ID-token verification via `jose`'s `createRemoteJWKSet` + `jwtVerify`
- `src/lib/auth/session-cookie.ts` — Payload session-cookie issuance via Payload's own helpers

There are no `/session/*`, `/auth/signin`, or `/passkey/*` routes here — the plugin's full surface is intentionally not reproduced. Payload's default JWT cookie strategy continues to validate the session cookie on every subsequent admin request; we just bypass the local password strategy by minting the cookie ourselves.

## 2. Cookies

| Name                                          | When set               | TTL                 | Flags                                                                       | Purpose                                                                               |
| --------------------------------------------- | ---------------------- | ------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `__seqtek_oauth_state`                        | On entry route         | 10 min              | `HttpOnly; SameSite=Lax; Path=/; Secure` (when HTTPS)                       | CSRF state to compare against the `state` Google returns.                             |
| `__seqtek_oauth_verifier`                     | On entry route         | 10 min              | same as above                                                               | PKCE code verifier paired with the code challenge sent to Google.                     |
| `payload-token` (default Payload cookie name) | On successful callback | Payload default 2 h | `HttpOnly; SameSite=Lax; Path=/` (Secure flag follows `serverURL` protocol) | The session JWT Payload's admin reads on every request. Signed with `PAYLOAD_SECRET`. |

OAuth-flow cookies are deleted on every callback (success or error). The session cookie expires per Payload's `tokenExpiration` (left at the 7200 s default, per Clarifications 2026-05-21 Q1).

## 3. Error codes emitted on `errorRedirectPath`

| `?error=`         | Trigger                                                                                                                            | User-facing message                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `state_mismatch`  | CSRF state cookie missing or doesn't match the `state` Google returned                                                             | "Sign-in expired. Please try again."               |
| `domain_rejected` | ID token's `hd` claim isn't `seqtechllc.com`, **or** the Users beforeChange hook rejected on email-domain check                    | "Only SEQTEK Workspace accounts can sign in here." |
| `provider_error`  | Google returned non-2xx from token endpoint, OR `?error=...` in the callback URL, OR ID token signature/claims failed verification | "Google couldn't sign you in. Please try again."   |
| `network`         | `fetch` to Google's token endpoint threw (connectivity, timeout)                                                                   | "We couldn't reach Google. Please try again."      |
| `internal`        | Anything else: missing env vars, session cookie minting failure, unexpected exception                                              | "Something went wrong. Please try again."          |

Messages are intentionally non-disclosive (FR-010). Diagnostics go to CloudWatch via the audit log; only the user-friendly string lands on the page.

## 4. Redirect-URI registration (per environment)

Registered in the SEQTEK Google Cloud project's OAuth 2.0 Client ("Web application" type) under "Authorized redirect URIs":

| Env        | Redirect URI                                                |
| ---------- | ----------------------------------------------------------- |
| Local dev  | `http://localhost:3100/api/auth/oauth/callback/google`      |
| Staging    | `https://staging.seqtek.com/api/auth/oauth/callback/google` |
| Prod       | `https://seqtek.com/api/auth/oauth/callback/google`         |
| Prod (www) | `https://www.seqtek.com/api/auth/oauth/callback/google`     |

Paths are unchanged from the plugin era — the implementation swap was transparent to Google Console.

## 5. Tests

Per the FR-012 note in `tasks.md`, the OAuth round-trip itself is third-party I/O (Google's authorize/token endpoints, JWKS) and is not stubbed. Instead:

- **Vitest int** drives the application-side logic by calling `payload.create({ collection: 'users', ..., req: { user: null } })` and `payload.update(...)` — the same code paths the callback route invokes after Google's response. Covers domain allowlist, bootstrap-admin, role-update guard, `googleSub` uniqueness, audit-log emission.
- **Playwright** drives `/admin/login?error=<code>` for each error string in the LoginError contract, plus an unauthenticated `/admin` → `/admin/login` redirect.
- **Live OAuth** is exercised manually with a real `@seqtechllc.com` account during T020 (the only task that genuinely needs a browser + Google client). A breakage in Google's response shape would surface in this manual flow first, and in CloudWatch from the audit-log lines second.
