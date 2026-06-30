import { buildLexical } from '../showcase/lexical'

// spec 010 US1 (FR-008) — default block skeleton for NEW workshop records.
// Sourced by `Workshops.layout`'s `defaultValue` so a freshly created workshop
// is uniform by default (curated starting structure), then fully editable.
// Not schema-enforced — an editor can rearrange or delete any block.
export const workshopSkeleton = (): Array<Record<string, unknown>> => [
  {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([
      { kind: 'h', tag: 'h2', text: 'What it is' },
      { kind: 'p', text: 'Describe the workshop: the outcome it drives and how it runs.' },
    ]),
  },
  {
    blockType: 'deliverables',
    heading: 'What you leave with',
    // The deliverables block requires minRows 3; seed three editable placeholders.
    items: [
      { label: 'First concrete deliverable' },
      { label: 'Second concrete deliverable' },
      { label: 'Third concrete deliverable' },
    ],
  },
  {
    blockType: 'contact-cta',
    heading: 'Request this workshop',
    body: 'Tell us about your team and we will follow up with dates.',
    primaryCta: { label: 'Book a call', url: '/contact' },
  },
]

export default workshopSkeleton
