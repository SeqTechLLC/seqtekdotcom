// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  classifyHref,
  normaliseRoute,
  isExcluded,
  scanStyle,
  scanText,
  DEFAULT_THIN_COPY_THRESHOLD,
  GENERIC_PLACEHOLDER_PATTERNS,
  INTERNAL_REFERENCE_PATTERNS,
} from '../../../tools/link-sweep/checks'
import { CATEGORIES, parseArgs } from '../../../tools/link-sweep/args'
import { categorise, countsByCategory, format } from '../../../tools/link-sweep/report'
import { SCRAPE_SOURCE, SCROLL_SOURCE, type SweepReport } from '../../../tools/link-sweep/crawl'
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

describe('scanStyle', () => {
  it('finds an em dash in rendered copy', () => {
    expect(scanStyle('Quality with speed — never lose the beat.')).toEqual([
      expect.objectContaining({ label: 'em dash' }),
    ])
  })

  it('passes copy that uses hyphens and en dashes', () => {
    expect(scanStyle('A feature-for-feature rebuild, 2023–2024, at a fixed price.')).toEqual([])
  })

  it('does NOT re-report placeholder copy as a style breach', () => {
    // `scanStyle` used to share `scanText`, whose skeleton loop runs whatever
    // patterns are passed — so every placeholder page also landed in the style
    // list, and the two counts moved together.
    const placeholder = SKELETON_PLACEHOLDER_COPY[0]
    expect(scanStyle(`Intro. ${placeholder} Outro.`)).toEqual([])
    expect(scanText(`Intro. ${placeholder} Outro.`).length).toBeGreaterThan(0)
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

  it('catches a two-digit roadmap id, which `\\d` could not', () => {
    // `\bSVC-\d\b` needs a word boundary after one digit, so the second
    // digit defeated it. Every id in use today is single-digit; this keeps it
    // working when one is not.
    expect(scanText('Real copy pending SVC-12.').map((f) => f.label)).toContain('roadmap item id')
    expect(scanText('Tracked as IND-10.').map((f) => f.label)).toContain('roadmap item id')
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

describe('SCRAPE_SOURCE', () => {
  /**
   * Both of this tool's first two runs failed inside `page.evaluate`, in ways
   * that reported as a clean site rather than as an error. These pin the shape
   * that avoids each, and they run through the same transpiler the tool does —
   * which is the point, since one of the bugs was introduced by the transpiler.
   */
  it('is an IIFE, so evaluate returns the object rather than the function', () => {
    expect(SCRAPE_SOURCE.startsWith('(')).toBe(true)
    expect(SCRAPE_SOURCE.endsWith(')()')).toBe(true)
  })

  it('carries no esbuild keepNames helper, which the browser does not define', () => {
    // `ReferenceError: __name is not defined`, on all 59 routes.
    expect(SCRAPE_SOURCE).not.toContain('__name')
  })

  it('still reads the things the sweep depends on', () => {
    for (const needle of ['a[href]', 'querySelectorAll("img")', 'naturalWidth', 'innerText']) {
      expect(SCRAPE_SOURCE.replace(/'/g, '"')).toContain(needle)
    }
  })

  it('reads `complete`, without which every lazy image reports as broken', () => {
    expect(SCRAPE_SOURCE).toContain('complete')
  })

  it('has a scroll pass, without which lazy images are never even requested', () => {
    expect(SCROLL_SOURCE).toContain('scrollTo')
    expect(SCROLL_SOURCE).toContain('scrollHeight')
    expect(SCROLL_SOURCE.endsWith(')()')).toBe(true)
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

  it('expands --fail-on=all to every category and records that it was a shorthand', () => {
    expect(parseArgs(['--fail-on=all'], env()).failOn).toEqual([
      'links',
      'images',
      'placeholders',
      'alt',
      'external',
      'redirects',
      'style',
    ])
    expect(parseArgs(['--fail-on=all'], env()).failOnAll).toBe(true)
    // `thin` is in CATEGORIES — nameable — but deliberately not in `all`:
    // listing routes sit near the threshold, so a literal `all` would be red
    // on a healthy site.
    expect(CATEGORIES).toContain('thin')
    expect(parseArgs(['--fail-on=all'], env()).failOn).not.toContain('thin')
    expect(parseArgs(['--fail-on=thin'], env()).failOn).toEqual(['thin'])
  })

  it('refuses an empty --fail-on rather than gating on nothing', () => {
    // `--fail-on=` with an unset workflow variable behind it parsed to zero
    // categories, zero unknowns, and exit 0 — the residue of the typo shape.
    for (const arg of ['--fail-on=', '--fail-on=,', '--fail-on=  ']) {
      expect(parseArgs([arg], env()).failOnEmpty, arg).toBe(true)
    }
    expect(parseArgs(['--fail-on=links'], env()).failOnEmpty).toBe(false)
    expect(parseArgs(['--fail-on=all'], env()).failOnEmpty).toBe(false)
  })

  it('collects a mistyped category instead of dropping it', () => {
    // This assertion is the inverse of the one it replaces. Dropping the name
    // silently meant `--fail-on=iamges` armed the gate against nothing and the
    // run exited 0 — the failure this tool exists to catch, in the flag whose
    // job is to catch it. `index.ts` exits 2 on a non-empty list.
    const args = parseArgs(['--fail-on=links,imagez,alt'], env())
    expect(args.failOn).toEqual(['links', 'alt'])
    expect(args.unknownCategories).toEqual(['imagez'])
  })

  it('reports every unrecognised name, not just the first', () => {
    expect(parseArgs(['--fail-on=iamges,lnks'], env()).unknownCategories).toEqual([
      'iamges',
      'lnks',
    ])
  })

  it('keeps --fail-on=external, which index.ts then rejects without --external', () => {
    // Parsing stays dumb; the combination is refused where the run happens, so
    // the gate can never be armed against a check that never runs.
    expect(parseArgs(['--fail-on=external'], env()).checkExternal).toBe(false)
    expect(parseArgs(['--fail-on=external'], env()).failOn).toEqual(['external'])
    expect(parseArgs(['--fail-on=external'], env()).failOnAll).toBe(false)
  })

  it('parses --exclude into substrings, ignoring blanks', () => {
    expect(parseArgs(['--exclude=showcase-,/api'], env()).exclude).toEqual(['showcase-', '/api'])
    expect(parseArgs(['--exclude=  '], env()).exclude).toEqual([])
    expect(parseArgs([], env()).exclude).toEqual([])
  })

  it('takes a thin-copy threshold, defaulting to the shared constant', () => {
    expect(parseArgs([], env()).thinThreshold).toBe(DEFAULT_THIN_COPY_THRESHOLD)
    expect(parseArgs(['--thin-threshold=250'], env()).thinThreshold).toBe(250)
  })

  it('parses a junk or empty threshold to a value the CLI guard rejects', () => {
    // Both shapes made `textLength < threshold` false for every route, so the
    // check reported "none" over a site of stubs. `index.ts` exits 2 on them;
    // what is pinned here is that they never arrive as a usable number.
    expect(parseArgs(['--thin-threshold=abc'], env()).thinThreshold).toBeNaN()
    expect(parseArgs(['--thin-threshold='], env()).thinThreshold).toBe(0)
    for (const bad of [NaN, 0, -1]) {
      expect(Number.isFinite(bad) && bad >= 1, String(bad)).toBe(false)
    }
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
    externalChecked: true,
    notVisited: [],
    externalStatuses: { 'https://example.com/gone': 404, 'https://example.com/ok': 200 },
    pages: [
      {
        route: '/',
        status: 200,
        referrers: [],
        title: 'Home',
        styleFindings: [],
        textLength: 1200,
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
        styleFindings: [],
        textLength: 1200,
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

  it('reports an image still in flight rather than dropping it from the tick', () => {
    // An if/else chain judged an unsettled image by neither branch, so the
    // "images that do not paint — none" tick was printed over a set that had
    // quietly excluded it.
    const loading: SweepReport = {
      ...report,
      pages: [
        {
          route: '/slow',
          status: 200,
          referrers: [],
          title: '',
          styleFindings: [],
          textLength: 1200,
          textFindings: [],
          imageFindings: {
            desktop: [{ src: '/media/slow.webp', alt: 'Slow', reason: 'still loading' }],
          },
          internalLinks: [],
          externalLinks: [],
        },
      ],
    }
    const found = categorise(loading)
    expect(found.stillLoading).toEqual([
      { route: '/slow', viewport: 'desktop', src: '/media/slow.webp' },
    ])
    expect(found.images).toEqual([])
    expect(format(loading, found)).toContain('1 images had not finished loading when scraped')
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
      style: 0,
      thin: 0,
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
          styleFindings: [],
          textLength: 1200,
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
          styleFindings: [],
          textLength: 1200,
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

  /**
   * `externalStatuses` is filled in for every outbound link the crawl SEES,
   * checked or not. Both of these were wrong in the first cut, and both were
   * wrong in the direction of silence.
   */
  it('reports nothing external when nothing external was requested', () => {
    const unchecked: SweepReport = {
      ...report,
      externalChecked: false,
      externalStatuses: { 'https://example.com/gone': null, 'https://example.com/ok': null },
    }
    expect(categorise(unchecked).external).toEqual([])
  })

  it('says the external check was skipped instead of printing a tick', () => {
    const unchecked: SweepReport = {
      ...report,
      externalChecked: false,
      externalStatuses: { 'https://example.com/gone': null, 'https://example.com/ok': null },
    }
    const out = format(unchecked, categorise(unchecked))
    expect(out).toContain('2 external links not checked (pass --external)')
    expect(out).not.toContain('✓ broken external links')
  })

  it('treats a null status as a dead domain, not as a pass', () => {
    // `crawl.ts` records null when the request threw: DNS failure, refused
    // connection, timeout. That is the likeliest broken outbound link there is.
    const dead: SweepReport = {
      ...report,
      externalChecked: true,
      externalStatuses: { 'https://gone.example': null },
    }
    expect(categorise(dead).external).toEqual([{ url: 'https://gone.example', status: null }])
    expect(format(dead, categorise(dead))).toContain('ERR https://gone.example')
  })

  it('separates "the server refused this client" from "the page is gone"', () => {
    // Measured against the real lane: linkedin.com/company/seqtek answers 999
    // to a bare client and 200 to a browser UA; facebook.com/seqtek/ answers
    // 400 to one UA and 200 to another. Neither is a broken link, and calling
    // them broken is the false-entry problem the retry docstring warns about.
    const social: SweepReport = {
      ...report,
      externalChecked: true,
      externalStatuses: {
        'https://www.linkedin.com/company/seqtek': 999,
        'https://www.facebook.com/seqtek/': 400,
        'https://gone.example/page': 404,
        'https://dead.example': null,
      },
    }
    const found = categorise(social)
    expect(found.external.map((e) => e.status).sort()).toEqual([404, null])
    expect(found.unverifiable.map((e) => e.status).sort()).toEqual([400, 999])

    const out = format(social, found)
    expect(out).toContain('✗ broken external links — 2')
    expect(out).toContain('could not be verified (bot protection)')
  })

  it('does not let an unverifiable link fail a --fail-on=external build', () => {
    const social: SweepReport = {
      ...report,
      externalChecked: true,
      externalStatuses: { 'https://www.linkedin.com/company/seqtek': 999 },
    }
    expect(countsByCategory(categorise(social)).external).toBe(0)
  })

  it('says so when --max-pages cut the crawl short', () => {
    const truncated: SweepReport = { ...report, notVisited: ['/a', '/b', '/c', '/d'] }
    const out = format(truncated, categorise(truncated))
    expect(out).toContain('crawl stopped at --max-pages: 4 routes never visited')
  })
})

describe('thin copy', () => {
  const pageAt = (route: string, status: number, textLength: number) => ({
    route,
    status,
    referrers: [],
    title: route,
    textFindings: [],
    styleFindings: [],
    textLength,
    imageFindings: {},
    internalLinks: [],
    externalLinks: [],
  })

  const reportWith = (pages: SweepReport['pages']): SweepReport => ({
    baseUrl: ORIGIN,
    startedAt: '',
    finishedAt: '',
    externalChecked: false,
    notVisited: [],
    externalStatuses: {},
    pages,
  })

  it('reports a rendered page below the threshold, with its measurement', () => {
    const found = categorise(reportWith([pageAt('/services/agentic-ai', 200, 128)]), 600)
    expect(found.thin).toEqual([{ route: '/services/agentic-ai', chars: 128 }])
  })

  it('leaves a page at or above the threshold alone', () => {
    expect(categorise(reportWith([pageAt('/services/cadence', 200, 600)]), 600).thin).toEqual([])
  })

  it('never counts a dead route as thin — it is already a broken link', () => {
    // A 404 renders almost nothing, so without this every dead route appeared
    // in both lists and the thin count tracked the link count.
    const found = categorise(reportWith([pageAt('/localshoring', 404, 40)]), 600)
    expect(found.thin).toEqual([])
    expect(found.links).toHaveLength(1)
  })

  it('falls back to the shared default when no threshold is passed', () => {
    // `index.ts` always passes one, so this default is the copy with nothing
    // else behind it.
    const under = DEFAULT_THIN_COPY_THRESHOLD - 1
    expect(categorise(reportWith([pageAt('/thin', 200, under)])).thin).toEqual([
      { route: '/thin', chars: under },
    ])
    expect(categorise(reportWith([pageAt('/ok', 200, DEFAULT_THIN_COPY_THRESHOLD)])).thin).toEqual(
      [],
    )
  })

  it('honours a caller-supplied threshold', () => {
    const report = reportWith([pageAt('/contact', 200, 300)])
    expect(categorise(report, 600).thin).toHaveLength(1)
    expect(categorise(report, 200).thin).toHaveLength(0)
  })
})

describe('isExcluded', () => {
  it('matches anywhere in the route, so one argument drops the whole fixture set', () => {
    // Prefix matching caught the flat pages and missed every collection
    // fixture, which is most of them.
    for (const route of [
      '/showcase-block-faq',
      '/case-studies/showcase-cut-downtime-in-half',
      '/workshops/showcase-touchstone-discovery',
    ]) {
      expect(isExcluded(route, ['showcase-']), route).toBe(true)
    }
    expect(isExcluded('/services/cadence', ['showcase-'])).toBe(false)
  })

  it('excludes nothing when no prefixes are given', () => {
    expect(isExcluded('/anything', [])).toBe(false)
  })

  it('ignores an empty prefix rather than excluding every route', () => {
    // `--exclude=` splitting to [''] would otherwise match every path and
    // sweep nothing, reporting a clean site.
    expect(isExcluded('/services/cadence', [''])).toBe(false)
  })
})
