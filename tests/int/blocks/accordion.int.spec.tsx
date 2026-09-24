import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AccordionBlock } from '../../../src/components/sections/AccordionBlock'
import { buildLexical } from '../../../src/payload/seed/showcase/lexical'

/**
 * The `accordion` block replaces faq, accordion and tabs. The tabs describe is
 * `interactionBlocks.int.spec.tsx`'s `<Tabs />` suite carried over onto
 * `display: tabs`; the output-contract gate can see that a control moves the
 * HTML, only this can see that the interaction itself works.
 */

const item = (id: string, title: string, text: string) => ({
  id,
  title,
  body: buildLexical([{ kind: 'p', text }]),
})

const ITEMS = [
  item('a', 'Discovery', 'Two weeks finding the real problem.'),
  item('b', 'Build', 'A team that ships every fortnight.'),
  item('c', 'Handover', 'Your people own it at the end.'),
]

describe('<AccordionBlock display="tabs" /> shows one panel at a time', () => {
  const tabs = { display: 'tabs' as const, items: ITEMS }

  it('hides every panel but the selected one', () => {
    const { getAllByRole } = render(<AccordionBlock heading="How we work" {...tabs} />)
    const panels = getAllByRole('tabpanel', { hidden: true })
    expect(panels).toHaveLength(ITEMS.length)
    expect(panels.filter((p) => !p.hasAttribute('hidden'))).toHaveLength(1)
    expect(panels[0].hasAttribute('hidden')).toBe(false)
    expect(panels[0].textContent).toBe('Two weeks finding the real problem.')
  })

  it('swaps the visible panel when a tab is clicked', () => {
    const { getByRole } = render(<AccordionBlock {...tabs} />)
    fireEvent.click(getByRole('tab', { name: 'Handover' }))
    expect(getByRole('tabpanel', { name: 'Handover' }).hasAttribute('hidden')).toBe(false)
    expect(getByRole('tab', { name: 'Handover' }).getAttribute('aria-selected')).toBe('true')
    expect(getByRole('tab', { name: 'Discovery' }).getAttribute('aria-selected')).toBe('false')
  })

  it('moves between tabs with the arrow keys and wraps at the ends', () => {
    const { getByRole } = render(<AccordionBlock {...tabs} />)
    fireEvent.keyDown(getByRole('tab', { name: 'Discovery' }), { key: 'ArrowLeft' })
    expect(getByRole('tab', { name: 'Handover' }).getAttribute('aria-selected')).toBe('true')
  })

  it('moves focus with the selection, so arrow keys can keep going', () => {
    const { getByRole } = render(<AccordionBlock {...tabs} />)
    fireEvent.keyDown(getByRole('tab', { name: 'Discovery' }), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(getByRole('tab', { name: 'Build' }))
  })

  it('names the tablist by the visible heading instead of repeating it', () => {
    const { getByRole } = render(<AccordionBlock heading="How we work" {...tabs} />)
    const tablist = getByRole('tablist')
    expect(tablist.getAttribute('aria-label')).toBeNull()
    const labelledBy = tablist.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    expect(document.getElementById(labelledBy as string)?.textContent).toBe('How we work')
  })

  it('falls back to a literal label when there is no heading', () => {
    const { getByRole } = render(<AccordionBlock {...tabs} />)
    const tablist = getByRole('tablist')
    expect(tablist.getAttribute('aria-labelledby')).toBeNull()
    expect(tablist.getAttribute('aria-label')).toBe('Sections')
  })

  it('jumps to the ends with Home and End', () => {
    const { getByRole } = render(<AccordionBlock {...tabs} />)
    fireEvent.keyDown(getByRole('tab', { name: 'Discovery' }), { key: 'End' })
    expect(getByRole('tab', { name: 'Handover' }).getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(getByRole('tab', { name: 'Handover' }), { key: 'Home' })
    expect(getByRole('tab', { name: 'Discovery' }).getAttribute('aria-selected')).toBe('true')
  })

  it('wraps forward off the last tab', () => {
    const { getByRole } = render(<AccordionBlock {...tabs} />)
    fireEvent.keyDown(getByRole('tab', { name: 'Discovery' }), { key: 'End' })
    fireEvent.keyDown(getByRole('tab', { name: 'Handover' }), { key: 'ArrowRight' })
    expect(getByRole('tab', { name: 'Discovery' }).getAttribute('aria-selected')).toBe('true')
  })

  it('renders nothing rather than an empty tab strip', () => {
    const { container } = render(<AccordionBlock heading="How we work" display="tabs" items={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('keeps only the selected tab in the tab order', () => {
    const { getAllByRole } = render(<AccordionBlock {...tabs} />)
    const order = getAllByRole('tab').map((t) => t.getAttribute('tabindex'))
    expect(order).toEqual(['0', '-1', '-1'])
  })

  it('handles any number of tabs', () => {
    const many = Array.from({ length: 9 }, (_, i) => item(`t${i}`, `Tab ${i}`, `Panel ${i}`))
    const { getAllByRole } = render(<AccordionBlock display="tabs" items={many} />)
    expect(getAllByRole('tab')).toHaveLength(9)
  })
})

describe('<AccordionBlock display="accordion" /> (from faq and accordion)', () => {
  it('draws each item as a closed native disclosure with a rich-text body', () => {
    const { container, getByText } = render(
      <AccordionBlock heading="Honest answers" items={ITEMS} />,
    )
    const details = container.querySelectorAll('details')
    expect(details).toHaveLength(ITEMS.length)
    for (const d of details) expect(d.hasAttribute('open')).toBe(false)
    expect(getByText('Discovery').closest('summary')).toBeTruthy()
    expect(details[0].querySelector('.prose p')?.textContent).toBe(
      'Two weeks finding the real problem.',
    )
    expect(container.querySelector('[role="tablist"]')).toBeNull()
  })

  it('keeps the heading and panels in one centred reading column', () => {
    const { container } = render(<AccordionBlock heading="Honest answers" items={ITEMS} />)
    const column = container.querySelector('h2')?.parentElement
    expect(column?.className).toMatch(/max-w-prose/)
    expect(column?.className).toMatch(/mx-auto/)
    expect(column?.querySelector('ul')).toBeTruthy()
  })

  it('does not give the heading an id nothing points at', () => {
    const { container } = render(<AccordionBlock heading="Honest answers" items={ITEMS} />)
    expect(container.querySelector('h2')?.hasAttribute('id')).toBe(false)
  })

  it('renders nothing with no items', () => {
    expect(render(<AccordionBlock heading="Honest answers" items={[]} />).container.innerHTML).toBe(
      '',
    )
  })

  it('inverts the rich text on the dark band', () => {
    const { container } = render(<AccordionBlock background="inverse" items={ITEMS} />)
    expect(container.querySelector('.prose')?.className).toMatch(/prose-invert/)
  })
})
