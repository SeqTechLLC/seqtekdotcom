// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * T125 / spec 003 Polish / contract `revalidate-route.md`.
 *
 * Hits the POST `/api/revalidate` route handler directly (not over HTTP).
 * The route's behaviour:
 *   - 401 on missing/wrong `Authorization: Bearer ...` header (constant-time).
 *   - 400 on malformed JSON or empty/non-string `tags`/`paths`.
 *   - 200 with `{ revalidated, ms }` on success.
 *   - 500 on CloudFront SDK failure.
 *
 * `next/cache.revalidateTag` is mocked because it throws outside a request
 * scope. `invalidateCloudFrontPaths` is mocked so we don't hit AWS.
 */

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

vi.mock('@/lib/cloudfront/invalidate', () => ({
  invalidateCloudFrontPaths: vi.fn(async () => ({ invalidated: 0, skipped: true })),
}))

const SECRET = 'test-revalidation-secret'
const ROUTE_URL = 'http://localhost/api/revalidate'

beforeAll(() => {
  process.env.REVALIDATION_SECRET = SECRET
})

afterEach(() => {
  vi.clearAllMocks()
})

async function postRoute(
  headers: Record<string, string>,
  body: string | object,
): Promise<Response> {
  // Re-import per test to pick up env changes; in practice the module
  // captures REVALIDATION_SECRET at request time so this isn't needed,
  // but it makes mock-reset cleanly.
  const { POST } = await import('../../../src/app/(frontend)/api/revalidate/route')
  const init: RequestInit = {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }
  const req = new Request(ROUTE_URL, init)
  return POST(req as unknown as Parameters<typeof POST>[0])
}

describe('POST /api/revalidate (T125 / contract revalidate-route.md)', () => {
  it('401 when Authorization header is missing', async () => {
    const res = await postRoute({}, { tags: ['x'] })
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/invalid secret/i)
  })

  it('401 when Authorization presents wrong secret', async () => {
    const res = await postRoute({ authorization: 'Bearer not-the-secret' }, { tags: ['x'] })
    expect(res.status).toBe(401)
  })

  it('400 when body is malformed JSON', async () => {
    const res = await postRoute({ authorization: `Bearer ${SECRET}` }, '{not-json')
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/invalid JSON/i)
  })

  it('400 when both tags and paths are missing', async () => {
    const res = await postRoute({ authorization: `Bearer ${SECRET}` }, {})
    expect(res.status).toBe(400)
  })

  it('400 when tags contains a non-string', async () => {
    const res = await postRoute(
      { authorization: `Bearer ${SECRET}` },
      { tags: ['ok', 42], paths: [] },
    )
    expect(res.status).toBe(400)
  })

  it('400 when paths contains an empty string', async () => {
    const res = await postRoute(
      { authorization: `Bearer ${SECRET}` },
      { tags: [], paths: ['', '/about'] },
    )
    expect(res.status).toBe(400)
  })

  it('400 when both arrays are present but empty', async () => {
    const res = await postRoute({ authorization: `Bearer ${SECRET}` }, { tags: [], paths: [] })
    expect(res.status).toBe(400)
  })

  it('200 with counts + ms on valid request', async () => {
    const cf = await import('@/lib/cloudfront/invalidate')
    vi.mocked(cf.invalidateCloudFrontPaths).mockResolvedValueOnce({
      invalidated: 1,
      skipped: false,
    })
    const res = await postRoute(
      { authorization: `Bearer ${SECRET}` },
      { tags: ['caseStudies_list'], paths: ['/case-studies'] },
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.revalidated).toEqual({ tags: 1, paths: 1 })
    expect(typeof json.ms).toBe('number')
    expect(cf.invalidateCloudFrontPaths).toHaveBeenCalledWith(['/case-studies'])
  })

  it('500 when CloudFront SDK throws', async () => {
    const cf = await import('@/lib/cloudfront/invalidate')
    vi.mocked(cf.invalidateCloudFrontPaths).mockRejectedValueOnce(new Error('AWS down'))
    const res = await postRoute(
      { authorization: `Bearer ${SECRET}` },
      { tags: ['x'], paths: ['/about'] },
    )
    expect(res.status).toBe(500)
  })
})
