import { buildLexical } from '../showcase/lexical'

// spec 010 US2 (FR-008) — default block skeleton for a team-member `layout`. Payload applies
// a `defaultValue` on READ as well as create, so this also fills any existing
// row whose `layout` was never written — see `skeletonDefaultValue.int.spec.ts`.
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
