import { emptyLexical } from '../htmlToLexical'
import type { MigrationLogger } from '../log'
import { applySlugRewrite } from '../slugRewrites'

/**
 * Blog-post stubs from `page-content.json["/blog-old"]`. Per
 * `docs/CONTENT_MIGRATION.md` §3.3 only title / slug / excerpt /
 * publishedAt are recoverable from the audit — full bodies require a
 * follow-up re-crawl (ROADMAP). Every stub lands with empty Lexical
 * content and missing required relationships logged.
 */

const NAV_TERMINATOR = 'Assessment'
const FOOTER_START = 'Headquarters'
const SECTION_HEADER = 'Our Blogs'

const MONTH_BY_NAME: Record<string, number> = {
  Jan: 0,
  January: 0,
  Feb: 1,
  February: 1,
  Mar: 2,
  March: 2,
  Apr: 3,
  April: 3,
  May: 4,
  Jun: 5,
  June: 5,
  Jul: 6,
  July: 6,
  Aug: 7,
  August: 7,
  Sep: 8,
  Sept: 8,
  September: 8,
  Oct: 9,
  October: 9,
  Nov: 10,
  November: 10,
  Dec: 11,
  December: 11,
}

// Anchor year used when audit lists bare `MMM d` dates. Defaults to the
// current calendar year; bare-date entries whose parsed date would land
// in the future walk back one year via parseDate's guard.
const CHICAGO_OFFSET_HOURS = -5

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function stripBoilerplate(raw: string): string {
  let body = raw.replace(/\r\n/g, '\n')
  const navIdx = body.indexOf(NAV_TERMINATOR)
  if (navIdx >= 0) body = body.slice(navIdx + NAV_TERMINATOR.length)
  const footerIdx = body.indexOf(FOOTER_START)
  if (footerIdx >= 0) body = body.slice(0, footerIdx)
  const headerIdx = body.indexOf(SECTION_HEADER)
  if (headerIdx >= 0) body = body.slice(headerIdx + SECTION_HEADER.length)
  return body
    .split('\n')
    .map((line) => line.replace(/​/g, '').trimEnd())
    .filter((line) => line.trim() !== 'Skip to Main Content')
    .join('\n')
    .trim()
}

function parseDate(line: string, anchorYear: number, now: Date): string | undefined {
  // Forms: "Jan 20", "January 20", "Dec 2, 2025", "December 2, 2025"
  const withYear = line.match(/^([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})$/)
  if (withYear) {
    const month = MONTH_BY_NAME[withYear[1]]
    if (month === undefined) return undefined
    return toIsoCentral(Number(withYear[3]), month, Number(withYear[2]))
  }
  const bare = line.match(/^([A-Z][a-z]+)\s+(\d{1,2})$/)
  if (bare) {
    const month = MONTH_BY_NAME[bare[1]]
    if (month === undefined) return undefined
    const day = Number(bare[2])
    // Bare `MMM d` dates have no year — default to anchorYear, then walk back
    // one year if that would land in the future (audit captures past posts).
    let year = anchorYear
    let iso = toIsoCentral(year, month, day)
    if (new Date(iso).getTime() > now.getTime()) {
      year -= 1
      iso = toIsoCentral(year, month, day)
    }
    return iso
  }
  return undefined
}

function toIsoCentral(year: number, monthIndex: number, day: number): string {
  // 09:00 America/Chicago — fixed -05:00 offset is good enough for seed
  // timestamps (DST drift moves things by an hour, irrelevant for posts).
  return new Date(Date.UTC(year, monthIndex, day, 9 - CHICAGO_OFFSET_HOURS, 0, 0)).toISOString()
}

export interface ParsedPost {
  slug: string
  title: string
  excerpt: string
  content: ReturnType<typeof emptyLexical>
  publishedAt: string
}

export interface ParsePostsOptions {
  blogPageContent: string
  logger: MigrationLogger
  /** Used when the audit gives a bare `MMM d` date with no year. */
  anchorYear?: number
  /** Stable "now" so parseDate's future-year guard is deterministic in tests. */
  now?: Date
}

export function parsePosts(options: ParsePostsOptions): ParsedPost[] {
  const { logger } = options
  const now = options.now ?? new Date()
  const anchorYear = options.anchorYear ?? now.getUTCFullYear()
  const body = stripBoilerplate(options.blogPageContent)
  if (!body) {
    logger.log({
      level: 'WARN',
      kind: 'PARSE_ERROR',
      collection: 'posts',
      slug: '<blog-old>',
      detail: 'no blog-old body found after boilerplate strip',
    })
    return []
  }

  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  // Heuristic per §3.3: each post block is (title) + (excerpt paragraph) + (date line).
  const posts: ParsedPost[] = []
  let cursor = 0
  while (cursor < lines.length) {
    const titleCandidate = lines[cursor]
    if (!titleCandidate || titleCandidate.length < 6) {
      cursor++
      continue
    }
    // Excerpt = lines until we hit a date line.
    const excerptParts: string[] = []
    let scan = cursor + 1
    let publishedAt: string | undefined
    while (scan < lines.length) {
      const maybeDate = parseDate(lines[scan], anchorYear, now)
      if (maybeDate) {
        publishedAt = maybeDate
        break
      }
      excerptParts.push(lines[scan])
      scan++
    }
    if (!publishedAt) {
      // Reached end without a date line — abandon this block, but surface it
      // so editors know an audit entry was skipped rather than silently lost.
      logger.log({
        level: 'WARN',
        kind: 'PARSE_ERROR',
        collection: 'posts',
        slug: slugify(titleCandidate) || '<unparsed>',
        detail: `dropped block "${titleCandidate.slice(0, 60)}" — no recognizable publish date in trailing lines`,
      })
      cursor++
      continue
    }
    const title = titleCandidate
    const excerpt = excerptParts.join(' ').replace(/\s+/g, ' ').trim()
    const slug = applySlugRewrite(slugify(title))

    logger.log({
      level: 'WARN',
      kind: 'AUDIT_GAP',
      collection: 'posts',
      slug,
      detail:
        'audit only contains title/excerpt/date; full body requires re-crawl or hand entry per §3.3',
    })
    logger.log({
      level: 'WARN',
      kind: 'MISSING_IMAGE',
      collection: 'posts',
      slug,
      detail: 'featuredImage absent in audit; editor uploads before publish',
    })

    posts.push({
      slug,
      title,
      excerpt: excerpt.length > 0 ? `${excerpt.replace(/[.…]+$/, '')}…` : '',
      content: emptyLexical(),
      publishedAt,
    })
    cursor = scan + 1
  }

  return posts
}
