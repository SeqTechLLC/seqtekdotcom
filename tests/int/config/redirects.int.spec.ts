// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { redirectMap } from '../../../src/lib/redirects'

/**
 * spec 004 T040 (redirect-map.md). The 301 map from old Wix URLs. Distinct
 * from src/payload/seed/slugRewrites.ts (bare slugs for the seed).
 */

// The non-identity sources from INTEGRATIONS.md §9 (the two identity rows
// /contact → /contact and /privacy-policy → /privacy-policy are intentionally
// excluded — a self-redirect is a loop, not a redirect).
const EXPECTED_SOURCES = [
  '/about-us-1',
  '/our-services',
  '/workshops',
  '/blog-old',
  '/blog-old/:path*',
  '/organizational-strategy-1-5',
  '/organizational-strategy-1-1-1-3',
  '/organizational-strategy-1-1-1-3-1',
  '/organizational-strategy-1-1-1-3-1-1',
  '/organizational-strategy-1-3-1-1-1',
  '/case-study-3',
  '/case-study-4',
  '/case-study-5',
  '/driving-innovation-case-study',
  '/modernizing-healthcare-case-study',
]

// Top-level segments with a dedicated nested route (data-model §1).
const ROUTABLE_PREFIXES = new Set([
  'case-studies',
  'insights',
  'services',
  'touchstone-workshops',
  'team',
])

// Destinations whose route is PLANNED but not built in spec 004 — explicitly
// allowlisted so RM3 doesn't silently pass on a typo, and the deferral is
// visible (no silent cap). /resources/* is the ScoreApp assessment (ARCH §3).
const DEFERRED_DESTINATIONS = new Set(['/resources/organizational-maturity-assessment'])

const isRoutable = (destination: string): boolean => {
  if (DEFERRED_DESTINATIONS.has(destination)) return true
  const segments = destination.replace(/^\//, '').split('/')
  if (segments.length === 1) return true // flat /[slug] pages route
  return ROUTABLE_PREFIXES.has(segments[0])
}

describe('301 redirect map', () => {
  it('RM1 — every entry is permanent (301/308)', () => {
    for (const r of redirectMap) {
      expect(r.permanent, `${r.source} should be permanent`).toBe(true)
    }
  })

  it('RM2 — every source and destination is a root-relative path', () => {
    for (const r of redirectMap) {
      expect(r.source.startsWith('/'), `source ${r.source}`).toBe(true)
      expect(r.destination.startsWith('/'), `destination ${r.destination}`).toBe(true)
    }
  })

  it('RM3 — no destination 404s against the route inventory', () => {
    for (const r of redirectMap) {
      expect(isRoutable(r.destination), `destination ${r.destination} has no route`).toBe(true)
    }
  })

  it('RM4 — covers exactly the non-identity INTEGRATIONS §9 sources', () => {
    const sources = redirectMap.map((r) => r.source).sort()
    expect(sources).toEqual([...EXPECTED_SOURCES].sort())
  })

  it('has no duplicate sources', () => {
    const sources = redirectMap.map((r) => r.source)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('wildcard sources carry the wildcard through to the destination', () => {
    for (const r of redirectMap) {
      if (r.source.includes(':path*')) {
        expect(r.destination, `${r.source} → ${r.destination}`).toContain(':path*')
      }
    }
  })
})
