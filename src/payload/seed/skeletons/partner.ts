import { buildLexical } from '../showcase/lexical'

// ADR 0009 — default block skeleton for NEW partner records. Sourced by
// `Partners.layout`'s `defaultValue`. Fully editable after create; uniformity
// comes from this content-level template, never from a render template.
//
// Leads with a hero because `/partners/[slug]` renders its body through
// RenderBlocks with no route-owned `<h1>` (the `/services/[offering]` shape,
// not the `/team/[slug]` one) — so the h1 has to come from the content. The
// h2-first skeletons (caseStudy, workshop, teamMember) can start at h2 only
// because their routes render an h1 from typed metadata.
export const partnerSkeleton = (): Array<Record<string, unknown>> => [
  {
    blockType: 'hero',
    variant: 'text-only',
    alignment: 'left',
    eyebrow: 'SEQTEK partner',
    headline: 'Partner name',
    subheadline: 'What this partnership gives clients, in one or two sentences.',
  },
  {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([
      { kind: 'h', tag: 'h2', text: 'About the partnership' },
      { kind: 'p', text: 'What this partner does and why SEQTEK works with them.' },
    ]),
  },
]

export default partnerSkeleton
