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
 * The `/` and `/admin` checks below tolerate TWO valid outcomes rather
 * than asserting exactly one: this same suite runs against both a
 * cognitoAuthEnabled lane (preview.seqtek.com / ww3.seqtek.com, added
 * 2026-08-12 — see infra/lib/cognito-auth.ts) and an ungated one
 * (seqtek-preview.com). On a gated lane, anonymous access correctly
 * redirects to the Cognito Hosted UI instead of 200ing — that's the
 * FEATURE, not a broken deploy — so the assertion is "reached a real
 * login surface, whichever one this lane has" rather than a fixed status
 * code. /api/health stays a hard 200 on every lane: compute-stack.ts
 * carves it out of the Cognito gate specifically so this suite (and any
 * uptime monitor) can't be confused with a real outage.
 *
 * Failure semantics: any assertion failing in this file should report
 * to the deploy workflow as a failed deploy, which then triggers the
 * FR-015 zero-customer-5xx rollback path (previous image stays in
 * service).
 */
import { expect, test } from '@playwright/test'

const POST_DEPLOY_URL = process.env.POST_DEPLOY_URL
// Set by deploy.yml only on the release/promotion path, where it is the exact
// value `RELEASE_VERSION` was deployed with. Empty on a merge to `main` — that
// path deploys the primary lane, which carries no release by design — and the
// assertion below is skipped when it is empty.
const EXPECT_RELEASE_VERSION = process.env.EXPECT_RELEASE_VERSION
const COGNITO_HOSTED_UI_PATTERN = /\.auth\.[a-z0-9-]+\.amazoncognito\.com\//

test.describe('post-deploy smoke', () => {
  test.skip(!POST_DEPLOY_URL, 'POST_DEPLOY_URL not set — skipping post-deploy smoke')

  test('GET /api/health returns 200 with status=ok', async ({ request }) => {
    const res = await request.get(`${POST_DEPLOY_URL}/api/health`)
    expect(res.status(), 'health endpoint must be 200 on every lane, gated or not').toBe(200)
    const body = (await res.json()) as { status?: string; db?: string; release?: string | null }
    expect(body.status).toBe('ok')
    expect(body.db).toBe('ok')

    // A promotion that reports no release is the #122 defect: the deploy
    // succeeds, the lane serves the right image, and `release` comes back null
    // because RELEASE_VERSION reached `cdk deploy` empty. Nothing asserted it,
    // so it shipped green. Pin the exact value, not just non-null — a wrong
    // label is as bad as a missing one.
    if (EXPECT_RELEASE_VERSION) {
      expect(
        body.release,
        `promoted lane must report the release it was deployed with (${EXPECT_RELEASE_VERSION})`,
      ).toBe(EXPECT_RELEASE_VERSION)
    }
  })

  test('GET / responds (public homepage, or the Cognito gate if this lane is gated)', async ({
    request,
  }) => {
    const res = await request.get(`${POST_DEPLOY_URL}/`, { maxRedirects: 0 })
    if (res.status() >= 300 && res.status() < 400) {
      const location = res.headers().location ?? ''
      expect(location, 'a redirect off / must be the Cognito gate, nothing else').toMatch(
        COGNITO_HOSTED_UI_PATTERN,
      )
      return
    }
    expect(res.status(), 'an ungated public homepage must be 200').toBe(200)
  })

  test('GET /admin reaches a login screen (spec 001 SSO, or the Cognito gate if this lane is gated)', async ({
    page,
  }) => {
    const response = await page.goto(`${POST_DEPLOY_URL}/admin`, { waitUntil: 'networkidle' })
    expect(response?.status(), '/admin must respond 200 somewhere in the redirect chain').toBe(200)
    if (COGNITO_HOSTED_UI_PATTERN.test(page.url())) {
      // Gated lane: Cognito's OWN Hosted UI IS this lane's login screen —
      // the app's /admin never rendered, by design.
      return
    }
    // Ungated lane: spec 001 FR-001 — "Sign in with Google" CTA is the
    // primary visible action on the app's OWN admin login screen.
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
