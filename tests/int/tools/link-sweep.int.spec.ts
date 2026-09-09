// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  classifyHref,
  normaliseRoute,
  scanText,
  GENERIC_PLACEHOLDER_PATTERNS,
  INTERNAL_REFERENCE_PATTERNS,
} from '../../../tools/link-sweep/checks'
import { parseArgs } from '../../../tools/link-sweep/args'
import { categorise, countsByCategory } from '../../../tools/link-sweep/report'
import type { SweepReport } from '../../../tools/link-sweep/crawl'
import { SKELETON_PLACEHOLDER_COPY } from '../../../src/payload/seed/skeletons/placeholderCopy'

/**
 * ROADMAP K8. The crawl itself needs a server, so it is exercised by running
 * the tool; what is pinned here is the classification it depends on — the part
 * that decides whether a finding is reported at all.
 */

const ORIGIN = 'https://preview.seqtek.com'

describe('classifyHref', () => {
  it('treats same-origin absolute and relative hrefs as one internal route', () => {
    expect(classifyHref('/services/localshoring', ORIGIN).route).toBe('/services/localshoring')
    expect(classifyHref(`${ORIGIN}/services/localshoring`, ORIGIN).route).toBe(
      '/services/localshoring',
    )
  })

  it('collapses a trailing slash so one page is not crawled and reported twice', () => {
    expect(classifyHref('/team/', ORIGIN).route).toBe('/team')
    expect(normaliseRoute('/')).toBe('/')
  })

  it('drops the hash, because it is the same document', () => {
    expect(classifyHref('/contact#form', ORIGIN).route).toBe('/contact')
  })

  it('keeps the query, because it is not', () => {
    expect(classifyHref('/insights?category=ai', ORIGIN).route).toBe('/insights?category=ai')
  })

  it.each([
    ['mailto:hello@seqtek.com', 'mailto'],
    ['tel:+19185550123', 'tel'],
    ['#main', 'anchor'],
    ['https://www.linkedin.com/company/seqtek', 'external'],
    ['javascript:void(0)', 'unparseable'],
    ['', 'unparseable'],
  ] as const)('classifies %s as %s', (href, kind) => {
    expect(classifyHref(href, ORIGIN).kind).toBe(kind)
  })

  it('does not treat a different host as internal just because the path matches', () => {
    expect(classifyHref('https://seqtek.com/team', ORIGIN).kind).toBe('external')
  })
})

describe('scanText', () => {
  it('catches every skeleton string, which is the list it shares with the source guard', () => {
    for (const phrase of SKELETON_PLACEHOLDER_COPY) {
      expect(scanText(`Intro. ${phrase} Outro.`)).toContainEqual(
        expect.objectContaining({ label: 'skeleton copy' }),
      )
    }
  })

  it('catches seeded placeholder copy that no skeleton produced', () => {
    // The exact string fifteen published service routes were serving.
    const findings = scanText('PLACEHOLDER COPY — NOT FOR PUBLICATION. Our local-delivery model.')
    expect(findings.map((f) => f.label)).toEqual(
      expect.arrayContaining(['placeholder marker', 'not for publication']),
    )
  })

  it('catches repo-internal references that reached rendered copy', () => {
    const findings = scanText('Real copy is Hank-gated (CONTENT_NEEDS.md §1.B).')
    expect(findings.map((f) => f.label)).toEqual(
      expect.arrayContaining(['repo doc filename', 'section reference']),
    )
  })

  it('reports a label once per page, so one noisy paragraph is one line', () => {
    const findings = scanText('placeholder placeholder placeholder')
    expect(findings.filter((f) => f.label === 'placeholder marker')).toHaveLength(1)
  })

  it('leaves real marketing copy alone', () => {
    const real =
      'Localshoring is how SEQTEK staffs your work: senior people who share your time zone, ' +
      'show up on site, and stay accountable for what they ship. We work where our clients are: ' +
      'Tulsa, Oklahoma City, Northwest Arkansas, and Kansas City.'
    expect(scanText(real)).toEqual([])
  })

  it('excerpts around the match rather than dumping the page', () => {
    const [finding] = scanText(`${'a '.repeat(400)}lorem ipsum${' b'.repeat(400)}`)
    expect(finding.excerpt.length).toBeLessThan(200)
    expect(finding.excerpt).toContain('lorem ipsum')
  })

  it('has no pattern that matches the empty string', () => {
    for (const { label, test } of [
      ...GENERIC_PLACEHOLDER_PATTERNS,
      ...INTERNAL_REFERENCE_PATTERNS,
    ]) {
      expect(test.test(''), label).toBe(false)
    }
  })
})

describe('parseArgs', () => {
  /** `parseArgs` reads one variable; the rest of ProcessEnv is noise it must ignore. */
  const env = (overrides: Record<string, string> = {}): NodeJS.ProcessEnv => ({
    NODE_ENV: 'test',
    ...overrides,
  })

  it('defaults to the local mirror', () => {
    expect(parseArgs([], env()).baseUrl).toBe('http://localhost:3100')
  })

  it('prefers SWEEP_BASE_URL over the default, and the flag over both', () => {
    const withBase = env({ SWEEP_BASE_URL: 'https://ww3.seqtek.com' })
    expect(parseArgs([], withBase).baseUrl).toBe('https://ww3.seqtek.com')
    expect(parseArgs(['--base-url=http://localhost:3000'], withBase).baseUrl).toBe(
      'http://localhost:3000',
    )
  })

  it('expands --fail-on=all and drops names that are not categories', () => {
    expect(parseArgs(['--fail-on=all'], env()).failOn).toEqual([
      'links',
      'images',
      'placeholders',
      'alt',
      'external',
      'redirects',
    ])
    expect(parseArgs(['--fail-on=links,nonsense'], env()).failOn).toEqual(['links'])
  })

  it('collects unknown arguments instead of ignoring them', () => {
    expect(parseArgs(['--basurl=x'], env()).unknown).toEqual(['--basurl=x'])
  })
})

describe('categorise', () => {
  const report: SweepReport = {
    baseUrl: ORIGIN,
    startedAt: '',
    finishedAt: '',
    externalStatuses: { 'https://example.com/gone': 404, 'https://example.com/ok': 200 },
    pages: [
      {
        route: '/',
        status: 200,
        referrers: [],
        title: 'Home',
        textFindings: [],
        imageFindings: {
          mobile: [{ src: '/media/hero.webp', alt: 'Hero', reason: 'not painting' }],
        },
        internalLinks: ['/gone'],
        externalLinks: [],
      },
      {
        route: '/gone',
        status: 404,
        referrers: ['/'],
        title: '',
        textFindings: [{ label: 'placeholder marker', excerpt: 'PLACEHOLDER' }],
        imageFindings: { desktop: [{ src: '/media/x.webp', alt: null, reason: 'missing alt' }] },
        internalLinks: [],
        externalLinks: [],
      },
    ],
  }

  it('separates a dead route from a broken image and keeps the referrer', () => {
    const found = categorise(report)
    expect(found.links).toEqual([
      { route: '/gone', status: 404, referrers: ['/'], error: undefined },
    ])
    expect(found.images).toEqual([{ route: '/', viewport: 'mobile', src: '/media/hero.webp' }])
  })

  it('separates a missing alt from an image that does not paint', () => {
    const found = categorise(report)
    expect(found.alt).toEqual([{ route: '/gone', viewport: 'desktop', src: '/media/x.webp' }])
    expect(countsByCategory(found)).toEqual({
      links: 1,
      images: 1,
      placeholders: 1,
      alt: 1,
      external: 1,
      redirects: 0,
    })
  })

  it('reports a 200 that rendered nothing, because empty must not read as clean', () => {
    const brokenScrape: SweepReport = {
      ...report,
      pages: [
        {
          route: '/',
          status: 200,
          referrers: [],
          title: '',
          textFindings: [],
          imageFindings: {},
          internalLinks: [],
          externalLinks: [],
          error: 'returned 200 but no links were scraped',
        },
      ],
    }
    expect(categorise(brokenScrape).links).toEqual([
      {
        route: '/',
        status: 200,
        referrers: [],
        error: 'returned 200 but no links were scraped',
      },
    ])
  })

  it('reports a route that landed somewhere else, with the pages linking it', () => {
    const redirecting: SweepReport = {
      ...report,
      pages: [
        {
          route: '/services',
          status: 200,
          referrers: ['/'],
          title: 'What We Do',
          textFindings: [],
          imageFindings: {},
          internalLinks: ['/services/strategy-and-alignment'],
          externalLinks: [],
          redirectedTo: '/services/what-we-do',
        },
      ],
    }
    expect(categorise(redirecting).redirects).toEqual([
      { route: '/services', to: '/services/what-we-do', referrers: ['/'] },
    ])
    // A redirect that resolves is not a dead link.
    expect(categorise(redirecting).links).toEqual([])
  })

  it('reports only the external links that actually failed', () => {
    expect(categorise(report).external).toEqual([{ url: 'https://example.com/gone', status: 404 }])
  })
})
