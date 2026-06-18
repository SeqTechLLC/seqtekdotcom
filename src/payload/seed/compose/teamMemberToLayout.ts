import { buildLexical, contentBlock, runComposer, type LayoutBlock } from './shared'

// spec 010 US2 (Phase E) — team-member field→layout composer per data-model.md:
//   content(bio) → expertise → certifications → education → personalFacts →
//   quote. Arrays map to deliverables/key-takeaways where they satisfy the
//   block's minRows, otherwise to a content list so nothing is lost (SC-003).
// name/title/role/photo/links stay collection metadata (route header + Person
// JSON-LD).

interface TeamMemberRecord {
  bio?: unknown
  expertise?: Array<{ label?: string | null } | null> | null
  certifications?: Array<{ label?: string | null } | null> | null
  education?: Array<{ degree?: string | null; institution?: string | null } | null> | null
  personalFacts?: Array<{ label?: string | null } | null> | null
  quote?: string | null
  [key: string]: unknown
}

const labels = (arr: Array<{ label?: string | null } | null> | null | undefined): string[] =>
  (arr ?? []).map((x) => x?.label).filter((l): l is string => typeof l === 'string' && l.length > 0)

/** A content block whose body is one paragraph per line, under a heading. */
const listContentBlock = (heading: string, lines: string[]): LayoutBlock | null =>
  lines.length > 0
    ? contentBlock(buildLexical(lines.map((text) => ({ kind: 'p' as const, text }))), { heading })
    : null

export function composeTeamMemberLayout(record: TeamMemberRecord): LayoutBlock[] {
  const blocks: LayoutBlock[] = []

  const bio = contentBlock(record.bio, { heading: 'About' })
  if (bio) blocks.push(bio)

  // Expertise → deliverables when 3..8; otherwise a content list.
  const expertise = labels(record.expertise)
  if (expertise.length >= 3 && expertise.length <= 8) {
    blocks.push({
      blockType: 'deliverables',
      heading: 'Areas of expertise',
      items: expertise.map((label) => ({ label })),
    })
  } else {
    const block = listContentBlock('Areas of expertise', expertise)
    if (block) blocks.push(block)
  }

  const certifications = listContentBlock('Certifications', labels(record.certifications))
  if (certifications) blocks.push(certifications)

  const education = (record.education ?? [])
    .map((e) => (e?.degree && e?.institution ? `${e.degree}, ${e.institution}` : null))
    .filter((l): l is string => l !== null)
  const educationBlock = listContentBlock('Education', education)
  if (educationBlock) blocks.push(educationBlock)

  // Personal facts → key-takeaways when 3..6; otherwise a content list.
  const facts = labels(record.personalFacts)
  if (facts.length >= 3 && facts.length <= 6) {
    blocks.push({
      blockType: 'key-takeaways',
      heading: 'Good to know',
      items: facts.map((label) => ({ label })),
    })
  } else {
    const block = listContentBlock('Good to know', facts)
    if (block) blocks.push(block)
  }

  // Quote is a plain textarea (not a testimonials relationship), so it composes
  // into a content block rather than testimonial-block.
  if (record.quote && record.quote.trim().length > 0) {
    const block = listContentBlock('In their words', [record.quote.trim()])
    if (block) blocks.push(block)
  }

  return blocks
}

const invokedDirectly = (() => {
  const entry = process.argv[1]
  if (!entry) return false
  return entry.endsWith('teamMemberToLayout.ts') || entry.endsWith('teamMemberToLayout.js')
})()

if (invokedDirectly) {
  runComposer({ collection: 'teamMembers', compose: (record) => composeTeamMemberLayout(record) })
    .then((summary) => process.exit(summary.exitCode))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
