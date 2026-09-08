import { describe, expect, it } from 'vitest'

import { Industries } from '../../../src/collections/Industries'
import { collections } from '../../../src/collections'
import { industrySkeleton } from '../../../src/payload/seed/skeletons/industry'
import { SKELETON_PLACEHOLDER_COPY } from '../render/noPlaceholderCopy.int.spec'

/**
 * A `defaultValue` skeleton is applied on READ, not just on create.
 *
 * This is the mechanism that produced live placeholder pages on the first lane
 * deploy of IND-1, and it contradicted what three separate code comments and a
 * PR description all asserted. The reasoning that failed went:
 *
 *   "the migration is additive, so rows created before `layout` existed are
 *    published with an empty body, and `/industries/[slug]` calls notFound()
 *    on an empty layout — so they 404 until the seed retires them."
 *
 * Every step is true except the premise. Payload fills a missing field from its
 * `defaultValue` when the document is read, so those rows came back carrying
 * `industrySkeleton`'s two blocks. They served HTTP 200 with
 * `<h1>Industry name</h1>` and the subheadline "What this sector needs from a
 * technology partner, in one or two sentences." — on five URLs.
 *
 * The consequences are worth stating because they are not obvious:
 *
 *  - An "empty layout" guard is nearly unreachable for a field with a
 *    `defaultValue`. It is not a placeholder guard, and must not be read as one.
 *  - `layout.length > 0` does not mean "an editor wrote something".
 *  - What actually retires a row is UNPUBLISHING it.
 *
 * So this pins the two properties that make the hazard survivable: the
 * `defaultValue` is really there (remove it and the reasoning above becomes
 * true again, silently), and every string it can put on a page is tracked as
 * placeholder copy, so the existing sweeps can see it.
 */
describe('a defaultValue skeleton is placeholder content that ships on read', () => {
  const layoutField = Industries.fields.find((f) => 'name' in f && f.name === 'layout') as
    | { defaultValue?: unknown }
    | undefined

  it('Industries.layout still carries the skeleton as its defaultValue', () => {
    // If this ever stops being true, the empty-layout 404 guard in
    // `/industries/[slug]` starts firing for real and the comment there — which
    // documents the opposite — needs revisiting with it.
    expect(layoutField, 'Industries has no `layout` field').toBeDefined()
    expect(layoutField?.defaultValue, 'layout lost its defaultValue').toBe(industrySkeleton)
  })

  it('produces a non-empty body, which is why the empty-layout guard cannot catch it', () => {
    expect(industrySkeleton().length).toBeGreaterThan(0)
  })

  it('every string it can put on a page is tracked as placeholder copy', () => {
    // Same contract `noPlaceholderCopy` enforces for skeletons generally, but
    // asserted here against the SPECIFIC skeleton that reaches published rows
    // without an editor ever opening them.
    const strings: string[] = []
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(walk)
      if (node === null || typeof node !== 'object') return
      for (const v of Object.values(node as Record<string, unknown>)) {
        if (typeof v === 'string' && /[.:]/.test(v)) strings.push(v)
        else walk(v)
      }
    }
    walk(industrySkeleton())
    const untracked = strings.filter(
      (t) => !SKELETON_PLACEHOLDER_COPY.includes(t as (typeof SKELETON_PLACEHOLDER_COPY)[number]),
    )
    expect(
      untracked,
      `industrySkeleton can publish copy that nothing tracks:\n  ${untracked.join('\n  ')}`,
    ).toEqual([])
  })

  it('pins every collection that ships a skeleton on read', () => {
    // FIVE, not one. Every collection below fills `layout` from a skeleton when
    // the field is missing, so every one of them can serve placeholder copy on a
    // published row that no editor ever opened — the same shape as the six
    // identical "A short professional bio." pages that shipped from
    // `teamMembers`, and the five `<h1>Industry name</h1>` pages that shipped
    // from `industries` on the first IND-1 lane deploy.
    //
    // Adding a collection here is adding a site of that hazard. If this list
    // grows, the new entry needs its placeholder strings tracked in
    // SKELETON_PLACEHOLDER_COPY (the test above) and a content pass before it
    // is published, not after.
    //
    // What makes it FIRE is adding the field to a collection that already has
    // published rows: those rows never had a body, so every read fills one in.
    // Checked on the lane after IND-1 — teamMembers, partners, workshops and
    // caseStudies are all clean, because their rows were created after their
    // `layout` field existed. `industries` was the exception, and the five it
    // exposed were retired by unpublishing them.
    const withDefault = collections
      .filter((c) =>
        c.fields.some((f) => 'name' in f && f.name === 'layout' && 'defaultValue' in f),
      )
      .map((c) => c.slug)
      .sort()
    expect(collections.length, 'no collections found — the scan would be vacuous').toBeGreaterThan(
      5,
    )
    expect(withDefault).toEqual([
      'caseStudies',
      'industries',
      'partners',
      'teamMembers',
      'workshops',
    ])
  })
})
