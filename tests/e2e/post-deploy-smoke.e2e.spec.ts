/**
 * Post-deploy smoke test — runs against a deployed environment, not
 * the local dev server. Hits /api/health, /admin, and / to confirm
 * the basic shape of the deployed application works end-to-end.
 *
 * Driven by env var `POST_DEPLOY_URL`. If unset, this suite skips —
 * the local PR test pipeline (Phase 1 P1-9) doesn't need this file
 * to run.
 *
 * Used by:
 * - Phase 3 T029 (manual smoke after first staging deploy)
 * - Phase 4 T034 deploy.yml workflow (Playwright step after `cdk deploy`)
 *
 * Failure semantics: any assertion failing in this file should report
 * to the deploy workflow as a failed deploy, which then triggers the
 * FR-015 zero-customer-5xx rollback path (previous image stays in
 * service).
 */
import { expect, test } from '@playwright/test'

const POST_DEPLOY_URL = process.env.POST_DEPLOY_URL

test.describe('post-deploy smoke', () => {
  test.skip(!POST_DEPLOY_URL, 'POST_DEPLOY_URL not set — skipping post-deploy smoke')

  test('GET /api/health returns 200 with status=ok', async ({ request }) => {
    const res = await request.get(`${POST_DEPLOY_URL}/api/health`)
    expect(res.status(), 'health endpoint must be 200').toBe(200)
    const body = (await res.json()) as { status?: string; db?: string }
    expect(body.status).toBe('ok')
    expect(body.db).toBe('ok')
  })

  test('GET / returns 200 (public homepage renders)', async ({ request }) => {
    const res = await request.get(`${POST_DEPLOY_URL}/`)
    expect(res.status(), 'public homepage must be 200').toBe(200)
  })

  test('GET /admin reaches the SSO entry screen (spec 001)', async ({ page }) => {
    const response = await page.goto(`${POST_DEPLOY_URL}/admin`, { waitUntil: 'networkidle' })
    expect(response?.status(), '/admin must respond 200').toBe(200)
    // Spec 001 FR-001: "Sign in with Google" CTA is the primary
    // visible action on the admin login screen.
    await expect(page.getByText(/Sign in with Google/i)).toBeVisible()
  })

  test('HTTPS-only — HTTP requests redirect to HTTPS', async ({ request }) => {
    if (!POST_DEPLOY_URL?.startsWith('https://')) {
      test.skip(true, 'POST_DEPLOY_URL is not HTTPS; redirect check skipped')
      return
    }
    const httpUrl = POST_DEPLOY_URL.replace(/^https:/, 'http:')
    const res = await request.get(`${httpUrl}/`, { maxRedirects: 0 })
    expect([301, 302, 308]).toContain(res.status())
    const location = res.headers().location ?? ''
    expect(location).toMatch(/^https:/)
  })
})
