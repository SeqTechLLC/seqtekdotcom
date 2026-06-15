import { buildLexical, contentBlock, relId, runComposer, type LayoutBlock } from './shared'

// spec 010 US1 (Phase B pilot) — workshop field→layout composer. Maps a
// workshop's discrete body fields onto the universal `layout` blocks array
// per data-model.md:
//   content(description) → content(format) → content(audience) →
//   deliverables → gallery(photos) → video-embed → testimonial-block →
//   contact-cta (the retired template's request/download tail).
// Pure + deterministic so re-runs are idempotent (contract migration-fidelity).

interface WorkshopRecord {
  title?: string
  description?: unknown
  format?: unknown
  audience?: unknown
  deliverables?: Array<{ label?: string | null } | null> | null
  photos?: Array<{ image?: unknown; caption?: string | null } | null> | null
  video?: { provider?: string | null; videoId?: string | null; title?: string | null } | null
  testimonial?: unknown
  [key: string]: unknown
}

export function composeWorkshopLayout(record: WorkshopRecord): LayoutBlock[] {
  const blocks: LayoutBlock[] = []

  const description = contentBlock(record.description, { heading: 'What it is' })
  if (description) blocks.push(description)
  const format = contentBlock(record.format, { heading: 'Format' })
  if (format) blocks.push(format)
  const audience = contentBlock(record.audience, { heading: 'Who it is for' })
  if (audience) blocks.push(audience)

  const deliverables = (record.deliverables ?? [])
    .map((d) => (d?.label ? { label: d.label } : null))
    .filter((d): d is { label: string } => d !== null)
  if (deliverables.length >= 3) {
    // The deliverables block requires minRows 3; use it when satisfied.
    blocks.push({ blockType: 'deliverables', heading: 'What you leave with', items: deliverables })
  } else if (deliverables.length > 0) {
    // 1–2 items can't satisfy the block's minRows — preserve them as a content
    // list so no deliverable is lost (fidelity, SC-003).
    const body = buildLexical(deliverables.map((d) => ({ kind: 'p' as const, text: d.label })))
    const block = contentBlock(body, { heading: 'What you leave with' })
    if (block) blocks.push(block)
  }

  const photos = (record.photos ?? [])
    .map((p) => {
      const image = relId(p?.image)
      return image != null ? { image, caption: p?.caption ?? null } : null
    })
    .filter((p): p is { image: string | number; caption: string | null } => p !== null)
  if (photos.length > 0) {
    blocks.push({
      blockType: 'gallery',
      heading: 'What a real workshop looks like',
      layout: 'grid',
      columns: '3',
      items: photos,
    })
  }

  const video = record.video
  if (video?.videoId) {
    blocks.push({
      blockType: 'video-embed',
      provider: video.provider === 'vimeo' ? 'vimeo' : 'youtube',
      videoId: video.videoId,
      title: video.title ?? `${record.title ?? 'Workshop'} recap`,
    })
  }

  const testimonialId = relId(record.testimonial)
  if (testimonialId != null) {
    blocks.push({ blockType: 'testimonial-block', testimonial: testimonialId, layout: 'centered' })
  }

  // Template tail (the retired page's DownloadCard + inquiry form) → a single
  // contact CTA. The bespoke HubSpot inquiry form / download-card required a
  // validated form GUID + cover image the records don't carry, so the faithful,
  // publishable equivalent is contact-cta (data-model.md: "contact-cta/hubspot-form").
  blocks.push({
    blockType: 'contact-cta',
    heading: 'Request this workshop',
    body: 'Tell us about your team and we will follow up with dates.',
    primaryCta: { label: 'Book a call', url: '/contact/book-a-call' },
  })

  return blocks
}

// CLI bootstrap — skipped when imported as a module by tests.
const invokedDirectly = (() => {
  const entry = process.argv[1]
  if (!entry) return false
  return entry.endsWith('workshopToLayout.ts') || entry.endsWith('workshopToLayout.js')
})()

if (invokedDirectly) {
  runComposer({ collection: 'workshops', compose: (record) => composeWorkshopLayout(record) })
    .then((summary) => process.exit(summary.exitCode))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
