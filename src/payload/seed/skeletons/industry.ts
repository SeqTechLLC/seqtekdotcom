import { buildLexical } from '../showcase/lexical'

// ADR 0009 — default block skeleton for an industry `layout`. Payload applies a
// `defaultValue` on READ as well as create, so this also fills any existing row
// whose `layout` was never written — see `skeletonDefaultValue.int.spec.ts`. Sourced by
// `Industries.layout`'s `defaultValue`. Fully editable after create; uniformity
// comes from this content-level template, never from a render template.
//
// Leads with a hero because `/industries/[slug]` renders its body through
// RenderBlocks with no route-owned `<h1>` (the `/partners/[slug]` shape), so
// the h1 has to come from the content.
//
// ROADMAP IND-1's bar for an industry page is the same one a group page has to
// clear: a page that only asserts "we work in X" is worse than no page. The
// proof section is a `cards` block of case studies filtered to the industry,
// which fills itself from whatever is tagged to it and renders NOTHING when
// nothing is tagged. The bar above is therefore met by ADDING proof, never by
// the section appearing.
//
// It is NOT in this skeleton, and cannot be: a `defaultValue` has no document
// id to point at, and a blank `industry` filter lists every case study. So the
// seeded industries carry the block (see the content repo's `industries.json`)
// and an admin-created one needs it added by hand after create.
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
