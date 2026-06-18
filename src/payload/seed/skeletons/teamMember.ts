import { buildLexical } from '../showcase/lexical'

// spec 010 US2 (FR-008) — default block skeleton for NEW team-member records.
// Sourced by `TeamMembers.layout`'s `defaultValue`. Fully editable after create.
export const teamMemberSkeleton = (): Array<Record<string, unknown>> => [
  {
    blockType: 'content',
    width: 'standard',
    background: 'none',
    body: buildLexical([
      { kind: 'h', tag: 'h2', text: 'About' },
      { kind: 'p', text: 'A short professional bio.' },
    ]),
  },
]

export default teamMemberSkeleton
