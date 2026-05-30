/**
 * Playwright config for on-demand visual screenshot capture. Extends the
 * default config but only runs tests/e2e/visual/**, which the default config
 * excludes so npm test:e2e stays focused on functional E2E.
 *
 * Use via `npm run visual:capture`.
 */
import { defineConfig, devices } from '@playwright/test'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })
dotenvConfig({ path: '.env' })

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100'
const externalServer = !!process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './tests/e2e/visual',
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
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
