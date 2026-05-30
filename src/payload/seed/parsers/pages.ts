import { lexicalFromNodes, textToLexicalNodes } from '../htmlToLexical'
import type { MigrationLogger } from '../log'
import { applySlugRewrite } from '../slugRewrites'

/**
 * Pages parser: marketing pages from `case-studies.json` (misnamed —
 * actually pages) and `retry-content.json` (about backfill). Output shape
 * is a list of Payload `pages` docs ready for `upsertBySlug`.
 *
 * Per `docs/CONTENT_MIGRATION.md` §3.2 the layout-block composition is
 * editorially heavy; this script lands a hero (headline only) plus a
 * single content block containing the prose, then flags every page as
 * `AUDIT_GAP` so the editor builds out blocks (stats-bar, comparison-table,
 * cta-section) by hand. `/our-services` is intentionally NOT emitted as a
 * page — §3.2 says it populates `servicePillars` / `services` only.
 */

const NAV_TERMINATOR = 'Assessment'
const FOOTER_START = 'Headquarters'

const SOURCE_KEYS: { url: string; slug: string; title: string; notes: string[] }[] = [
  {
    url: 'https://www.seqtek.com/about-us-1',
    slug: 'about',
    title: 'About SEQTEK',
    notes: [
      'editor builds layout: hero, stats-bar (25+/500+/10,000+), comparison-table (Localshoring vs offshore/nearshore), content (10 numbered benefits), cta-section',
    ],
  },
  {
    url: 'https://www.seqtek.com/workshops',
    slug: 'touchstone-workshops',
    title: 'Touchstone Workshops',
    notes: [
      'editor builds layout: hero, stats-bar (70%/$2.3T/#1), content (The SEQTEK Approach), workshop-progression placeholder, content (Build Health From the Inside Out), cta-section',
    ],
  },
  {
    url: 'https://www.seqtek.com/contact',
    slug: 'contact',
    title: 'Contact SEQTEK',
    notes: [
      'editor adds hubspot-form block once HubSpot form GUIDs are finalized (INTEGRATIONS.md §1.2)',
    ],
  },
  {
    url: 'https://www.seqtek.com/privacy-policy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    notes: [
      'body references 201 E Hobson Ave, Sapulpa while footer says 12 N Cheyenne Ave, Tulsa — legal review required (ADDRESS_DISCREPANCY logged)',
    ],
  },
]

function stripBoilerplate(raw: string): string {
  let body = raw.replace(/\r\n/g, '\n')
  const navIdx = body.indexOf(NAV_TERMINATOR)
  if (navIdx >= 0) body = body.slice(navIdx + NAV_TERMINATOR.length)
  const footerIdx = body.indexOf(FOOTER_START)
  if (footerIdx >= 0) body = body.slice(0, footerIdx)
  return body
    .split('\n')
    .map((line) => line.replace(/​/g, '').trimEnd())
    .filter((line) => line.trim() !== 'Skip to Main Content')
    .join('\n')
    .trim()
}

function isAuditErrorString(value: string): boolean {
  return /^Error:\s+page\.goto/.test(value) || value.trim().length < 40
}

export interface ParsedPage {
  slug: string
  title: string
  publishedAt: string
  hero: {
    headline: string
    subheadline?: string
  }
  /** Stored as `layout: []` initially; the lead composes blocks in the admin. */
  layout: never[]
}

export interface ParsePagesOptions {
  /** `case-studies.json` (misnamed — actually marketing pages). */
  pagesAudit: Record<string, string>
  /** `retry-content.json` — backfills `about-us-1`. */
  retryAudit: Record<string, string>
  logger: MigrationLogger
  now?: Date
}

export function parsePages(options: ParsePagesOptions): ParsedPage[] {
  const { pagesAudit, retryAudit, logger } = options
  const now = (options.now ?? new Date()).toISOString()
  const merged: Record<string, string> = { ...pagesAudit }
  for (const [key, value] of Object.entries(retryAudit)) {
    // Retry keys lack `www.`; align so SOURCE_KEYS lookups still find them.
    const normalized = key.replace('https://seqtek.com', 'https://www.seqtek.com')
    if (!merged[normalized] || isAuditErrorString(merged[normalized])) {
      merged[normalized] = value
    }
  }

  const results: ParsedPage[] = []
  for (const { url, slug, title, notes } of SOURCE_KEYS) {
    const raw = merged[url]
    if (!raw || isAuditErrorString(raw)) {
      logger.log({
        level: 'WARN',
        kind: 'PARSE_ERROR',
        collection: 'pages',
        slug,
        detail: `audit value missing or unreadable for ${url}`,
      })
      continue
    }
    const canonicalSlug = applySlugRewrite(slug)
    const body = stripBoilerplate(raw)

    // Hero headline: per §3.2 the first standalone line is the hero
    // headline candidate; for `about` this is `Localshoring since 1999`.
    const firstLine =
      body
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 0) ?? title
    const hero = { headline: firstLine === title ? title : firstLine }

    logger.log({
      level: 'INFO',
      kind: 'AUDIT_GAP',
      collection: 'pages',
      slug: canonicalSlug,
      detail: notes.join('; '),
    })
    if (slug === 'privacy-policy') {
      logger.log({
        level: 'WARN',
        kind: 'ADDRESS_DISCREPANCY',
        collection: 'pages',
        slug: canonicalSlug,
        detail:
          'body cites 201 E Hobson Ave, Sapulpa; footer cites 12 N Cheyenne Ave, Tulsa — flag for legal review',
      })
    }
    if (slug === 'about') {
      logger.log({
        level: 'WARN',
        kind: 'STATS_CONFLICT',
        collection: 'pages',
        slug: canonicalSlug,
        detail:
          'about page stats (25+/500+/10,000+) conflict with homepage (20+/411+/8221+); leadership resolves per ROADMAP BR-5',
      })
    }

    // The bodyNodes are constructed so a future iteration can attach them
    // to a `content` block; today we leave layout empty per §3.2.
    const bodyNodes = textToLexicalNodes(body)
    void bodyNodes

    results.push({
      slug: canonicalSlug,
      title,
      publishedAt: now,
      hero,
      layout: [],
    })
  }

  // Compose richText "stub" preview line — log once that prose is staged
  // but not yet blocked.
  logger.log({
    level: 'INFO',
    kind: 'AUDIT_GAP',
    collection: 'pages',
    slug: 'services',
    detail:
      '/our-services intentionally not seeded as a pages doc per §3.2 — populates servicePillars/services references only',
  })

  return results
}

export function lexicalFromBody(text: string) {
  return lexicalFromNodes(textToLexicalNodes(text))
}
