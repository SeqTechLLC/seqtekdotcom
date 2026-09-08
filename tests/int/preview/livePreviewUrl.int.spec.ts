import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
  // collection `partners` joins them. ROADMAP SVC-2 restores `services`, which
  // is a routed block-composed collection again. IND-1 adds `industries`.
  it.each([
    'pages',
    'posts',
    'caseStudies',
    'services',
    'workshops',
    'teamMembers',
    'partners',
    'industries',
  ] as const)('accepts %s', (slug) => {
    expect(isPreviewCollection(slug)).toBe(true)
  })

  it.each(['users', 'media', 'unknown', ''])('rejects %s', (slug) => {
    expect(isPreviewCollection(slug)).toBe(false)
  })

  it('PREVIEW_COLLECTIONS is exactly the eight supported collections', () => {
    // SVC-2 re-added `services`: spec 011 T017 had dropped it while it had no
    // public route, and `/services/[slug]` gives it one for all three tiers.
    // IND-1 added `industries` for the same reason.
    expect(new Set(PREVIEW_COLLECTIONS)).toEqual(
      new Set([
        'pages',
        'posts',
        'caseStudies',
        'services',
        'workshops',
        'teamMembers',
        'partners',
        'industries',
      ]),
    )
  })

  // The structural defect that let `industries` ship a dead draft branch:
  // `src/lib/preview.ts` declares its OWN union, also called
  // `PreviewCollection`, and nothing tied the two together. IND-1 added
  // `industries` to that one and not to this one, so `getDraftBySlug` accepted
  // it while `/preview/[collection]/[slug]` answered `404 unsupported
  // collection` — the route's whole draft path was unreachable.
  it('the two PreviewCollection unions agree', () => {
    const previewTs = readFileSync(
      resolve(import.meta.dirname, '../../../src/lib/preview.ts'),
      'utf8',
    )
    const block = previewTs.slice(
      previewTs.indexOf('export type PreviewCollection'),
      previewTs.indexOf('export const getDraftBySlug'),
    )
    const declared = [...block.matchAll(/\|\s*'([a-zA-Z]+)'/g)].map((m) => m[1])
    expect(declared.length).toBeGreaterThan(0)
    expect(new Set(declared)).toEqual(new Set(PREVIEW_COLLECTIONS))
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

  // ROADMAP SVC-2: one flat namespace for all three tiers, so a group and an
  // axis page preview through the same builder as a leaf. Spec 011 T017 had
  // removed this while PR #79's route deletion left nothing to preview into.
  it('services → /services/<slug>, whatever the tier', () => {
    expect(publicPathFor('services', { slug: 'localshoring' })).toBe('/services/localshoring')
    expect(publicPathFor('services', { slug: 'technology-and-data' })).toBe(
      '/services/technology-and-data',
    )
    expect(isPreviewCollection('services')).toBe(true)
    expect(PREVIEW_COLLECTIONS).toContain('services')
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
