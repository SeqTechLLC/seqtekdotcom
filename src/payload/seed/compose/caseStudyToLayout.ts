import { contentBlock, relId, runComposer, type LayoutBlock } from './shared'

// spec 010 US2 (Phase C) — case-study field→layout composer. Maps the
// deprecated body fields onto blocks per data-model.md:
//   content(problem) → content(solution) → content(impact) →
//   metric-display(each metric) → tech-stack(technologies) →
//   testimonial-block(if testimonial).
// heroImage, related, industry, subtitle stay collection metadata rendered by
// the route header. Metrics use metric-display (not stats-bar) because only
// metric-display carries the metric `context` — no silent drop (SC-003).

interface Metric {
  number?: string | null
  label?: string | null
  context?: string | null
}

interface CaseStudyRecord {
  problem?: unknown
  solution?: unknown
  impact?: unknown
  metrics?: Array<Metric | null> | null
  technologies?: Array<{ label?: string | null } | null> | null
  testimonial?: unknown
  [key: string]: unknown
}

export function composeCaseStudyLayout(record: CaseStudyRecord): LayoutBlock[] {
  const blocks: LayoutBlock[] = []

  const problem = contentBlock(record.problem, { heading: 'The problem' })
  if (problem) blocks.push(problem)
  const solution = contentBlock(record.solution, { heading: 'The solution' })
  if (solution) blocks.push(solution)
  const impact = contentBlock(record.impact, { heading: 'The impact' })
  if (impact) blocks.push(impact)

  // Each metric → its own metric-display (preserves number + label + context).
  // Alternate the background so a run of metrics doesn't read as one slab.
  const metrics = (record.metrics ?? []).filter((m): m is Metric => !!m && !!m.number && !!m.label)
  metrics.forEach((m, i) => {
    blocks.push({
      blockType: 'metric-display',
      number: m.number,
      label: m.label,
      ...(m.context ? { context: m.context } : {}),
      background: i % 2 === 0 ? 'accent' : 'inverse',
    })
  })

  const technologies = (record.technologies ?? [])
    .map((t) => (t?.label ? { label: t.label } : null))
    .filter((t): t is { label: string } => t !== null)
  if (technologies.length > 0) {
    blocks.push({ blockType: 'tech-stack', heading: 'Technologies', items: technologies })
  }

  const testimonialId = relId(record.testimonial)
  if (testimonialId != null) {
    blocks.push({ blockType: 'testimonial-block', testimonial: testimonialId, layout: 'centered' })
  }

  return blocks
}

const invokedDirectly = (() => {
  const entry = process.argv[1]
  if (!entry) return false
  return entry.endsWith('caseStudyToLayout.ts') || entry.endsWith('caseStudyToLayout.js')
})()

if (invokedDirectly) {
  runComposer({ collection: 'caseStudies', compose: (record) => composeCaseStudyLayout(record) })
    .then((summary) => process.exit(summary.exitCode))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
