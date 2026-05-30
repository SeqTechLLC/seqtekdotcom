import type { MigrationLogger } from '../log'

/**
 * Homepage parser: drives the `homepage` global from
 * `page-content.json["/"]`. Per `docs/CONTENT_MIGRATION.md` §3.2 the
 * extractable structure is hero (headline + subheadline), three stats,
 * and a brand-teaser paragraph. The three first-name-plus-initial quotes
 * are intentionally NOT imported as testimonials per CONTENT-REQUIREMENTS
 * §6 — logged as `AUDIT_GAP` so the editor follows up.
 */

const NAV_TERMINATOR = 'Assessment'
const KNOWN_HEADLINE = 'Your Local Partner for Business Consulting Services'
const KNOWN_SUB =
  'Helping organizations innovate, implement, and deliver a better tomorrow with expert Tulsa business consulting.'

const STATS_FALLBACK: { number: string; label: string; suffix: string }[] = [
  { number: '20', suffix: '+', label: 'Years of experience' },
  { number: '411', suffix: '+', label: 'Successful projects delivered' },
  { number: '8221', suffix: '+', label: 'Lives changed' },
]

export interface ParsedHomepage {
  hero: {
    headline: string
    subheadline: string
  }
  stats: { number: string; suffix?: string; label: string }[]
  brandTeaser: {
    headline?: string
    body: string
  }
}

export interface ParseHomepageOptions {
  homepageContent: string
  logger: MigrationLogger
}

function stripNav(raw: string): string {
  const idx = raw.indexOf(NAV_TERMINATOR)
  return (idx >= 0 ? raw.slice(idx + NAV_TERMINATOR.length) : raw).trim()
}

export function parseHomepage(options: ParseHomepageOptions): ParsedHomepage {
  const { logger } = options
  const body = stripNav(options.homepageContent)
  const lines = body
    .split('\n')
    .map((line) => line.replace(/​/g, '').trim())
    .filter((line) => line.length > 0)

  const headline = lines.includes(KNOWN_HEADLINE) ? KNOWN_HEADLINE : (lines[0] ?? KNOWN_HEADLINE)
  // Subheadline isn't structurally recoverable from the audit (no markup,
  // no consistent position); keep the known canonical sub from the prior site.
  const subheadline = KNOWN_SUB

  // Extract stats: pattern is `N +` on one line, label on the next line.
  const stats: { number: string; suffix?: string; label: string }[] = []
  for (let i = 0; i < lines.length - 1; i++) {
    const m = lines[i].match(/^(\d[\d,]*)\s*\+\s*$/)
    if (m) {
      const labelLine = lines[i + 1]
      if (labelLine && labelLine.length < 60) {
        stats.push({ number: m[1].replace(/,/g, ''), suffix: '+', label: labelLine })
      }
    }
  }
  const finalStats = stats.length === 3 ? stats : STATS_FALLBACK

  logger.log({
    level: 'WARN',
    kind: 'STATS_CONFLICT',
    collection: 'homepage',
    slug: '<global>',
    detail:
      'homepage stats (20+/411+/8221+) conflict with about page (25+/500+/10,000+); leadership resolves per ROADMAP BR-5',
  })
  logger.log({
    level: 'WARN',
    kind: 'AUDIT_GAP',
    collection: 'homepage',
    slug: '<global>',
    detail:
      'three homepage quotes (Mike K., Cindy B, Kevin R.) are first-name-plus-initial — NOT imported as testimonials per CONTENT-REQUIREMENTS §6',
  })

  return {
    hero: { headline, subheadline },
    stats: finalStats,
    brandTeaser: {
      headline: 'Purpose-Driven Business Consulting',
      body: 'Our purpose is to help people and organizations innovate, implement, and deliver a better tomorrow.',
    },
  }
}
