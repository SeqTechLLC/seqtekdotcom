/**
 * E2E pre-step (npm `pretest:e2e`): complete Payload's dev-mode schema push
 * ONCE, before Playwright launches, then exit.
 *
 * Why: the E2E webServer is `npm run dev`, and `push: NODE_ENV !== 'production'`
 * (src/payload.config.ts) auto-syncs the schema on Payload init. Spec 010 ~5×'d
 * the schema, so that push now outlasts Playwright's `webServer` readiness gate
 * — Next answers HTTP (gate goes green) before the drizzle push has finished
 * creating every table, so tests raced a half-built schema and hit
 * `relation … does not exist`. Pushing to completion here first makes the dev
 * server's later push a no-op and the schema deterministically ready before any
 * test runs. (See ROADMAP "CI e2e stability under the spec-010 schema".)
 *
 * Skipped when targeting an external server (PLAYWRIGHT_BASE_URL): we don't own
 * that database and must never push to it.
 */
import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../')

// Load env BEFORE importing payload.config, which reads DATABASE_URL /
// PAYLOAD_SECRET at module-eval time. In CI these come from the job env (the
// missing files are a harmless no-op); locally they come from .env.local.
loadEnv({ path: path.join(repoRoot, '.env.local') })
loadEnv({ path: path.join(repoRoot, '.env') })

async function main(): Promise<void> {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    console.log('[e2e] PLAYWRIGHT_BASE_URL set — external server, skipping schema push')
    return
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')

  const started = Date.now()
  const payload = await getPayload({ config })
  // Prove the push actually materialized a core table — fail loudly otherwise.
  await payload.count({ collection: 'users', overrideAccess: true })
  console.log(`[e2e] schema push complete (${Date.now() - started}ms)`)
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('[e2e] schema push failed:', err)
    process.exit(1)
  })
