import { buildLexical } from '../showcase/lexical'

// spec 010 US2 (FR-008) — default block skeleton for a case-study `layout`. Payload applies
// a `defaultValue` on READ as well as create, so this also fills any existing
// row whose `layout` was never written — see `skeletonDefaultValue.int.spec.ts`.
// Sourced by `CaseStudies.layout`'s `defaultValue`. Fully editable after create.
export const caseStudySkeleton = (): Array<Record<string, unknown>> => [
  {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([
      { kind: 'h', tag: 'h2', text: 'The problem' },
      { kind: 'p', text: 'What the client was up against, in their terms.' },
    ]),
  },
  {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([
      { kind: 'h', tag: 'h2', text: 'The solution' },
      { kind: 'p', text: 'What we built and how we approached it.' },
    ]),
  },
  {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([
      { kind: 'h', tag: 'h2', text: 'The impact' },
      { kind: 'p', text: 'The measurable outcome the work delivered.' },
    ]),
  },
]

export default caseStudySkeleton
