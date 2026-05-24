# Contract — Environment variables

**Feature**: 001-google-oauth-sso · **Date**: 2026-05-21

Two new variables are introduced; one optional test-only flag is documented for
completeness. These rows are appended to ARCHITECTURE.md §6 "Environment Variables"
in the same PR (Principle III).

## New variables

| Variable               | Scope  | Classification | Set in                                                            | Purpose                                                                                                                                                       |
| ---------------------- | ------ | -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Server | Config         | `.env.local` (dev), Parameter Store `String` (staging/prod)       | OAuth 2.0 client ID for the SEQTEK Google Cloud project. Public-by-Google's-definition but kept server-only because it lives next to the secret.              |
| `GOOGLE_CLIENT_SECRET` | Server | **Secret**     | `.env.local` (dev), Parameter Store `SecureString` (staging/prod) | OAuth 2.0 client secret. Never appears in client bundles, logs, or git history. Read at process start via the existing instance-profile-backed AWS SDK chain. |

## Test-only flag (CI / local Playwright only)

| Variable             | Scope  | Classification | Set in                             | Purpose                                                                                                                                                                                                                    |
| -------------------- | ------ | -------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OAUTH_STUB_ENABLED` | Server | Config         | `playwright.config.ts` (test) only | When set to `1`, registers the `/api/test/oauth/google/*` stub provider routes and points `GoogleAuthProvider` at them. **Unset everywhere except E2E tests.** A CI guard asserts the prod env profile does not export it. |

## Rules

- `.env.local` is git-ignored (existing rule); `.env*` other than `.env.example` is
  also git-ignored.
- `.env.example` gains two commented lines (names + brief comment, **no values**):

  ```bash
  # OAuth — Google Workspace SSO (D-14)
  # Get values from the SEQTEK Google Cloud Console (OAuth 2.0 Client Credentials).
  # Local dev: paste the dev client below. Staging/prod read from AWS Parameter Store.
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  ```

- Parameter Store paths (staging/prod):

  | Variable               | Parameter Store name                         | Type           |
  | ---------------------- | -------------------------------------------- | -------------- |
  | `GOOGLE_CLIENT_ID`     | `/seqtek/website/{env}/google_client_id`     | `String`       |
  | `GOOGLE_CLIENT_SECRET` | `/seqtek/website/{env}/google_client_secret` | `SecureString` |

  Where `{env}` is `staging` or `prod`. The IAM instance profile already grants
  `ssm:GetParameters` on `/seqtek/website/*` (ARCHITECTURE.md §6) — no new IAM is
  needed.

## Validation

- **Gitleaks** (pre-commit + CI): catches accidental commits of either value.
- **Startup**: `src/payload.config.ts` reads both via `process.env`; if either is
  missing **and** the OAuth stub is not enabled, the plugin throws at process start
  (fast-fail), which surfaces as a CI / container failure rather than a runtime
  500 on the first sign-in attempt.
- **CI assertion**: a tiny test in `tests/int/env.int.spec.ts` checks that the prod
  env profile (`.env.production.local` template / Parameter Store path map) lists
  both vars and does _not_ list `OAUTH_STUB_ENABLED`.

## SC-004 traceability

SC-004 ("No OAuth client credentials appear in any git commit") is satisfied by:

1. `.env.example` lists keys only (this contract enforces empty values).
2. `.gitignore` excludes `.env*` except `.env.example` (existing rule).
3. Gitleaks `.gitleaks.toml` rules already catch `GOOGLE_CLIENT_SECRET` patterns
   (high-entropy + key-name regex) — no additions needed.
4. CI `gitleaks` step runs against the full diff on every PR (existing rule per
   Constitution IV).
