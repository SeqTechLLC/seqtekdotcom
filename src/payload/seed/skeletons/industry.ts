import { buildLexical } from '../showcase/lexical'

// ADR 0009 — default block skeleton for NEW industry records. Sourced by
// `Industries.layout`'s `defaultValue`. Fully editable after create; uniformity
// comes from this content-level template, never from a render template.
//
// Leads with a hero because `/industries/[slug]` renders its body through
// RenderBlocks with no route-owned `<h1>` (the `/partners/[slug]` shape), so
// the h1 has to come from the content.
//
// ROADMAP IND-1's bar for an industry page is the same one a group page has to
// clear: a page that only asserts "we work in X" is worse than no page. The
// proof section is a `case-study-grid` set to `by-industry`, which fills itself
// from whatever is tagged to that industry — so an industry with no case study
// renders a visibly empty section rather than a claim with nothing behind it.
//
// It is NOT in this skeleton, and cannot be: the block's `industry` field is
// `requiredWhen(source === 'by-industry')` (`CaseStudyGrid.ts:63`), and a
// `defaultValue` has no document id to point at — a self-referential grid would
// save as a required-and-empty relation. So the seeded industries carry the
// grid (see the content repo's `industries.json`) and an admin-created one
// needs it added by hand after create. Clearing the bar above is a step the
// editor still has to take.
export const industrySkeleton = (): Array<Record<string, unknown>> => [
  {
    blockType: 'hero',
    variant: 'text-only',
    alignment: 'left',
    eyebrow: 'Industry',
    headline: 'Industry name',
    subheadline: 'What this sector needs from a technology partner, in one or two sentences.',
  },
  {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([
      { kind: 'h', tag: 'h2', text: 'What we do here' },
      {
        kind: 'p',
        text: 'The problems this sector brings us, and what our work on them looks like.',
      },
    ]),
  },
]

export default industrySkeleton
