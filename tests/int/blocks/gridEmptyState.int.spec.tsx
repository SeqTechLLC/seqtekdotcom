import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CaseStudyGrid } from '../../../src/components/sections/CaseStudyGrid'
import { IndustryGrid } from '../../../src/components/sections/IndustryGrid'

/**
 * A collection-backed grid with nothing to show renders NOTHING — not a heading.
 *
 * Found by looking at `/industries/oil-and-gas` on the lane: `CaseStudyGrid`
 * rendered "Selected work" with an empty space beneath it, because the case
 * studies were still tagged to industries the IND-1 seed had just retired.
 * `IndustryGrid` already returned null in that situation; `CaseStudyGrid` did
 * not.
 *
 * The data was repairable, but the shape is not a one-off. These grids resolve
 * their items at RENDER (`source: by-industry`, `latest`, `by-service`), so an
 * author never sees the empty state while editing — and per CONTENT_NEEDS §11,
 * five of the seven industries have no case study to point at, so five pages
 * would have shipped a heading promising proof that does not exist. That
 * document's own rule is that a claim we cannot point at loses at our size.
 */
describe('a grid with no items renders nothing at all', () => {
  const cases = [
    {
      name: 'CaseStudyGrid',
      render: (items: unknown[] | null) => (
        <CaseStudyGrid heading="Selected work" manualItems={items as never} />
      ),
    },
    {
      name: 'IndustryGrid',
      render: (items: unknown[] | null) => (
        <IndustryGrid heading="Sectors" industries={items as never} />
      ),
    },
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

  it('CaseStudyGrid still renders once it has one real item', () => {
    const { container } = render(
      <CaseStudyGrid
        heading="Selected work"
        manualItems={[{ id: 1, title: 'NovaMud', slug: 'novamud' }] as never}
      />,
    )
    expect(container.textContent).toContain('Selected work')
    expect(container.textContent).toContain('NovaMud')
  })
})
