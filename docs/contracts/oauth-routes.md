# Contract: OAuth routes and redirects

`/admin` sign-in is a custom Google OAuth integration. ADR 0002 records why it is not a plugin.
Payload's own JWT cookie strategy validates the resulting session on every admin request; the
local password strategy is off.

## 1. Routes

**`GET /api/auth/oauth/authorization/google`** (`src/app/(payload)/api/auth/oauth/authorization/google/route.ts`)

1. Generates a PKCE pair and a CSRF state, and stores both in HttpOnly cookies.
2. Redirects (302) to Google with `scope=openid email profile`, `code_challenge_method=S256`,
   `prompt=select_account` and `hd=*`. `hd=*` limits the account picker to Workspace accounts. We
   run two Workspace domains, and `hd` takes only one.
3. Builds the `redirect_uri` per request from `cloudfront-forwarded-proto` or `x-forwarded-proto`
   and from `x-forwarded-host`, so each lane uses its own host.

**`GET /api/auth/oauth/callback/google`** (`…/callback/google/route.ts`)

1. Checks that the state cookie matches the returned `state`.
2. Exchanges the code for tokens, then verifies the ID token against Google's JWKS, checking
   `iss`, `aud` and `exp` (`src/lib/auth/google-oauth.ts`, via `jose`).
3. Rejects an `hd` claim outside `ALLOWED_WORKSPACE_DOMAINS` (`seqtechllc.com`, `seqtek.com`, in
   `src/lib/auth/allowed-domains.ts`).
4. Finds the user by `googleSub`, or creates one through the Users `beforeChange` hooks: the domain
   allowlist, the first-admin role, and the audit log.
5. Mints Payload's session cookie with Payload's own helpers (`src/lib/auth/session-cookie.ts`) and
   redirects (302) to `/admin`.
6. On any failure it clears the OAuth cookies and redirects to `/admin/login?error=<code>`.

**Logout.** `POST /api/auth/logout` revokes the Payload session.
`GET /api/auth/gate-logout` clears the ALB Cognito gate's cookies and bounces through Cognito's
`/logout`.

## 2. Cookies

| Name                      | Set                 | TTL                   | Flags                                               |
| ------------------------- | ------------------- | --------------------- | --------------------------------------------------- |
| `__seqtek_oauth_state`    | entry route         | 10 min                | `HttpOnly; SameSite=Lax; Path=/`, `Secure` on HTTPS |
| `__seqtek_oauth_verifier` | entry route         | 10 min                | same                                                |
| `payload-token`           | successful callback | 2 h (Payload default) | `HttpOnly; SameSite=Lax; Path=/`                    |

Every callback deletes the two OAuth cookies, whether it succeeds or fails.

## 3. Error codes

| `?error=`         | Trigger                                                                                | Message                                            |
| ----------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `state_mismatch`  | state cookie missing or different                                                      | "Sign-in expired. Please try again."               |
| `domain_rejected` | `hd` claim or email domain outside the allowlist                                       | "Only SEQTEK Workspace accounts can sign in here." |
| `provider_error`  | Google returned an error, a non-2xx token response, or a token that fails verification | "Google couldn't sign you in. Please try again."   |
| `network`         | the token request threw                                                                | "We couldn't reach Google. Please try again."      |
| `internal`        | anything else, including a missing `GOOGLE_CLIENT_ID`                                  | "Something went wrong. Please try again."          |

The messages come from `src/components/admin/LoginError.tsx` and disclose nothing; the details go to
the audit log. `tests/e2e/auth-login-errors.e2e.spec.ts` covers each code.

## 4. Redirect URIs

The Google OAuth client needs `<scheme>://<host>/api/auth/oauth/callback/google` registered for every
host that serves `/admin`: `http://localhost:3100`, `https://preview.seqtek.com` and
`https://ww3.seqtek.com`.

## 5. Tests

- **Vitest** runs the application side through `payload.create` and `payload.update` with
  `req.user = null`, the same paths the callback uses. It covers the domain allowlist, the first
  admin, the role-update guard, `googleSub` uniqueness and the audit log.
- **Playwright** covers the error page and the unauthenticated `/admin` → `/admin/login` redirect.
- **The Google round trip is not stubbed**; it is exercised by a real sign-in.
