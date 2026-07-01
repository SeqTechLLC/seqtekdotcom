import { buildLexical, contentBlock, hasRichText, runComposer, type LayoutBlock } from './shared'

// spec 010 US2 (Phase D) — service field→layout composer per data-model.md:
//   content(description) → content(approach) → deliverables → faq → contact-cta.
// The `faq` block emits FAQPage JSON-LD (so this preserves — actually adds —
// the structured data the old template lacked). pillar/icon/order/related stay
// collection metadata; the nested URL + breadcrumb + pillar-move revalidation
// are untouched (route + revalidateOnChange).

interface FaqItem {
  question?: string | null
  answer?: unknown
}

interface ServiceRecord {
  description?: unknown
  approach?: unknown
  deliverables?: Array<{ label?: string | null } | null> | null
  faq?: Array<FaqItem | null> | null
  [key: string]: unknown
}

export function composeServiceLayout(record: ServiceRecord): LayoutBlock[] {
  const blocks: LayoutBlock[] = []

  const description = contentBlock(record.description, { heading: 'Overview' })
  if (description) blocks.push(description)
  const approach = contentBlock(record.approach, { heading: 'Our approach' })
  if (approach) blocks.push(approach)

  const deliverables = (record.deliverables ?? [])
    .map((d) => (d?.label ? { label: d.label } : null))
    .filter((d): d is { label: string } => d !== null)
  if (deliverables.length >= 3 && deliverables.length <= 8) {
    blocks.push({ blockType: 'deliverables', heading: 'Deliverables', items: deliverables })
  } else if (deliverables.length > 0) {
    // 1–2 items can't satisfy the block's minRows, and >8 exceeds maxRows —
    // either way preserve them as a content list so no deliverable is lost.
    const body = buildLexical(deliverables.map((d) => ({ kind: 'p' as const, text: d.label })))
    const block = contentBlock(body, { heading: 'Deliverables' })
    if (block) blocks.push(block)
  }

  // FAQ: the block requires minRows 2 (and emits FAQPage JSON-LD). A single FAQ
  // can't satisfy that, so fall back to a content block; zero FAQs → omit.
  const faqs: Array<{ question: string; answer: unknown }> = []
  for (const f of record.faq ?? []) {
    if (f?.question && hasRichText(f.answer)) faqs.push({ question: f.question, answer: f.answer })
  }
  if (faqs.length >= 2) {
    blocks.push({ blockType: 'faq', heading: 'FAQ', items: faqs })
  } else {
    const only = faqs[0]
    if (only) {
      const block = contentBlock(only.answer, { heading: only.question })
      if (block) blocks.push(block)
    }
  }

  blocks.push({
    blockType: 'contact-cta',
    heading: 'Talk to a pillar lead',
    body: 'Tell us what you are trying to ship and we will tell you whether we are the right team for it.',
    primaryCta: { label: 'Book a call', url: '/contact' },
  })

  return blocks
}

const invokedDirectly = (() => {
  const entry = process.argv[1]
  if (!entry) return false
  return entry.endsWith('serviceToLayout.ts') || entry.endsWith('serviceToLayout.js')
})()

if (invokedDirectly) {
  runComposer({ collection: 'services', compose: (record) => composeServiceLayout(record) })
    .then((summary) => process.exit(summary.exitCode))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
