import { defineConfig, devices } from '@playwright/test'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })
dotenvConfig({ path: '.env' })

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100'
const externalServer = !!process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
