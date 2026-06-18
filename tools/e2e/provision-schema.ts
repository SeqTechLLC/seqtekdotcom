/**
 * E2E schema provisioning (npm `pretest:e2e`).
 *
 * Provisions the database the *production* way — `payload migrate` with push
 * disabled — instead of letting dev-mode `push` build it. Spec 010 ~5×'d the
 * schema; with push on, the dev webServer AND every Playwright worker each push
 * it concurrently on init and contend on Drizzle's schema introspection until
 * `getPayload` exceeds the 30s `beforeAll` budget (→ undefined client → the
 * cascade of failures that kept the block-composition suite red). Migrating
 * once, up front, removes the contention and also validates the committed
 * migration files on every CI run.
 *
 * CI-only: locally Playwright reuses the already-running `npm run dev` server
 * (`reuseExistingServer`), which owns the schema via dev push — running migrate
 * against that push-managed DB would conflict, so we skip.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../')

// CI provides DATABASE_URL / PAYLOAD_SECRET via the job env (missing files are a
// harmless no-op); locally they come from .env.local.
loadEnv({ path: path.join(repoRoot, '.env.local') })
loadEnv({ path: path.join(repoRoot, '.env') })

if (!process.env.CI || process.env.PLAYWRIGHT_BASE_URL) {
  console.log(
    '[e2e] not CI / external server — skipping migrate (the dev server provides the schema)',
  )
  process.exit(0)
}

console.log('[e2e] provisioning schema via `payload migrate` (push disabled)…')
const result = spawnSync('npx', ['--no', 'payload', 'migrate'], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: { ...process.env, PAYLOAD_DISABLE_PUSH: 'true', NODE_OPTIONS: '--no-deprecation' },
})
process.exit(result.status ?? 1)
