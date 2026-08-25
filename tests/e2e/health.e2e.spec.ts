import { expect, test } from '@playwright/test'

test.describe('GET /api/health', () => {
  test('returns 200 with the expected body shape when the DB is reachable', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control']).toBe('no-store')

    const body = await response.json()
    expect(body.status).toBe('ok')
    expect(body.db).toBe('ok')
    expect(typeof body.uptime).toBe('number')
    expect(body.uptime).toBeGreaterThan(0)
    expect(typeof body.responseTimeMs).toBe('number')
    expect(body.responseTimeMs).toBeGreaterThanOrEqual(0)
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date')

    // `commit` is baked at image build time; a local/dev run passes no ARG,
    // so assert the shape and the documented fallback rather than a build.
    expect(typeof body.commit).toBe('string')
    expect(body.commit).not.toBe('')

    // `release` is runtime metadata applied at promotion. It is null on any
    // lane that has not been released, which includes every local/dev run —
    // deliberately NOT falling back to a build-time version number.
    expect(body.release === null || typeof body.release === 'string').toBe(true)
  })

  test('non-GET methods return 405', async ({ request }) => {
    const response = await request.post('/api/health')
    expect(response.status()).toBe(405)
  })
})
