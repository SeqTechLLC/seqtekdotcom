import { defineConfig, devices } from '@playwright/test'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })
dotenvConfig({ path: '.env' })

// Seeded-content E2E tests bust the dev server's `unstable_cache` through the
// in-process `/api/revalidate` route: mutations run in a SEPARATE Payload
// process from the dev server, so the afterChange `revalidateTag` never reaches
// the server's cache. The test workers and the spawned `npm run dev` webServer
// both inherit this `process.env`, so a single shared secret lets them agree.
// Default it (CI doesn't set one) so the route accepts the test's Bearer token.
if (!process.env.REVALIDATION_SECRET) {
  process.env.REVALIDATION_SECRET = 'e2e-revalidation-secret'
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100'
const externalServer = !!process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/visual/**'],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // CI gets a larger per-test budget: content tests warm a cold, heavy
  // block-composed route first (warmRoute polls while the orphaned read
  // populates unstable_cache) before asserting, which can exceed the 30s
  // default. Local keeps 30s — the dev server is already warm there.
  timeout: process.env.CI ? 120_000 : 30_000,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  ...(externalServer
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          reuseExistingServer: !process.env.CI,
          url: baseURL,
          timeout: 120_000,
        },
      }),
})
