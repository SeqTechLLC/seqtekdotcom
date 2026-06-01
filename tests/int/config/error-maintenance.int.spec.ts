// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextRequest } from 'next/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { proxy } from '../../../src/proxy'
import { findPublishedBySlug, getPayloadInstance } from '../../../src/lib/payload'

/**
 * spec 004 T041 (error-pages.md). Proxy maintenance + request-id behaviour and
 * the no-draft-leak / no-data-leak guards.
 *   E1 — unknown slug resolves to null → route calls notFound() → 404
 *   E3 — x-request-id present on responses
 *   E4 — MAINTENANCE_MODE=true → 503 for /, but 200 for /api/health
 *   E5 — error pages render no draft/internal data
 */

const req = (path: string) => new NextRequest(new URL(`http://localhost${path}`))

afterEach(() => {
  delete process.env.MAINTENANCE_MODE
})

describe('E4 — maintenance mode', () => {
  it('returns 503 for a normal path', () => {
    process.env.MAINTENANCE_MODE = 'true'
    const res = proxy(req('/'))
    expect(res.status).toBe(503)
  })

  it('lets /api/health through (must stay 200 for the ALB)', () => {
    process.env.MAINTENANCE_MODE = 'true'
    const res = proxy(req('/api/health'))
    expect(res.status).not.toBe(503)
    expect(res.status).toBe(200)
  })

  it('off by default — / is not short-circuited', () => {
    const res = proxy(req('/'))
    expect(res.status).not.toBe(503)
  })
})

describe('E3 — request id', () => {
  it('attaches x-request-id to responses', () => {
    const res = proxy(req('/case-studies'))
    const id = res.headers.get('x-request-id')
    expect(id).toBeTruthy()
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('also sets a JS-readable x-request-id cookie for the client error pages', () => {
    const res = proxy(req('/'))
    expect(res.cookies.get('x-request-id')?.value).toBeTruthy()
  })
})

describe('E1 — unknown slug resolves to null (route then calls notFound)', () => {
  beforeAll(async () => {
    await getPayloadInstance()
  })
  it('findPublishedBySlug returns null for a slug that does not exist', async () => {
    const doc = await findPublishedBySlug('pages', 'definitely-not-a-real-slug-e1')
    expect(doc).toBeNull()
  })
})

describe('E5 — error pages leak no draft/internal data', () => {
  const root = resolve(__dirname, '../../..')
  const errorSrc = readFileSync(resolve(root, 'src/app/(frontend)/error.tsx'), 'utf8')
  const globalErrorSrc = readFileSync(resolve(root, 'src/app/(frontend)/global-error.tsx'), 'utf8')

  it('error.tsx renders neither error.message nor error.stack', () => {
    expect(errorSrc).not.toMatch(/error\.message/)
    expect(errorSrc).not.toMatch(/error\.stack/)
  })

  it('global-error.tsx renders neither error.message nor error.stack', () => {
    expect(globalErrorSrc).not.toMatch(/error\.message/)
    expect(globalErrorSrc).not.toMatch(/error\.stack/)
  })

  it('error pages do not import the Payload data layer', () => {
    expect(errorSrc).not.toMatch(/@\/lib\/payload/)
    expect(globalErrorSrc).not.toMatch(/@\/lib\/payload/)
  })
})
