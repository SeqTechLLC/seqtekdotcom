/**
 * The pure half of the sweep: URL classification and text scanning. No browser,
 * no network — so it is unit-testable, and `crawl.ts` stays a thin driver.
 */

import { SKELETON_PLACEHOLDER_COPY } from '../../src/payload/seed/skeletons/placeholderCopy'

export type LinkKind = 'internal' | 'external' | 'mailto' | 'tel' | 'anchor' | 'unparseable'

export interface ClassifiedLink {
  kind: LinkKind
  /** Absolute URL for internal/external; the raw href otherwise. */
  href: string
  /** Path + search, hash stripped. Internal links only — this is the crawl key. */
  route?: string
}

/**
 * Canonical crawl key. The hash is dropped (same document) and a trailing slash
 * is normalised away except at the root, so `/team` and `/team/` are one node
 * rather than two — otherwise a nav that ends one link in a slash doubles the
 * crawl and reports every finding on that page twice.
 */
export const normaliseRoute = (pathname: string, search = ''): string => {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return `${trimmed || '/'}${search}`
}

export const classifyHref = (href: string, origin: string): ClassifiedLink => {
  const raw = href.trim()
  if (!raw) return { kind: 'unparseable', href }
  if (raw.startsWith('#')) return { kind: 'anchor', href: raw }
  if (/^mailto:/i.test(raw)) return { kind: 'mailto', href: raw }
  if (/^tel:/i.test(raw)) return { kind: 'tel', href: raw }
  // Anything the browser would not navigate to is not a link we can check.
  if (/^(javascript|data|blob):/i.test(raw)) return { kind: 'unparseable', href: raw }

  let url: URL
  try {
    url = new URL(raw, origin)
  } catch {
    return { kind: 'unparseable', href: raw }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { kind: 'unparseable', href: raw }
  }
  if (url.origin !== origin) return { kind: 'external', href: url.toString() }
  return {
    kind: 'internal',
    href: url.toString(),
    route: normaliseRoute(url.pathname, url.search),
  }
}

export interface PlaceholderPattern {
  label: string
  test: RegExp
}

/**
 * Generic markers, for placeholder copy that came from a SEED rather than a
 * skeleton. The skeleton list cannot catch those: seeded bodies are content,
 * written per-document, and `services.json` alone put
 * "PLACEHOLDER COPY — NOT FOR PUBLICATION" on fifteen published routes.
 */
export const GENERIC_PLACEHOLDER_PATTERNS: readonly PlaceholderPattern[] = [
  { label: 'placeholder marker', test: /placeholder/i },
  { label: 'lorem ipsum', test: /\blorem ipsum\b/i },
  { label: 'TODO/FIXME', test: /\b(?:TODO|FIXME)\b/ },
  { label: 'TBD', test: /\bTBD\b/ },
  { label: 'coming soon', test: /\bcoming soon\b/i },
  { label: 'not for publication', test: /not for publication/i },
]

/**
 * Repo-internal references that reached rendered copy. Distinct from the
 * placeholder patterns because the failure is different in kind: this is not
 * unfinished copy, it is our planning vocabulary addressed to a visitor.
 * `§` and a bare `*.md` filename do not occur in marketing prose, so these are
 * specific enough to run without a suppression list.
 */
export const INTERNAL_REFERENCE_PATTERNS: readonly PlaceholderPattern[] = [
  { label: 'repo doc filename', test: /\b[A-Za-z0-9_-]+\.md\b/ },
  { label: 'section reference', test: /§\s?\d/ },
  {
    label: 'roadmap item id',
    test: /\b(?:ROADMAP|CONTENT_NEEDS|SVC-\d+|IND-\d+|UI-\d+|NAV-\d+)\b/,
  },
]

export interface TextFinding {
  label: string
  /** The matched text plus a little context, for the report. */
  excerpt: string
}

const excerptAround = (text: string, index: number, length: number): string => {
  const start = Math.max(0, index - 40)
  const end = Math.min(text.length, index + length + 40)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${end < text.length ? '…' : ''}`
}

/**
 * Scan one page's visible text. Returns at most one finding per label so a
 * paragraph that says "placeholder" three times is one line in the report, not
 * three — the unit of work is the page, not the occurrence.
 */
export const scanText = (
  text: string,
  patterns: readonly PlaceholderPattern[] = [
    ...GENERIC_PLACEHOLDER_PATTERNS,
    ...INTERNAL_REFERENCE_PATTERNS,
  ],
): TextFinding[] => {
  const found: TextFinding[] = []

  for (const phrase of SKELETON_PLACEHOLDER_COPY) {
    const at = text.indexOf(phrase)
    if (at !== -1) {
      found.push({ label: 'skeleton copy', excerpt: excerptAround(text, at, phrase.length) })
    }
  }

  // One finding per pattern: the `g` flag is stripped so `exec` always starts
  // at 0 and returns the first match only. (An earlier `seen` set looked like
  // it enforced this and could not — each phrase and each label is visited
  // exactly once, so neither guard could ever be false.)
  for (const { label, test } of patterns) {
    const match = new RegExp(test.source, test.flags.replace('g', '')).exec(text)
    if (match) {
      found.push({ label, excerpt: excerptAround(text, match.index, match[0].length) })
    }
  }

  return found
}
