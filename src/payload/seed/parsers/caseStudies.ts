import { lexicalFromNodes, textToLexicalNodes } from '../htmlToLexical'
import type { MigrationLogger } from '../log'
import { applySlugRewrite, bareSlug } from '../slugRewrites'

/**
 * Source labels for the three required sections, in detection order. The
 * first match wins per record (older studies use `The Problem`; newer
 * banking/oil-gas/airline studies use `Overview` + `Modernizing Systems` +
 * `Solutions & Impact`). Unrecognized labels are logged via
 * `migration-errors.log` and skipped — the lead resolves in the admin.
 */
const PROBLEM_LABELS = [
  'The Problem',
  'Modernizing Systems',
  'Legacy System Limitations',
  'Overview',
]
const SOLUTION_LABELS = ['The Solution', 'Solutions & Impact']
const IMPACT_LABELS = ['The Impact', 'Solution Delivered', 'Impact']
const KEY_TAKEAWAYS_LABEL = 'Key Takeaways'

const ALL_SECTION_LABELS = [
  ...PROBLEM_LABELS,
  ...SOLUTION_LABELS,
  ...IMPACT_LABELS,
  KEY_TAKEAWAYS_LABEL,
]

const NAV_TERMINATOR = 'Assessment'
const FOOTER_START = 'Headquarters'
const CTA_LINES = new Set([
  'Talk With Us',
  'Request Info',
  'Contact',
  'Modernize Your Legacy Systems',
  'Upscale Your Systems',
  'Integrate and scale today',
])

const INDUSTRY_BY_SLUG: Readonly<Record<string, string>> = Object.freeze({
  'mobile-apps-remote-operations': 'energy',
  'retail-pos-update-experience': 'retail',
  'data-warehouse-strategy': 'technology',
  'healthcare-ux-redesign': 'healthcare',
  'healthcare-data-modernization': 'healthcare',
  'airline-automation': 'transportation',
  'oil-gas-modernization': 'energy',
  'banking-integration-platform': 'financial-services',
})

const CLIENT_LABEL_BY_SLUG: Readonly<Record<string, string>> = Object.freeze({
  'mobile-apps-remote-operations': 'Oilfield Services Operator',
  'retail-pos-update-experience': 'Fortune 100 Retailer',
  'data-warehouse-strategy': 'Growth-Stage Analytics Client',
  'healthcare-ux-redesign': 'Healthcare Data Platform',
  'healthcare-data-modernization': 'Leading Healthcare Organization',
  'airline-automation': 'Major U.S. Airline',
  'oil-gas-modernization': 'Endurance Lift (Fortune 100 Acquirer)',
  'banking-integration-platform': 'Regional Banking Partner',
})

interface ParsedTitle {
  title: string
  subtitle?: string
}

interface SectionMatch {
  label: string
  start: number
  end: number
}

export interface ParsedCaseStudy {
  slug: string
  title: string
  subtitle?: string
  problem?: ReturnType<typeof lexicalFromNodes>
  solution?: ReturnType<typeof lexicalFromNodes>
  impact?: ReturnType<typeof lexicalFromNodes>
  client: {
    name: string
    isAnonymized: boolean
  }
  technologies: { label: string }[]
  metrics: never[]
  publishedAt: string
}

function stripBoilerplate(raw: string): string {
  let body = raw.replace(/\r\n/g, '\n')
  const navIdx = body.indexOf(NAV_TERMINATOR)
  if (navIdx >= 0) body = body.slice(navIdx + NAV_TERMINATOR.length)
  const footerIdx = body.indexOf(FOOTER_START)
  if (footerIdx >= 0) body = body.slice(0, footerIdx)
  const lines = body
    .split('\n')
    .map((line) => line.replace(/​/g, '').trimEnd())
    .filter((line) => !CTA_LINES.has(line.trim()))
  return lines.join('\n').trim()
}

function findSections(body: string): SectionMatch[] {
  const matches: SectionMatch[] = []
  for (const label of ALL_SECTION_LABELS) {
    let index = 0
    while (index <= body.length) {
      const found = body.indexOf(label, index)
      if (found < 0) break
      const prev = found > 0 ? body[found - 1] : '\n'
      const after = body[found + label.length]
      // Heading-like context: preceded by newline (or start), followed by
      // newline / end-of-string / a heading-trailing character (`:`, ` `, `\t`).
      // The real audit occasionally trails labels with `:` or stray spaces.
      const afterOk = after === undefined || after === '\n' || /[:\s]/.test(after)
      if ((prev === '\n' || found === 0) && afterOk) {
        matches.push({ label, start: found, end: found + label.length })
      }
      index = found + label.length
    }
  }
  matches.sort((a, b) => a.start - b.start)
  return matches
}

function pickTitleAndSubtitle(intro: string): ParsedTitle | null {
  const lines = intro
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (lines.length === 0) return null
  if (lines.length === 1) return { title: lines[0] }

  const endsInPunctuation = (line: string) => /[.!?]$/.test(line)
  const noPunct = lines.filter((line) => !endsInPunctuation(line))
  const punct = lines.filter((line) => endsInPunctuation(line))

  if (noPunct.length === 1 && punct.length >= 1) {
    return { title: noPunct[0], subtitle: punct.join(' ') }
  }
  if (noPunct.length === 0) {
    const sorted = [...lines].sort((a, b) => a.length - b.length)
    return { title: sorted[0], subtitle: sorted.slice(1).join(' ') }
  }
  if (noPunct.length > 1) {
    // Pick the shortest no-punct line as title, others as subtitle prelude.
    const sorted = [...noPunct].sort((a, b) => a.length - b.length)
    return {
      title: sorted[0],
      subtitle: [...sorted.slice(1), ...punct].join(' ') || undefined,
    }
  }
  return { title: lines[0], subtitle: lines.slice(1).join(' ') }
}

function classify(label: string): 'problem' | 'solution' | 'impact' | 'keyTakeaways' | 'unknown' {
  if (PROBLEM_LABELS.includes(label)) return 'problem'
  if (SOLUTION_LABELS.includes(label)) return 'solution'
  if (IMPACT_LABELS.includes(label)) return 'impact'
  if (label === KEY_TAKEAWAYS_LABEL) return 'keyTakeaways'
  return 'unknown'
}

function buildRichTextOrUndefined(text: string) {
  const nodes = textToLexicalNodes(text)
  return nodes.length > 0 ? lexicalFromNodes(nodes) : undefined
}

export interface ParseCaseStudiesOptions {
  logger: MigrationLogger
  /** Override the run timestamp for deterministic tests. */
  now?: Date
}

/**
 * Convert `audit/case-studies-content.json` into parsed Payload-shaped
 * records. Pure: no Payload calls, no filesystem reads.
 */
export function parseCaseStudies(
  raw: Record<string, string>,
  options: ParseCaseStudiesOptions,
): ParsedCaseStudy[] {
  const { logger } = options
  const now = (options.now ?? new Date()).toISOString()
  const results: ParsedCaseStudy[] = []

  for (const [url, value] of Object.entries(raw)) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      logger.log({
        level: 'WARN',
        kind: 'PARSE_ERROR',
        collection: 'caseStudies',
        slug: bareSlug(url) || '<unknown>',
        detail: `audit value missing or empty for ${url}`,
      })
      continue
    }

    const slug = applySlugRewrite(url)
    const body = stripBoilerplate(value)
    const sections = findSections(body)

    let title = ''
    let subtitle: string | undefined
    const intro = sections.length > 0 ? body.slice(0, sections[0].start) : body
    const titleParts = pickTitleAndSubtitle(intro)
    if (!titleParts) {
      logger.log({
        level: 'WARN',
        kind: 'PARSE_ERROR',
        collection: 'caseStudies',
        slug,
        detail: 'could not locate a title line above the first section heading',
      })
      title = slug.replace(/-/g, ' ')
    } else {
      title = titleParts.title
      subtitle = titleParts.subtitle
    }

    // Content-mismatch flag for the healthcare-UX rename per §11.
    if (slug === 'healthcare-ux-redesign') {
      title = `[CONTENT MISMATCH — see CONTENT_MIGRATION §11] ${title}`
      logger.log({
        level: 'WARN',
        kind: 'CONTENT_MISMATCH',
        collection: 'caseStudies',
        slug,
        detail:
          'source title/image describe a drill-bit project; body is the healthcare UX redesign — editor must split or correct',
      })
    }

    const sectionTexts: Record<'problem' | 'solution' | 'impact' | 'keyTakeaways', string[]> = {
      problem: [],
      solution: [],
      impact: [],
      keyTakeaways: [],
    }

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      const next = sections[i + 1]
      const text = body.slice(section.end, next?.start ?? body.length).trim()
      const target = classify(section.label)
      if (target === 'unknown') {
        logger.log({
          level: 'WARN',
          kind: 'PARSE_ERROR',
          collection: 'caseStudies',
          slug,
          detail: `unrecognized section label "${section.label}" — dropped`,
        })
        continue
      }
      sectionTexts[target].push(text)
    }

    const problem = buildRichTextOrUndefined(sectionTexts.problem.join('\n\n'))
    const solution = buildRichTextOrUndefined(sectionTexts.solution.join('\n\n'))
    let impactText = sectionTexts.impact.join('\n\n')
    if (sectionTexts.keyTakeaways.length > 0) {
      impactText =
        `${impactText}\n\nKey Takeaways\n\n${sectionTexts.keyTakeaways.join('\n\n')}`.trim()
    }
    const impact = buildRichTextOrUndefined(impactText)

    // Tech extraction: banking study has explicit `Systems Integrated:` /
    // `Technical Foundation:` markers. Keep this conservative — pull lines
    // immediately after each marker until the next blank line, split on
    // bullets/newlines. Anything ambiguous gets logged.
    const technologies: { label: string }[] = []
    const techMarkers = ['Systems Integrated:', 'Technical Foundation:']
    for (const marker of techMarkers) {
      const idx = body.indexOf(marker)
      if (idx < 0) continue
      const after = body.slice(idx + marker.length).trim()
      const block = after.split(/\n{2,}/)[0] ?? ''
      const items = block
        .split(/[\n•]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length < 80)
      for (const item of items) {
        technologies.push({ label: item.replace(/[,;]$/, '').trim() })
      }
    }
    if (technologies.length === 0) {
      logger.log({
        level: 'INFO',
        kind: 'TECH_CLEANUP',
        collection: 'caseStudies',
        slug,
        detail:
          'no explicit `Systems Integrated:` / `Technical Foundation:` block — editor populates tech tags from prose',
      })
    }

    logger.log({
      level: 'WARN',
      kind: 'MISSING_IMAGE',
      collection: 'caseStudies',
      slug,
      detail: 'heroImage absent in audit; editor uploads or runs --recrawl-images',
    })
    logger.log({
      level: 'WARN',
      kind: 'MISSING_TESTIMONIAL',
      collection: 'caseStudies',
      slug,
      detail:
        'no testimonial captured in audit; collect with full attribution per CONTENT-REQUIREMENTS §6',
    })
    // industry is a required relationship — the seed can't resolve a numeric
    // ID, so the editor links it from /admin. Surface the audit-suggested
    // slug per record so editors aren't guessing.
    const industryRequested = INDUSTRY_BY_SLUG[slug] ?? null
    logger.log({
      level: 'WARN',
      kind: 'AUDIT_GAP',
      collection: 'caseStudies',
      slug,
      detail: industryRequested
        ? `industry: link to industries/${industryRequested}`
        : 'industry: no audit-derivable match; editor selects manually',
    })

    results.push({
      slug,
      title,
      subtitle,
      problem,
      solution,
      impact,
      client: {
        name: CLIENT_LABEL_BY_SLUG[slug] ?? 'Client (Anonymized)',
        isAnonymized: true,
      },
      technologies,
      metrics: [],
      publishedAt: now,
    })
  }

  return results
}
