import { buildLexical } from '../showcase/lexical'

// spec 010 US2 (FR-008) — default block skeleton for NEW case-study records.
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
