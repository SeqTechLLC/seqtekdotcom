import { afterEach, describe, expect, it } from 'vitest'

import {
  buildPreviewUrl,
  isPreviewCollection,
  publicPathFor,
  PREVIEW_COLLECTIONS,
  previewBreakpoints,
} from '../../../src/payload/livePreview/url'

// Contract: specs/003-phase-2-content-models/contracts/live-preview-urls.md
// (T078 / FR-019).

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  if (ORIGINAL_SITE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL
  }
})

describe('isPreviewCollection', () => {
  // spec 010 (R6): workshops + teamMembers gain live preview alongside the
  // original four (type-generic cross-cutting wiring). ADR 0009 metadata
  // collection `partners` joins them.
  it.each(['pages', 'posts', 'caseStudies', 'workshops', 'teamMembers', 'partners'] as const)(
    'accepts %s',
    (slug) => {
      expect(isPreviewCollection(slug)).toBe(true)
    },
  )

  // spec 011 T017: `services` moved from accepted to rejected — PR #79 retired
  // the routes its preview URL pointed at.
  it.each(['users', 'media', 'services', 'unknown', ''])('rejects %s', (slug) => {
    expect(isPreviewCollection(slug)).toBe(false)
  })

  it('PREVIEW_COLLECTIONS is exactly the six supported collections', () => {
    // spec 011 T017: `services` dropped — it has no public route to preview into.
    expect(new Set(PREVIEW_COLLECTIONS)).toEqual(
      new Set(['pages', 'posts', 'caseStudies', 'workshops', 'teamMembers', 'partners']),
    )
  })
})

describe('publicPathFor', () => {
  it('pages → /<slug>', () => {
    expect(publicPathFor('pages', { slug: 'our-mission' })).toBe('/our-mission')
  })

  it('posts → /insights/<slug>', () => {
    expect(publicPathFor('posts', { slug: 'why-localshoring' })).toBe('/insights/why-localshoring')
  })

  it('caseStudies → /case-studies/<slug>', () => {
    expect(publicPathFor('caseStudies', { slug: 'mobile-apps-remote-operations' })).toBe(
      '/case-studies/mobile-apps-remote-operations',
    )
  })

  // spec 011 T017: `services` is no longer a preview collection. PR #79 retired
  // the `/services/[pillar]` routes, so its builder had been producing preview
  // URLs into 404s. The collection survives as typed metadata with no public page.
  it('services is not a preview collection', () => {
    expect(isPreviewCollection('services')).toBe(false)
    expect(PREVIEW_COLLECTIONS).not.toContain('services')
  })

  it('workshops → /workshops/<slug> (spec 010)', () => {
    expect(publicPathFor('workshops', { slug: 'touchstone' })).toBe('/workshops/touchstone')
  })

  it('partners → /partners/<slug> (ADR 0009)', () => {
    expect(publicPathFor('partners', { slug: 'accesseva' })).toBe('/partners/accesseva')
  })

  it('teamMembers → /team/<slug> (spec 010)', () => {
    expect(publicPathFor('teamMembers', { slug: 'dana-dudley' })).toBe('/team/dana-dudley')
  })

  it('returns null when slug is missing for any collection', () => {
    for (const c of PREVIEW_COLLECTIONS) {
      expect(publicPathFor(c, {})).toBeNull()
    }
  })
})

describe('buildPreviewUrl', () => {
  it('returns a fully-qualified URL using NEXT_PUBLIC_SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://seqtek-preview.com'
    expect(buildPreviewUrl('pages', { slug: 'our-mission' })).toBe(
      'https://seqtek-preview.com/preview/pages/our-mission',
    )
  })

  it('falls back to localhost:3100 when NEXT_PUBLIC_SITE_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(buildPreviewUrl('posts', { slug: 'why-localshoring' })).toBe(
      'http://localhost:3100/preview/posts/why-localshoring',
    )
  })

  it('URL-encodes the slug', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.test'
    // Slugs are validated to be kebab-case, but the builder still encodes
    // defensively — verify the encoder is wired.
    expect(buildPreviewUrl('caseStudies', { slug: 'a b' })).toBe(
      'https://example.test/preview/caseStudies/a%20b',
    )
  })

  it('returns null when slug is missing', () => {
    expect(buildPreviewUrl('pages', {})).toBeNull()
  })

  it('returns null for unsupported collections (defence in depth)', () => {
    expect(buildPreviewUrl('users', { slug: 'admin' })).toBeNull()
  })

  it('does NOT embed PREVIEW_SECRET in the URL (regression guard)', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://seqtek-preview.com'
    process.env.PREVIEW_SECRET = 'must-not-leak'
    const url = buildPreviewUrl('pages', { slug: 'our-mission' })
    expect(url).not.toContain('secret')
    expect(url).not.toContain('must-not-leak')
    delete process.env.PREVIEW_SECRET
  })
})

describe('previewBreakpoints', () => {
  it('ships the canonical mobile / tablet / desktop set', () => {
    const names = previewBreakpoints.map((b) => b.name)
    expect(names).toEqual(['mobile', 'tablet', 'desktop'])
  })
})
