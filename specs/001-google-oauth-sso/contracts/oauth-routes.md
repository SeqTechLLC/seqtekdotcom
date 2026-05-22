# Contract — OAuth routes & redirects

**Feature**: 001-google-oauth-sso · **Date**: 2026-05-21

The plugin instance is named `auth` (configured via `authPlugin({ name: 'auth',
... })`), so every route below is prefixed with `/api/auth/`. URLs are stable for
the lifetime of this feature — Google's redirect-URI allowlist in the Cloud Console
references them verbatim per environment.

## 1. Routes registered by the plugin

| #   | Method | Path                               | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                             | Status codes |
| --- | ------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | GET    | `/api/auth/oauth/authorize/google` | Browser entry. Redirects to Google's authorize endpoint with `client_id`, `redirect_uri`, `scope=openid email profile`, `state=<csrf>`, `hd=seqtechllc.com`, `prompt=select_account`.                                                                                                                                                                                                                                                               | 302          |
| 2   | GET    | `/api/auth/oauth/callback/google`  | Google → us. Validates `state`, exchanges `code` for tokens at Google's token endpoint, fetches userinfo, runs the Users `beforeChange` hook (domain check + provisioning + bootstrap-admin), creates/updates the `accounts` row, sets the Payload session cookie, redirects to `successRedirectPath`. On any failure (state mismatch, network timeout, domain rejection, Google-side error) redirects to `errorRedirectPath` with `?error=<code>`. | 302          |
| 3   | GET    | `/api/auth/session/user`           | Returns the current session user. Used by client components if/when needed.                                                                                                                                                                                                                                                                                                                                                                         | 200 / 401    |
| 4   | GET    | `/api/auth/session/signout`        | Clears cookie, redirects to `returnTo` (defaults to `/admin/login`).                                                                                                                                                                                                                                                                                                                                                                                | 302          |
| 5   | GET    | `/api/auth/session/refresh`        | Re-issues the JWT if the current cookie is within its refresh window.                                                                                                                                                                                                                                                                                                                                                                               | 200 / 401    |

Other plugin routes (`/auth/signin`, `/auth/signup`, `/auth/forgot-password`,
`/auth/reset-password`, `/passkey/*`) are registered by the plugin but unused —
no `PasswordProvider` or `PasskeyAuthProvider` is wired in. They return their
plugin-default 404/501 responses; they are not part of this feature's contract.

## 2. Plugin configuration values (the contract Payload reads)

```ts
authPlugin({
  name: 'auth', // → /api/auth/*
  usersCollectionSlug: 'users',
  accountsCollectionSlug: 'accounts',
  allowOAuthAutoSignUp: true, // first Workspace sign-in creates the user row
  successRedirectPath: '/admin', // land on Payload admin dashboard
  errorRedirectPath: '/admin/login', // back to login screen with ?error=<code>
  providers: [
    GoogleAuthProvider({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      params: {
        hd: 'seqtechllc.com', // Google-side hint; server hook is load-bearing
        prompt: 'select_account',
      },
      // overridden in test only:
      authorization_endpoint: process.env.OAUTH_STUB_ENABLED
        ? '/api/test/oauth/google/authorize'
        : undefined,
      token_endpoint: process.env.OAUTH_STUB_ENABLED ? '/api/test/oauth/google/token' : undefined,
      userinfo_endpoint: process.env.OAUTH_STUB_ENABLED
        ? '/api/test/oauth/google/userinfo'
        : undefined,
    }),
  ],
})
```

## 3. Error codes emitted on `errorRedirectPath`

| `?error=` value   | Trigger                                                       | User-facing message (server-rendered on `/admin/login`) |
| ----------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| `state_mismatch`  | CSRF state didn't match what we set                           | "Sign-in expired. Please try again."                    |
| `domain_rejected` | Email outside `@seqtechllc.com`                               | "Only SEQTEK Workspace accounts can sign in here."      |
| `provider_error`  | Google returned an error (revoked consent, suspended account) | "Google couldn't sign you in. Please try again."        |
| `network`         | Token or userinfo endpoint timed out                          | "We couldn't reach Google. Please try again."           |
| `internal`        | Any unhandled exception in the callback                       | "Something went wrong. Please try again."               |

Messages are intentionally non-disclosive (FR-010) — they do not differentiate
"never existed" from "domain wrong" from "Google declined" beyond what is necessary
for the user to act. No stack traces or correlation IDs in the UI; those live in
CloudWatch under the audit-event payload.

## 4. Redirect-URI registration (per environment)

Registered exactly as below in the SEQTEK Google Cloud project's OAuth 2.0 Client
Credential ("Web application" type) under "Authorized redirect URIs":

| Env        | Redirect URI                                                |
| ---------- | ----------------------------------------------------------- |
| Local dev  | `http://localhost:3100/api/auth/oauth/callback/google`      |
| Staging    | `https://staging.seqtek.com/api/auth/oauth/callback/google` |
| Prod       | `https://seqtek.com/api/auth/oauth/callback/google`         |
| Prod (www) | `https://www.seqtek.com/api/auth/oauth/callback/google`     |

Both `seqtek.com` and `www.seqtek.com` are registered so the OAuth flow works
regardless of which canonical host the user enters; the application redirects to
the canonical host post-auth via existing Next config rewrites.

## 5. Test-environment stub contract (`OAUTH_STUB_ENABLED=1` only)

| Method | Path                               | Behaviour                                                                                                                                                          |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/test/oauth/google/authorize` | Reads query params (`client_id`, `redirect_uri`, `state`, `scope`, fixture identity via `?fixture=<key>`), 302s to `redirect_uri?code=<fixture-key>&state=<state>` |
| GET    | `/api/test/oauth/google/token`     | Returns JSON `{ access_token, id_token, expires_in: 3600, token_type: 'Bearer' }` keyed on `code`; `id_token` is a fixture JWT signed with a test-only HMAC secret |
| GET    | `/api/test/oauth/google/userinfo`  | Returns JSON `{ sub, email, email_verified: true, hd, name, picture }` from the fixture identity table                                                             |

Fixture identities live in `tests/e2e/helpers/oauthFixtures.ts`. Minimum set:

| key               | email                   | hd               | role outcome               |
| ----------------- | ----------------------- | ---------------- | -------------------------- |
| `bootstrap-admin` | `kenn@seqtechllc.com`   | `seqtechllc.com` | becomes Admin (first user) |
| `editor`          | `editor@seqtechllc.com` | `seqtechllc.com` | becomes Editor             |
| `intruder`        | `intruder@gmail.com`    | _absent_         | rejected at hook           |
| `wrong-workspace` | `someone@otherco.com`   | `otherco.com`    | rejected at hook           |

The stub routes are conditionally registered in `src/app/(payload)/admin/`'s route
tree only when `OAUTH_STUB_ENABLED=1`; in any other environment the routes do not
exist at all (build-time tree-shake on the env check).
