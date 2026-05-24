# Quickstart — Google Workspace SSO for `/admin` (local dev)

**Feature**: 001-google-oauth-sso · **Audience**: anyone running the site locally
after this feature ships.

Five-minute setup. Everything below assumes a working local stack from
`docs/LOCAL_DEVELOPMENT.md` (Docker Postgres on `:5433`, `next dev --port 3100`).

---

## 1. Create a Google OAuth client (one-time)

Anyone with `@seqtechllc.com` access to the `seqtek-website` Google Cloud project:

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Confirm you're in the **seqtek-website** project (top bar).
3. **Create Credentials → OAuth client ID** → application type **Web application**.
4. Name: `seqtek-website-local-dev` (or `…-staging`, `…-prod` for those envs).
5. Authorized JavaScript origins: `http://localhost:3100`.
6. Authorized redirect URIs: `http://localhost:3100/api/auth/oauth/callback/google`.
7. Click **Create** — copy the **Client ID** and **Client secret** from the popup.

The contract in [`contracts/oauth-routes.md`](./contracts/oauth-routes.md) §4 lists the
staging/prod redirect URIs to register on the matching credentials.

## 2. Put the values in `.env.local`

```bash
# (existing keys above…)

# Google OAuth (D-14)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
```

Never commit `.env.local`. `.env.example` lists the names with empty values.

## 3. Run migrations (fresh DB) or just `npm run dev`

If you're on a fresh DB (or a spike-era DB that needs the cutover):

```bash
docker compose down -v        # drop the volume — cutover starts from a fresh users table
docker compose up -d
npm run payload migrate       # applies the auto-generated migration adding accounts table + users.roles
```

If your DB already has the migration applied, `npm run dev` is enough:

```bash
npm run dev
```

## 4. First sign-in (you become Admin)

1. Open <http://localhost:3100/admin>.
2. Click **Sign in with Google** (the new primary button injected above the now-unused
   email/password form).
3. Pick your `@seqtechllc.com` Google account at the consent screen.
4. You land on `/admin` as **Admin** — bootstrap rule fires once because the `users`
   table was empty (see [`research.md`](./research.md) R-4).

Any subsequent `@seqtechllc.com` signer lands as **Editor**. You can promote them in
`/admin/collections/users/<id>` → set `roles` to `admin`.

## 5. Try the rejection path

1. Open an incognito window.
2. Hit `/admin`, click **Sign in with Google**, pick a personal `gmail.com` account.
3. You should land back on `/admin/login?error=domain_rejected` with the message
   "Only SEQTEK Workspace accounts can sign in here."
4. No `users` or `accounts` row was created — verify in `/admin/collections/users`.

## 6. Run the tests

```bash
npm run test:int        # Vitest: domain-allowlist unit + Users-hook integration
npm run test:e2e        # Playwright: full SSO flow against the in-process stub
```

The Playwright suite never calls real Google — it talks to the
`/api/test/oauth/google/*` stub routes that the env flag `OAUTH_STUB_ENABLED=1`
turns on. See [`contracts/oauth-routes.md`](./contracts/oauth-routes.md) §5 for the
stub contract.

---

## Troubleshooting

| Symptom                                                          | Likely cause                                                              | Fix                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Click "Sign in with Google" → "Error 400: redirect_uri_mismatch" | Redirect URI in `.env.local` doesn't match the Google Cloud Console entry | Match exactly: `http://localhost:3100/api/auth/oauth/callback/google` (no trailing slash)                     |
| Click "Sign in with Google" → endless redirect loop              | `serverURL` in `payload.config.ts` doesn't match the host you're visiting | Use either `localhost:3100` or `127.0.0.1:3100` consistently; cookie domain matters                           |
| First sign-in lands as Editor, not Admin                         | `users` table wasn't empty when you signed in                             | Drop the volume (`docker compose down -v`), re-migrate, sign in again. Bootstrap only runs on an empty table. |
| Tests fail with "OAUTH_STUB_ENABLED not set"                     | Playwright is starting a `next dev` without the env flag                  | Check `playwright.config.ts` `webServer.env` — should set `OAUTH_STUB_ENABLED=1`                              |

Anything else lands as a question in `#seqtek-website` or as an issue on the repo.
