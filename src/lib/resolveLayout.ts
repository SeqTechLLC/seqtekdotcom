import type { CaseStudy, Post, Service } from '../payload-types'
import {
  listCaseStudies,
  listPosts,
  listServicePillars,
  listServices,
  listTeamMembers,
} from './payload'
import type { ResolvedBlockType } from './resolvedBlockTypes'

/**
 * ROADMAP UI-2 — resolve collection-backed blocks at template time.
 *
 * Four blocks let an author pick a `source`/`filter` (latest posts, case
 * studies by industry, services by pillar, leadership-only team members)
 * instead of hand-picking rows. Nothing ever consumed those selects: the
 * render components only knew how to draw `manualItems`, so a block set to any
 * non-manual source drew the literal string "Source: latest (resolves at
 * template time)" as public body copy. `team-grid` was the worst of them,
 * because `filter` is its one REQUIRED field while `manualItems` is described
 * as an optional override — the natural authoring path produced the broken
 * page.
 *
 * This module is the "template time" those placeholders were deferring to. The
 * routes await it before handing the layout to `RenderBlocks`, so:
 *
 *   - blocks stay pure, synchronous, presentational components (they render
 *     whatever `manualItems` they are handed and nothing else), which keeps
 *     `RenderBlocks` synchronous and keeps every block renderable by React
 *     Testing Library in the int suite;
 *   - the collection reads go through the existing cached readers in
 *     `lib/payload.ts`, so they inherit the cache tags, the hourly
 *     revalidation and the `withReadTimeout` guard (ADR 0007) for free;
 *   - `source`/`filter` become authoring-time inputs consumed HERE, and are
 *     not read by any component.
 *
 * A read that times out throws rather than degrading to an empty section: a
 * page that silently drops a band of content while reporting success is the
 * exact failure this codebase keeps getting bitten by.
 */

export interface LayoutBlock {
  blockType: string
  [key: string]: unknown
}

/** A relationship field arrives either as a raw id or as a populated doc. */
const relationId = (value: unknown): string | number | null => {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value !== null && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return id
  }
  return null
}

/** Compare via `String` so a numeric id and its string form still match. */
const sameRelation = (a: unknown, b: unknown): boolean => {
  const left = relationId(a)
  const right = relationId(b)
  return left !== null && right !== null && String(left) === String(right)
}

const relationListHas = (values: unknown, target: unknown): boolean =>
  Array.isArray(values) && values.some((value) => sameRelation(value, target))

const hasManualItems = (block: LayoutBlock): boolean =>
  Array.isArray(block.manualItems) && block.manualItems.length > 0

const limitOf = (block: LayoutBlock, fallback: number): number => {
  const raw = block.limit
  return typeof raw === 'number' && raw > 0 ? raw : fallback
}

/** The two fields the team ordering actually reads. */
interface TeamOrdering {
  isLeadership?: boolean | null
  order?: number | null
}

/**
 * Leadership first, then by `order` (unset last). Shared with `/team` so the
 * listing page and a `team-grid` block set to "All" agree on sequence. Typed
 * structurally rather than as `TeamMember` so it stays callable on any shape
 * carrying the two fields it reads.
 */
export const byLeadershipThenOrder = (a: TeamOrdering, b: TeamOrdering): number => {
  const lead = Number(Boolean(b.isLeadership)) - Number(Boolean(a.isLeadership))
  if (lead !== 0) return lead
  return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
}

async function resolveTeamGrid(block: LayoutBlock): Promise<LayoutBlock> {
  // `manualItems` is documented on the block as an override that wins over the
  // filter, so an explicit pick is honoured before any query runs.
  if (hasManualItems(block)) return block
  const members = await listTeamMembers()
  const picked =
    block.filter === 'leadership-only' ? members.filter((m) => Boolean(m.isLeadership)) : members
  return { ...block, manualItems: [...picked].sort(byLeadershipThenOrder) }
}

async function resolvePostList(block: LayoutBlock): Promise<LayoutBlock> {
  if (block.source === 'manual') return block
  const posts = await listPosts() // already sorted `-publishedAt`
  const picked: Post[] =
    block.source === 'by-category'
      ? posts.filter((p) => relationListHas(p.categories, block.category))
      : posts
  return { ...block, manualItems: picked.slice(0, limitOf(block, 3)) }
}

async function resolveCaseStudyGrid(block: LayoutBlock): Promise<LayoutBlock> {
  if (block.source === 'manual') return block
  const studies = await listCaseStudies() // already sorted `-publishedAt`
  let picked: CaseStudy[] = studies
  if (block.source === 'by-industry') {
    picked = studies.filter((s) => sameRelation(s.industry, block.industry))
  } else if (block.source === 'by-service') {
    picked = studies.filter((s) => relationListHas(s.services, block.service))
  }
  return { ...block, manualItems: picked.slice(0, limitOf(block, 3)) }
}

async function resolveServiceCards(block: LayoutBlock): Promise<LayoutBlock> {
  if (block.source === 'manual') return block
  const services = await listServices() // already sorted by `order`
  if (block.source !== 'by-pillar') return { ...block, manualItems: services }

  // SVC-2 moved this relation from the leaf to the group: a service no longer
  // names one pillar, the pillar holds an ordered list of its services. So the
  // filter became a lookup, and the group's chosen ORDER is what renders —
  // previously this fell back to the services' own `order`.
  const pillars = await listServicePillars()
  const pillar = pillars.find((p) => sameRelation(p, block.pillar))
  const ids = new Set(
    (pillar?.items ?? []).map((item) => (typeof item === 'object' ? item.id : item)),
  )
  // Walk the pillar's list, not the service list, so the editor's ordering wins.
  const byId = new Map(services.map((s) => [s.id, s]))
  const picked = [...ids].map((id) => byId.get(id as number)).filter((s): s is Service => !!s)
  return { ...block, manualItems: picked }
}

/**
 * Keyed by `ResolvedBlockType` rather than `string`: the union is what
 * `blockOutputContract.int.spec.tsx` checks `resolvedUpstream` declarations
 * against, and typing the record this way means deleting a resolver here, or
 * adding one without listing it in `resolvedBlockTypes.ts`, is a compile error
 * instead of a silently green gate.
 */
const RESOLVERS: Record<ResolvedBlockType, (block: LayoutBlock) => Promise<LayoutBlock>> = {
  'team-grid': resolveTeamGrid,
  'post-list': resolvePostList,
  'case-study-grid': resolveCaseStudyGrid,
  'service-cards': resolveServiceCards,
}

/**
 * Fill in every collection-backed block's items, leaving all other blocks
 * untouched. Call this in the route, then hand the result to `RenderBlocks`.
 */
export async function resolveLayout(
  blocks: LayoutBlock[] | null | undefined,
): Promise<LayoutBlock[]> {
  if (!blocks || blocks.length === 0) return []
  return Promise.all(
    blocks.map((block) => {
      // `RESOLVERS` is keyed by the narrow union, so the string blockType
      // needs a membership check before it can index it.
      const resolver = Object.hasOwn(RESOLVERS, block.blockType)
        ? RESOLVERS[block.blockType as ResolvedBlockType]
        : undefined
      return resolver ? resolver(block) : Promise.resolve(block)
    }),
  )
}
