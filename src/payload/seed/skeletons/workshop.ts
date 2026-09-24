import { buildLexical } from '../showcase/lexical'

// spec 010 US1 (FR-008) — default block skeleton for a workshop `layout`. Payload applies a
// `defaultValue` on READ as well as create, so this also fills any existing
// row whose `layout` was never written — see `skeletonDefaultValue.int.spec.ts`.
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
    blockType: 'items',
    heading: 'What you leave with',
    layout: 'list',
    markers: 'none',
    items: [
      { title: 'First concrete deliverable' },
      { title: 'Second concrete deliverable' },
      { title: 'Third concrete deliverable' },
    ],
  },
  {
    blockType: 'cta',
    action: 'buttons',
    heading: 'Request this workshop',
    body: 'Tell us about your team and we will follow up with dates.',
    primaryCta: { label: 'Book a call', url: '/contact' },
  },
]

export default workshopSkeleton
