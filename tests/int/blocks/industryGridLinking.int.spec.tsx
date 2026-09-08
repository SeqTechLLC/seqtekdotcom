import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IndustryGrid } from '../../../src/components/sections/IndustryGrid'

/**
 * ROADMAP IND-1. `IndustryGrid` cards link to `/industries/<slug>` — that is the
 * behaviour this block exists to deliver, and until this spec it was rendered by
 * nothing in CI: `blockOutputContract` synthesizes industries with no `layout`
 * (`blocks` is absent from `SYNTHESIZABLE_TYPES`), `seedIndustries` seeds four
 * without a body, and no e2e page carries the block. Every existing fixture
 * therefore exercised the UNLINKED branch only, so a regression to "no card
 * ever links" would have been green everywhere.
 *
 * The invariant is load-bearing and easy to break from a distance. `isLinkable`
 * reads `layout`, which arrives only because both production readers populate
 * at `depth: 2` with no `select` and no `defaultPopulate`. Adding
 * `defaultPopulate` to `Industries` — the natural fix for the homepage pulling
 * every industry's full page body — would set `layout` to undefined and
 * silently restore the #126 defect this block was re-linked to fix. That is
 * what these assertions are here to catch.
 */
describe('IndustryGrid — a card links only where the route resolves', () => {
  const industry = (over: Record<string, unknown> = {}) => ({
    id: 1,
    title: 'Oil and Gas',
    slug: 'oil-and-gas',
    _status: 'published' as const,
    layout: [{ blockType: 'hero' }],
    ...over,
  })

  const linkFor = (doc: Record<string, unknown>) =>
    render(<IndustryGrid industries={[doc as never]} />).container.querySelector(
      'a[href="/industries/oil-and-gas"]',
    )

  it('links a published industry that has a body', () => {
    expect(linkFor(industry())).not.toBeNull()
  })

  it('does not link a published industry with an empty body', () => {
    // `/industries/[slug]` calls notFound() on an empty layout, so a link here
    // would advertise a 404 — the state every pre-IND-1 row is in between the
    // deploy and the seed.
    expect(linkFor(industry({ layout: [] }))).toBeNull()
  })

  it('does not link a published industry whose body was never populated', () => {
    // The `defaultPopulate` / `select` hazard: the field is simply absent.
    expect(linkFor(industry({ layout: undefined }))).toBeNull()
  })

  it('does not link a draft, even with a body', () => {
    expect(linkFor(industry({ _status: 'draft' }))).toBeNull()
  })

  it('still renders the card in every unlinked case', () => {
    // A card losing its LINK must not lose the card — dropping it entirely
    // makes the block's output depend on a field the caller may not select.
    for (const over of [{ layout: [] }, { layout: undefined }, { _status: 'draft' as const }]) {
      const { container } = render(<IndustryGrid industries={[industry(over) as never]} />)
      expect(container.textContent).toContain('Oil and Gas')
      expect(container.querySelectorAll('li')).toHaveLength(1)
    }
  })
})
