import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  GRID_SIZES,
  Items,
  type ItemsItem,
  type ItemsProps,
} from '../../../src/components/sections/Items'

/**
 * `items` replaces nine blocks (process steps, timeline, nav cards,
 * deliverables, key takeaways, tech stack, stats bar, metric display, mission
 * vision values). The output-contract gate proves every control moves the
 * HTML; this pins WHAT each layout draws, so the look those nine blocks had
 * survives the move.
 */

const media = (n: number) => ({
  url: `/media/photo-${n}.jpg`,
  alt: `Photo ${n}`,
  sizes: {
    mobile_webp: { url: `/media/photo-${n}-mobile.webp`, width: 640 },
    mobile_jpeg: { url: `/media/photo-${n}-mobile.jpg`, width: 640 },
  },
})

const make = (count: number, extra: (i: number) => Partial<ItemsItem> = () => ({})) =>
  Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    title: `Title ${i + 1}`,
    body: `Body ${i + 1}`,
    ...extra(i),
  }))

const draw = (props: ItemsProps) => render(<Items {...props} />).container

const listOf = (container: HTMLElement) => {
  const list = container.querySelector('ol, ul')
  if (!list) throw new Error('no list rendered')
  return list
}

describe('items: nothing to show', () => {
  it('renders nothing with no items', () => {
    expect(draw({ heading: 'Heading', items: [] }).innerHTML).toBe('')
    expect(draw({ heading: 'Heading', items: null }).innerHTML).toBe('')
  })
})

describe('items: grid', () => {
  it('defaults to a plain grid: a heavy rule above each item, no markers', () => {
    const container = draw({ heading: 'What we do', items: make(3) })
    const list = listOf(container)
    expect(list.tagName).toBe('UL')
    const cells = list.querySelectorAll(':scope > li')
    expect(cells).toHaveLength(3)
    for (const cell of cells) expect(cell.className).toContain('border-t-4')
    expect(container.textContent).not.toMatch(/\b1\b/)
  })

  it('card style boxes each item instead of ruling it', () => {
    const cell = listOf(draw({ style: 'card', items: make(3) })).querySelector('li')!
    expect(cell.className).toContain('rounded-md')
    expect(cell.className).toContain('border')
    expect(cell.className).not.toContain('border-t-4')
  })

  it.each([
    [2, false, 'sm:grid-cols-2', 'lg:grid-cols-4'],
    [3, false, 'md:grid-cols-3', 'lg:grid-cols-4'],
    [4, false, 'sm:grid-cols-2', 'lg:grid-cols-4'],
    [4, true, 'lg:grid-cols-4', 'md:grid-cols-3'],
    [5, false, 'lg:grid-cols-3', 'lg:grid-cols-4'],
  ])('%i items (stat-like: %s) lay out as %s', (count, statLike, present, absent) => {
    const items = statLike
      ? make(count, (i) => ({ marker: `${i + 1}0%`, body: null }))
      : make(count)
    const list = listOf(draw({ markers: statLike ? 'custom' : 'none', items }))
    expect(list.className).toContain(present)
    expect(list.className).not.toContain(absent)
  })

  it('never caps the count', () => {
    const list = listOf(draw({ items: make(23) }))
    expect(list.querySelectorAll(':scope > li')).toHaveLength(23)
  })

  it('numbers the items in an ordered list, spoken with the title', () => {
    const container = draw({ heading: 'Steps', markers: 'numbers', items: make(3) })
    expect(listOf(container).tagName).toBe('OL')
    const titles = [...container.querySelectorAll('h3')].map((h) => h.textContent)
    expect(titles).toEqual(['1Title 1', '2Title 2', '3Title 3'])
    expect(container.querySelector('h3 span')?.className).toContain('text-accent-strong')
  })

  it('custom markers draw the typed figure at display size', () => {
    const container = draw({
      markers: 'custom',
      items: make(4, (i) => ({ marker: ['25+', '0.7x', '52%', '8h'][i], body: null })),
    })
    const marker = container.querySelector('li span')!
    expect(marker.textContent).toBe('25+')
    expect(marker.className).toContain('text-display')
  })

  it('a single figure on a coloured band is the old metric display', () => {
    const container = draw({
      markers: 'custom',
      background: 'inverse',
      items: [{ title: 'Cost vs a hire', body: 'Across long engagements.', marker: '0.7x' }],
    })
    const section = container.querySelector('section')!
    expect(section.className).toContain('bg-surface-inverse')
    expect(section.firstElementChild?.className).toContain('text-center')
    const figure = container.querySelector('li span')!
    expect(figure.textContent).toBe('0.7x')
    expect(figure.className).toContain('text-display-xl')
    // Green-500 on the dark band, not the green-700 that would not read there.
    expect(figure.className).toMatch(/(^|\s)text-accent(\s|$)/)
  })

  it('a single plain item takes the reading column, not a one-column grid', () => {
    const container = draw({ heading: 'One thing', items: make(1) })
    expect(container.querySelector('.max-w-prose')).not.toBeNull()
    expect(listOf(container).className).not.toContain('grid')
  })

  it('an image sits above the title, sized from the grid it is in', () => {
    const container = draw({ items: make(3, (i) => ({ image: media(i) })) })
    const cell = listOf(container).querySelector('li')!
    const img = cell.querySelector('img')!
    expect(img.getAttribute('alt')).toBe('Photo 0')
    expect(img.getAttribute('sizes')).toBe(GRID_SIZES.three.plain)
    expect(
      img.compareDocumentPosition(cell.querySelector('p, h2, h3')!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('a link makes the title a link, and its text adds a hidden "label →" line', () => {
    const container = draw({
      heading: 'Where to next',
      items: make(2, (i) =>
        i === 0 ? { link: { url: '/team', label: 'Meet the team' } } : { link: { url: '/work' } },
      ),
    })
    const [first, second] = listOf(container).querySelectorAll(':scope > li')
    expect(first.querySelector('h3 a')?.getAttribute('href')).toBe('/team')
    const more = [...first.querySelectorAll('a')].find((a) => a.textContent?.includes('→'))!
    expect(more.textContent).toBe('Meet the team →')
    expect(more.getAttribute('aria-hidden')).toBe('true')
    expect(more.getAttribute('tabindex')).toBe('-1')
    expect(second.querySelectorAll('a')).toHaveLength(1)
  })
})

describe('items: headings stay in order', () => {
  it('block h2, item h3 when the items have bodies', () => {
    const container = draw({ heading: 'Heading', items: make(2) })
    expect(container.querySelectorAll('h2')).toHaveLength(1)
    expect(container.querySelectorAll('h3')).toHaveLength(2)
  })

  it('item titles step up to h2 when the block has no heading', () => {
    const container = draw({ items: make(2) })
    expect(container.querySelectorAll('h2')).toHaveLength(2)
    expect(container.querySelector('h3')).toBeNull()
  })

  it('titles with nothing under them are not headings', () => {
    const container = draw({ heading: 'Heading', items: make(3, () => ({ body: null })) })
    expect(container.querySelectorAll('h3')).toHaveLength(0)
    expect(container.textContent).toContain('Title 3')
  })
})

describe('items: line', () => {
  const ship = make(4, (i) => ({ marker: 'SHIP'[i] }))

  it('letters hang in a gutter joined by a rule and spell their word', () => {
    const container = draw({ heading: 'Habits', layout: 'line', markers: 'custom', items: ship })
    const list = listOf(container)
    expect(list.tagName).toBe('OL')
    const gutters = [...list.querySelectorAll(':scope > li > [aria-hidden="true"]')]
    expect(gutters.map((g) => g.textContent).join('')).toBe('SHIP')
    // The rule joins each marker to the next, so the last has none.
    expect(gutters[0].querySelectorAll('span')).toHaveLength(2)
    expect(gutters[3].querySelectorAll('span')).toHaveLength(1)
  })

  it('a screen reader hears the marker with the title', () => {
    const container = draw({ heading: 'Habits', layout: 'line', markers: 'custom', items: ship })
    expect(container.querySelector('h3')?.textContent).toBe('S. Title 1')
    expect(container.querySelector('h3 .sr-only')?.textContent).toBe('S. ')
  })

  it('numbers run down the same spine, past nine without a cap', () => {
    const container = draw({ layout: 'line', markers: 'numbers', items: make(12) })
    const gutters = [...container.querySelectorAll('ol > li > [aria-hidden="true"]')]
    expect(gutters).toHaveLength(12)
    expect(gutters[11].textContent).toBe('12')
  })

  it('a date is too long for the gutter, so it runs as a timeline above the title', () => {
    const container = draw({
      layout: 'line',
      markers: 'custom',
      items: make(3, (i) => ({ marker: `${1999 + i * 10}` })),
    })
    const list = listOf(container)
    expect(list.className).toContain('border-l-2')
    expect(container.querySelector('h2')?.textContent).toBe('1999Title 1')
  })

  it('with no markers it is a timeline of dots', () => {
    const container = draw({ layout: 'line', items: make(3) })
    const list = listOf(container)
    expect(list.tagName).toBe('OL')
    expect(list.className).toContain('border-l-2')
    expect(list.querySelectorAll('li > span[aria-hidden="true"].rounded-full')).toHaveLength(3)
  })

  it('keeps the reading column', () => {
    expect(draw({ layout: 'line', items: make(2) }).querySelector('.max-w-prose')).not.toBeNull()
  })
})

describe('items: list', () => {
  it('bullets run in two columns on a wide screen', () => {
    const list = listOf(draw({ layout: 'list', items: make(5, () => ({ body: null })) }))
    expect(list.tagName).toBe('UL')
    expect(list.className).toContain('sm:grid-cols-2')
    expect(list.querySelectorAll('span.rounded-full')).toHaveLength(5)
  })

  it('numbers make it an ordered list down the reading column', () => {
    const container = draw({ layout: 'list', markers: 'numbers', items: make(3) })
    const list = listOf(container)
    expect(list.tagName).toBe('OL')
    expect(list.closest('.max-w-prose')).not.toBeNull()
    expect(list.textContent).toContain('3.')
  })

  it('custom markers replace the bullet', () => {
    const list = listOf(
      draw({ layout: 'list', markers: 'custom', items: make(2, () => ({ marker: '✓' })) }),
    )
    expect(list.querySelectorAll('span.rounded-full')).toHaveLength(0)
    expect(list.textContent).toContain('✓')
  })

  it('a body is optional under each', () => {
    const container = draw({
      layout: 'list',
      items: [
        { title: 'With', body: 'A line under it' },
        { title: 'Without', body: null },
      ],
    })
    expect(container.textContent).toContain('A line under it')
    expect(container.querySelectorAll('li')).toHaveLength(2)
  })
})

describe('items: tags', () => {
  it('draws chips, linked where an address is set, and ignores markers', () => {
    const container = draw({
      layout: 'tags',
      markers: 'numbers',
      items: [
        { title: 'TypeScript', body: 'Not shown' },
        { title: 'Next.js', link: { url: '/services' } },
      ],
    })
    const chips = [...listOf(container).querySelectorAll(':scope > li > *')]
    expect(chips.map((c) => c.textContent)).toEqual(['TypeScript', 'Next.js'])
    expect(chips.every((c) => c.className.includes('rounded-full'))).toBe(true)
    expect(chips[1].tagName).toBe('A')
    expect(chips[1].getAttribute('href')).toBe('/services')
    expect(container.textContent).not.toContain('Not shown')
    expect(container.textContent).not.toContain('1')
  })
})

describe('items: colour follows the band', () => {
  it('light bands use accent-strong for meaning-bearing green', () => {
    const container = draw({ markers: 'numbers', items: make(2) })
    expect(container.innerHTML).toContain('text-accent-strong')
  })

  it('the heading and intro render above the items', () => {
    const container = draw({ heading: 'Heading', intro: 'Intro line', items: make(2) })
    expect(container.querySelector('h2')?.textContent).toBe('Heading')
    expect(container.textContent).toContain('Intro line')
  })
})
