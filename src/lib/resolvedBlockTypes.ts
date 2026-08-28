/**
 * The block types whose `source`/`filter` controls are consumed by
 * `src/lib/resolveLayout.ts` before the block reaches a component, rather than
 * by the component itself (ADR 0009 keeps blocks pure and synchronous).
 *
 * This lives in its own leaf module for two reasons. `resolveLayout` imports
 * `lib/payload.ts`, which is `server-only` and cannot be imported from the
 * Vitest environment at all — so the output-contract gate could not read the
 * list from there. And typing `RESOLVERS` as `Record<ResolvedBlockType, …>`
 * makes the two impossible to diverge: delete a resolver and the object no
 * longer satisfies the record; add one without listing it here and the key is
 * rejected. That is a compile error rather than a gate that stays green.
 */
export const RESOLVED_BLOCK_TYPES = [
  'team-grid',
  // BLOCK_LIBRARY calls this the `latest-insights` variant; the block slug is
  // `post-list` (see src/payload/blocks/layout/PostList.ts).
  'post-list',
  'case-study-grid',
  'service-cards',
] as const

export type ResolvedBlockType = (typeof RESOLVED_BLOCK_TYPES)[number]
