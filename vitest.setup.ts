// Load env vars in Next.js convention: .env.local takes precedence over .env.
// dotenv-style {override:false} on the second pass means values already loaded
// from .env.local are not clobbered by .env defaults.
import { config as loadEnv } from 'dotenv'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// With `isolate: false` in vitest.config.mts the jsdom DOM is reused across
// test files in the same worker, so testing-library's mounted containers
// accumulate in `<body>` and `getByText` starts returning matches from
// prior tests. Run cleanup after every test to scope the DOM to one `it`.
afterEach(() => {
  cleanup()
})

const TEST_ENV_FILE = resolve(tmpdir(), 'seqtek-vitest-env.json')

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

// Testcontainers-supplied env (DATABASE_URL pointing at the ephemeral Postgres)
// — see vitest.globalSetup.ts. Loaded last so it wins over .env.local for the
// duration of the Vitest run.
if (existsSync(TEST_ENV_FILE)) {
  const overrides = JSON.parse(readFileSync(TEST_ENV_FILE, 'utf8')) as Record<string, string>
  for (const [k, v] of Object.entries(overrides)) {
    process.env[k] = v
  }
}

// Payload requires a non-empty PAYLOAD_SECRET to bootstrap, even in tests.
if (!process.env.PAYLOAD_SECRET) {
  process.env.PAYLOAD_SECRET = 'test-secret-do-not-use-in-prod'
}
