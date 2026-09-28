import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Cards } from '../../../src/components/sections/Cards'

/**
 * ROADMAP IND-1. Industry cards (the `cards` block, collection `industries`)
 * link to `/industries/<slug>` only when the industry has a body. The other
 * fixtures synthesize industries with no `layout`, so this spec is what
 * exercises the linked branch.
 *
 * `isLinkable` reads `layout`, which the reader returns because it passes no
 * `select` and `Industries` has no `defaultPopulate`. These cases pin the rule
 * on hand-built docs; they would not catch either being added.
 */
describe('industry cards — a card links only where the route resolves', () => {
  const industry = (over: Record<string, unknown> = {}) => ({
    id: 1,
    title: 'Oil and Gas',
    slug: 'oil-and-gas',
    _status: 'published' as const,
    layout: [{ blockType: 'hero' }],
    ...over,
  })

  const linkFor = (doc: Record<string, unknown>) =>
    render(<Cards collection="industries" manualItems={[doc as never]} />).container.querySelector(
      'a[href="/industries/oil-and-gas"]',
    )

  it('links a published industry that has a body', () => {
    expect(linkFor(industry())).not.toBeNull()
  })

  it('does not link a published industry with an empty body', () => {
    // `/industries/[slug]` calls notFound() on an empty layout, so a link here
    // would advertise a 404. Note this state is hard to reach through Payload:
    // a skeleton `defaultValue` fills `layout` on read, which is why the
    // pre-IND-1 rows served placeholder pages rather than 404ing. See
    // `skeletonDefaultValue.int.spec.ts`. The guard is the cheap half of the
    // promise, not a description of what those rows did.
    expect(linkFor(industry({ layout: [] }))).toBeNull()
  })

  it('does not link a published industry whose body was never populated', () => {
    // The `defaultPopulate` / `select` hazard: the field is simply absent.
    expect(linkFor(industry({ layout: undefined }))).toBeNull()
  })

  it('does not link a published industry whose body is NULL', () => {
    // `null` is a real shape — the generated `Industry` type declares
    // `layout?: (…)[] | null` — so the predicate has to handle it. It is NOT
    // what the five pre-IND-1 rows did: those read back with a skeleton body
    // and served placeholder pages (`skeletonDefaultValue.int.spec.ts`). Pinned
    // because the predicate must stay correct for a shape the types permit,
    // whether or not the database currently produces it.
    expect(linkFor(industry({ layout: null }))).toBeNull()
  })

  it('does not link a draft, even with a body', () => {
    expect(linkFor(industry({ _status: 'draft' }))).toBeNull()
  })

  it('still renders the card in every unlinked case', () => {
    // A card losing its LINK must not lose the card — dropping it entirely
    // makes the block's output depend on a field the caller may not select.
    for (const over of [
      { layout: [] },
      { layout: undefined },
      { layout: null },
      { _status: 'draft' as const },
    ]) {
      const { container } = render(
        <Cards collection="industries" manualItems={[industry(over) as never]} />,
      )
      expect(container.textContent).toContain('Oil and Gas')
      expect(container.querySelectorAll('li')).toHaveLength(1)
    }
  })
})
