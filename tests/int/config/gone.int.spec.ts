// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'

import { redirectMap } from '../../../src/lib/redirects'
import { GONE_HTML, RETIRED_PREFIXES, isRetiredPath } from '../../../src/lib/gone'
import { proxy } from '../../../src/proxy'

/**
 * 410 Gone (src/lib/gone.ts, enforced in src/proxy.ts). Companion to the RM
 * suite: that one governs 301s to a successor, this one governs URLs with no
 * successor by design.
 */
describe('410 retired URL space', () => {
  it('G1 — matches the prefix itself and everything beneath it', () => {
    expect(isRetiredPath('/feeds')).toBe(true)
    expect(isRetiredPath('/feeds/')).toBe(true)
    expect(isRetiredPath('/feeds/blog/ai-oil-gas')).toBe(true)
    expect(isRetiredPath('/feeds/service/it-consulting-services')).toBe(true)
  })

  it('G2 — does not match siblings that merely share the prefix string', () => {
    expect(isRetiredPath('/feedstock')).toBe(false)
    expect(isRetiredPath('/feeds-archive')).toBe(false)
  })

  it('G3 — leaves the live site alone', () => {
    for (const live of [
      '/',
      '/insights',
      '/case-studies',
      // `/services` moved out of this list: it is a 301 now, not a live page.
      // G3 asserts the 410 map leaves live routes alone, and a redirecting URL
      // is neither gone nor live — the axis page below is what to assert on.
      '/services/what-we-do',
      '/workshops',
      '/team',
      '/contact',
      '/privacy-policy',
      '/api/health',
      '/admin/login',
    ]) {
      expect(isRetiredPath(live), `${live} must not 410`).toBe(false)
    }
  })

  it('G4 — no redirect targets retired space, and no retired path is redirected', () => {
    // A 301 out of retired space would pass on the topical signal that 410 was
    // chosen to avoid.
    for (const r of redirectMap) {
      expect(isRetiredPath(r.destination), `${r.source} → ${r.destination} lands on a 410`).toBe(
        false,
      )
      expect(isRetiredPath(r.source), `${r.source} is retired but also redirected`).toBe(false)
    }
  })

  it('G5 — the tombstone body is noindex and offers a way back', () => {
    expect(GONE_HTML).toContain('name="robots" content="noindex"')
    expect(GONE_HTML).toContain('href="/insights"')
    expect(GONE_HTML).toContain('href="/contact"')
  })

  it('G6 — every retired prefix is a root-relative path with no trailing slash', () => {
    for (const p of RETIRED_PREFIXES) {
      expect(p.startsWith('/'), `${p}`).toBe(true)
      expect(p.endsWith('/'), `${p} must not carry a trailing slash`).toBe(false)
    }
  })
})

const req = (path: string) => new NextRequest(new URL(`http://localhost${path}`))

afterEach(() => {
  delete process.env.MAINTENANCE_MODE
})

describe('410 in the proxy', () => {
  it('G7 — a retired path is served 410 with a noindex header', () => {
    const res = proxy(req('/feeds/blog/ai-oil-gas'))
    expect(res.status).toBe(410)
    expect(res.headers.get('x-robots-tag')).toBe('noindex')
  })

  it('G8 — a live path is not short-circuited', () => {
    expect(proxy(req('/insights')).status).not.toBe(410)
  })

  it('G9 — maintenance mode outranks the 410', () => {
    process.env.MAINTENANCE_MODE = 'true'
    expect(proxy(req('/feeds')).status).toBe(503)
  })
})
