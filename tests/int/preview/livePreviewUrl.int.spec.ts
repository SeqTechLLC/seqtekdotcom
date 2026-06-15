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
  // original four (type-generic cross-cutting wiring).
  it.each(['pages', 'posts', 'caseStudies', 'services', 'workshops', 'teamMembers'] as const)(
    'accepts %s',
    (slug) => {
      expect(isPreviewCollection(slug)).toBe(true)
    },
  )

  it.each(['users', 'media', 'unknown', ''])('rejects %s', (slug) => {
    expect(isPreviewCollection(slug)).toBe(false)
  })

  it('PREVIEW_COLLECTIONS is exactly the six supported collections', () => {
    expect(new Set(PREVIEW_COLLECTIONS)).toEqual(
      new Set(['pages', 'posts', 'caseStudies', 'services', 'workshops', 'teamMembers']),
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

  it('services with resolved pillar → /services/<pillar>/<slug>', () => {
    expect(
      publicPathFor('services', {
        slug: 'mobile-engineering',
        pillar: { slug: 'application-development' },
      }),
    ).toBe('/services/application-development/mobile-engineering')
  })

  it('services without pillar object (e.g. depth=0 fetch) falls back to /services/<slug>', () => {
    expect(publicPathFor('services', { slug: 'partial-draft' })).toBe('/services/partial-draft')
    // String ID instead of populated pillar — same fallback applies.
    expect(publicPathFor('services', { slug: 'partial-draft', pillar: 'pillar-id' })).toBe(
      '/services/partial-draft',
    )
  })

  it('workshops → /workshops/<slug> (spec 010)', () => {
    expect(publicPathFor('workshops', { slug: 'touchstone' })).toBe('/workshops/touchstone')
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
