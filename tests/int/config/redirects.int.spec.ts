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
  // Internal route→route 301 from the About → Our Story rename.
  '/about',
  '/our-services',
  '/touchstone-workshops',
  '/touchstone-workshops/:slug*',
  '/blog-old',
  '/blog-old/:path*',
  '/post/:slug*',
  '/organizational-strategy-1-5',
  '/organizational-strategy-1-1-1-3',
  '/organizational-strategy-1-1-1-3-1',
  '/organizational-strategy-1-1-1-3-1-1',
  '/organizational-strategy-1-3-1-1-1',
  '/case-study-3',
  '/case-study-4',
  '/case-study-5',
  '/case-study-6',
  '/driving-innovation-case-study',
  '/modernizing-healthcare-case-study',
  // Workshops. Bare `/workshops` is absent because on Wix it is the abandoned
  // "Old Workshops Page"; `/workshops-1` was the live landing.
  '/workshops-1',
  '/re-align',
  '/fivedysfunctions-1',
  '/fivedysfunctions',
  '/casestudyws',
  '/organizational-strategy-1-1-1-4',
  '/tulsaacasestudyworkshop',
  '/tulsabcasestudyworkshop',
  '/okcacasestudyworkshop',
  '/okcbcasestudyworkshop',
  '/kcacasestudyworkshop',
  '/kcbcasestudyworkshop',
  '/nwarkacasestudyworkshop',
  '/nwarkbcasestudyworkshop',
  // Careers + the Wix role pages. "goverment" and "machione" carry the original
  // Wix typos on purpose — that is what is indexed.
  '/careers-1',
  '/careers',
  '/business-analyst',
  '/database-developer',
  '/front-end-developer',
  '/full-stack-developer',
  '/goverment-contract-specialist',
  '/java-developer',
  '/machione-learning-engineer',
  '/project-management',
  '/software-quality-assurance',
  '/ui-ux-developer',
  // The Wix AI Dev Guide lead magnet. Published ungated as an insight instead.
  '/ai-dev-guide-download',
  '/thank-you-download-guide',
  // The old Wix Services menu.
  '/organizational-strategy-1-1',
  '/organizational-strategy-1-1-1',
  '/organizational-strategy-1-1-1-1',
  '/organizational-strategy-1-1-1-2',
  '/organizational-strategy-1-1-1-2-1',
  '/organizational-strategy-1-1-1-2-1-1',
  '/organizational-strategy-1-1-2',
  '/organizational-strategy-1-1-3',
  '/organizational-strategy-1-2',
  '/organizational-strategy-1-2-1',
  '/organizational-strategy-1-3',
  '/organizational-strategy-1-3-1',
  '/organizational-strategy-1-3-1-1',
  '/organizational-strategy-1-4',
  '/technology-and-data',
  // feat/services-restructure — old 3-pillar / 9-service IA → four peer offerings.
  '/services/ai-automation',
  '/services/technology-data',
  '/services/organizational-strategy',
  '/services/ai-automation/ai-assisted-modernization',
  '/services/ai-automation/machine-learning-solutions',
  '/services/ai-automation/process-automation',
  '/services/technology-data/application-modernization',
  '/services/technology-data/cloud-data-engineering',
  '/services/technology-data/custom-software-development',
  '/services/organizational-strategy/team-workshops',
  '/services/organizational-strategy/fractional-product-ownership',
  '/services/organizational-strategy/strategy-alignment',
]

// Top-level segments with a dedicated nested route (data-model §1).
const ROUTABLE_PREFIXES = new Set(['case-studies', 'insights', 'services', 'workshops', 'team'])

// Destinations whose route is PLANNED but not built — explicitly allowlisted so
// RM3 doesn't silently pass on a typo, and the deferral is visible (no silent
// cap). Empty since the maturity assessment was retired (2026-08-08): its
// /resources/* destination was the only deferred route, and every destination in
// the map now resolves to a built route. Keep the mechanism for the next one.
const DEFERRED_DESTINATIONS = new Set<string>([])

// Detail (per-slug) destinations allowed BECAUSE THE CONTENT EXISTS. Route shape
// is not content: a routable prefix says nothing about whether the page behind
// the slug was ever written. A redirect may target a per-slug page ONLY if that
// slug is listed here; otherwise send it to the listing.
const KNOWN_DETAIL_DESTINATIONS = new Set<string>([
  // Verified against docs/content-drafts/workshops.json.
  '/workshops/touchstone',
  '/workshops/re-alignment',
  '/workshops/five-dysfunctions',
  // The three peer offerings. Not content slugs — a fixed enum in
  // src/app/(frontend)/services/[offering]/page.tsx (OFFERING_TO_SLUG), so the
  // route exists as long as the seeded `service-*` Page does.
  '/services/localshoring',
  '/services/ai-integration',
  '/services/digital-transformation',
  // Verified against docs/content-drafts/posts-content.json.
  '/insights/the-skill-shift',
])

// The 18 Wix blog posts were retired rather than migrated, so these sources
// flatten their children onto the listing instead of carrying the wildcard
// through to a successor that does not exist.
const FLATTENED_SOURCES = new Set<string>(['/blog-old/:path*', '/post/:slug*'])

const isRoutable = (destination: string): boolean => {
  if (DEFERRED_DESTINATIONS.has(destination)) return true
  if (KNOWN_DETAIL_DESTINATIONS.has(destination)) return true
  const segments = destination.replace(/^\//, '').split('/')
  if (segments.length === 1) return true // flat /[slug] pages route
  if (segments.length === 2 && segments[1].startsWith(':')) {
    return ROUTABLE_PREFIXES.has(segments[0]) // wildcard passthrough
  }
  return false
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
    // Any named wildcard (`:path*`, `:slug*`, ...) — not just the literal
    // `:path*` — must survive into the destination, or the redirect flattens
    // every child URL onto the bare parent (PR #49 review hardening).
    const wildcard = /:[a-zA-Z]+\*/
    for (const r of redirectMap) {
      if (FLATTENED_SOURCES.has(r.source)) continue
      const m = r.source.match(wildcard)
      if (m) {
        expect(r.destination, `${r.source} → ${r.destination}`).toContain(m[0])
      }
    }
  })
})
