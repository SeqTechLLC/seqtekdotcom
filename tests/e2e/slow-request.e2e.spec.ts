import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { expect, test } from '@playwright/test'

/**
 * spec 007 US3 (T020/T021) — slow/hung server reads fall through to the branded
 * error page within the 5s budget, and the health probe is exempt by
 * construction. Authoritative behavioural proof for contracts C-3/C-4 and
 * SC-005/SC-006.
 *
 * Injection: the reader layer honours a dev-only sentinel slug
 * (`TEST_TIMEOUT_PROBE_SLUG = '__timeout_probe__'`) — visiting
 * `/case-studies/__timeout_probe__` drives a real `getCaseStudyBySlug` call
 * past the budget without touching any other reader/test on the shared dev
 * server. This suite seeds NOTHING (so it never collides with the seeded a11y/
 * marquee suites); it warms the dynamic route with a throw-away first hit so
 * the budget measurement excludes dev first-compile time. The exact warn-log
 * record + `headers()` requestId are asserted deterministically in
 * `tests/int/lib/read-timeout.int.spec.ts`.
 */

const PROBE_PATH = '/case-studies/__timeout_probe__'

test.describe('US3 — slow/hung reads fall through to error.tsx (T020)', () => {
  test('(a) a >5s read renders the branded error page within ~5s + a visible request id', async ({
    page,
  }) => {
    // Warm the dynamic route (first dev hit compiles it; not measured).
    await page.goto(PROBE_PATH, { waitUntil: 'domcontentloaded' }).catch(() => undefined)
    await expect(page.getByTestId('error-boundary')).toBeVisible()

    const started = Date.now()
    const res = await page.goto(PROBE_PATH, { waitUntil: 'domcontentloaded' })
    const elapsedMs = Date.now() - started

    // The branded segment error boundary renders (not a 404, not a hang).
    await expect(page.getByTestId('error-boundary')).toBeVisible()
    // It waited out the ~5s budget rather than 404ing instantly, and did NOT
    // hang (generous ceiling, well under any perceived freeze).
    expect(elapsedMs, `error rendered in ${elapsedMs}ms`).toBeGreaterThan(4_000)
    expect(elapsedMs, `error rendered in ${elapsedMs}ms (looks like a hang)`).toBeLessThan(15_000)

    // SC-005 — the id the visitor sees on error.tsx equals the response's
    // x-request-id (proxy set both header + cookie to the same value).
    const headerId = res?.headers()['x-request-id']
    expect(headerId, 'response is missing the x-request-id header').toBeTruthy()
    await expect(page.getByTestId('error-request-id')).toHaveText(headerId!)
  })

  test('(b) a healthy (<5s) read renders normally with no error boundary (FR-013/SC-006)', async ({
    page,
  }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
    await expect(page.getByTestId('homepage')).toBeVisible()
    await expect(page.getByTestId('error-boundary')).toHaveCount(0)
  })
})

test.describe('US3 — health probe is exempt by construction (T021)', () => {
  test('the health route imports none of the guarded payload.ts readers (C-3)', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/app/(payload)/api/health/route.ts'),
      'utf8',
    )
    // It must NOT pull in the reader layer (a slow content query must never be
    // able to cycle the instance via the health check).
    expect(src).not.toMatch(/@\/lib\/payload|lib\/payload/)
    // It pings the DB through its own getPayload, not the cached readers.
    expect(src).toMatch(/from 'payload'/)
  })

  test('GET /api/health returns 200 while a content reader is timing out elsewhere (FR-014)', async ({
    page,
  }) => {
    const [, health] = await Promise.all([
      // Kick off a request that will time out; we don't care about its result.
      page.request.get(PROBE_PATH).catch(() => null),
      page.request.get('/api/health'),
    ])
    expect(health.status()).toBe(200)
    const body = (await health.json()) as { status: string; db: string }
    expect(body.status).toBe('ok')
    expect(body.db).toBe('ok')
  })
})
