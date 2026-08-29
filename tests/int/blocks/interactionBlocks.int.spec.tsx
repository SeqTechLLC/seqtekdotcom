import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Tabs } from '../../../src/components/sections/Tabs'
import { VideoEmbed } from '../../../src/components/sections/VideoEmbed'

/**
 * ROADMAP INERT-2 — the two blocks whose controls promised an interaction the
 * page never performed. The output-contract gate can see that a control moves
 * the HTML; only these can see that the interaction itself works.
 */

const TABS = [
  { id: 'a', label: 'Discovery', body: 'Two weeks finding the real problem.' },
  { id: 'b', label: 'Build', body: 'A team that ships every fortnight.' },
  { id: 'c', label: 'Handover', body: 'Your people own it at the end.' },
]

describe('<Tabs /> shows one panel at a time (INERT-2)', () => {
  it('hides every panel but the selected one', () => {
    const { getAllByRole } = render(<Tabs heading="How we work" tabs={TABS} />)
    // `hidden: true` includes the panels that are hidden — the point of the
    // assertion is that there are three of them and exactly one is showing.
    const panels = getAllByRole('tabpanel', { hidden: true })
    expect(panels).toHaveLength(TABS.length)
    expect(panels.filter((p) => !p.hasAttribute('hidden'))).toHaveLength(1)
    expect(panels[0].hasAttribute('hidden')).toBe(false)
    expect(panels[0].textContent).toBe(TABS[0].body)
  })

  it('swaps the visible panel when a tab is clicked', () => {
    const { getByRole } = render(<Tabs tabs={TABS} />)
    fireEvent.click(getByRole('tab', { name: 'Handover' }))
    expect(getByRole('tabpanel', { name: 'Handover' }).hasAttribute('hidden')).toBe(false)
    expect(getByRole('tab', { name: 'Handover' }).getAttribute('aria-selected')).toBe('true')
    expect(getByRole('tab', { name: 'Discovery' }).getAttribute('aria-selected')).toBe('false')
  })

  it('moves between tabs with the arrow keys and wraps at the ends', () => {
    const { getByRole } = render(<Tabs tabs={TABS} />)
    fireEvent.keyDown(getByRole('tab', { name: 'Discovery' }), { key: 'ArrowLeft' })
    expect(getByRole('tab', { name: 'Handover' }).getAttribute('aria-selected')).toBe('true')
  })

  it('names the tablist by the visible heading instead of repeating it', () => {
    const { getByRole } = render(<Tabs heading="How we work" tabs={TABS} />)
    const tablist = getByRole('tablist')
    // `aria-label` here would make a screen reader read "How we work" twice —
    // once for the <h2>, once for the tablist. Point at the heading instead.
    expect(tablist.getAttribute('aria-label')).toBeNull()
    const labelledBy = tablist.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    expect(document.getElementById(labelledBy as string)?.textContent).toBe('How we work')
  })

  it('falls back to a literal label when there is no heading', () => {
    const { getByRole } = render(<Tabs tabs={TABS} />)
    const tablist = getByRole('tablist')
    expect(tablist.getAttribute('aria-labelledby')).toBeNull()
    expect(tablist.getAttribute('aria-label')).toBe('Sections')
  })

  it('keeps only the selected tab in the tab order', () => {
    const { getAllByRole } = render(<Tabs tabs={TABS} />)
    const order = getAllByRole('tab').map((t) => t.getAttribute('tabindex'))
    expect(order).toEqual(['0', '-1', '-1'])
  })
})

const VIDEO = {
  provider: 'youtube' as const,
  videoId: 'abc123',
  title: 'What localshoring actually changes',
}
const POSTER = { url: '/media/poster.jpg', alt: 'Two people at a whiteboard' }

describe('<VideoEmbed /> poster is a real facade (INERT-2)', () => {
  it('embeds the player directly when there is no poster', () => {
    const { container } = render(<VideoEmbed {...VIDEO} />)
    expect(container.querySelector('iframe')?.getAttribute('src')).toContain('abc123')
  })

  it('shows the poster instead of loading the third-party frame', () => {
    const { container, getByRole } = render(<VideoEmbed {...VIDEO} thumbnail={POSTER} />)
    expect(container.querySelector('iframe')).toBeNull()
    expect(getByRole('button', { name: /Play video/ })).toBeTruthy()
  })

  it('swaps in the player when the poster is clicked', () => {
    const { container, getByRole } = render(<VideoEmbed {...VIDEO} thumbnail={POSTER} />)
    fireEvent.click(getByRole('button', { name: /Play video/ }))
    const src = container.querySelector('iframe')?.getAttribute('src')
    expect(src).toContain('abc123')
    expect(src).toContain('autoplay=1')
  })

  it('builds the vimeo player from the same id', () => {
    const { container } = render(<VideoEmbed {...VIDEO} provider="vimeo" />)
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://player.vimeo.com/video/abc123',
    )
  })
})
