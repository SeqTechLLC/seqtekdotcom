import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CARD_COLLECTIONS } from '../../../src/lib/cardCollections'
import { Cards } from '../../../src/components/sections/Cards'

/**
 * A collection-backed grid with nothing to show renders NOTHING — not a heading.
 *
 * Its items resolve at RENDER, so an author never sees the empty state while
 * editing, and an industry page whose filter matches no case study would
 * otherwise ship a heading promising proof that does not exist.
 */
describe('a grid with no items renders nothing at all', () => {
  const cases = [
    // The `cards` block, in every collection and both displays. Its lists are
    // the ones most likely to come back empty: they fill themselves at render.
    ...CARD_COLLECTIONS.flatMap((collection) =>
      (['grid', 'featured'] as const).map((display) => ({
        name: `Cards (${collection}, ${display})`,
        render: (items: unknown[] | null) => (
          <Cards
            heading="Selected work"
            intro="An intro that must not stand alone either."
            collection={collection}
            display={display}
            manualItems={items}
          />
        ),
      })),
    ),
  ]

  for (const c of cases) {
    it(`${c.name}: no heading when the item list is empty`, () => {
      const { container } = render(c.render([]))
      expect(container.innerHTML).toBe('')
    })

    it(`${c.name}: no heading when the item list is null`, () => {
      const { container } = render(c.render(null))
      expect(container.innerHTML).toBe('')
    })

    it(`${c.name}: no heading when every item is an unpopulated relation id`, () => {
      // depth-0 reads, and any relation the caller could not populate, arrive as
      // bare ids. They are filtered out, which can empty a list that looked full.
      const { container } = render(c.render([1, 2, 3]))
      expect(container.innerHTML).toBe('')
    })
  }

  it('a case-study grid still renders once it has one real item', () => {
    const { container } = render(
      <Cards
        heading="Selected work"
        collection="caseStudies"
        manualItems={[{ id: 1, title: 'NovaMud', slug: 'novamud' }] as never}
      />,
    )
    expect(container.textContent).toContain('Selected work')
    expect(container.textContent).toContain('NovaMud')
  })
})
