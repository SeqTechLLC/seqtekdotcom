import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  columnsFor,
  Gallery,
  gridColumnsFor,
  logoScale,
} from '../../../src/components/sections/Gallery'
import { Gallery as GalleryBlock } from '../../../src/payload/blocks/layout/Gallery'
import { selectOptions } from '../helpers/synthesizeBlock'

/**
 * `gallery` — pictures, or a strip of logos. Photo columns follow the item
 * count, logos wrap, and there is no column control (docs/BLOCK_LIBRARY.md).
 */

const pic = (n: number, caption?: string) => ({
  image: { url: `/media/${n}.jpg`, alt: `Picture ${n}` },
  caption: caption ?? null,
})
const pics = (count: number) => Array.from({ length: count }, (_, i) => pic(i))

describe('gallery config', () => {
  it('has no column control', () => {
    const names = GalleryBlock.fields.map((f) => ('name' in f ? f.name : null))
    expect(names).not.toContain('columns')
    expect(names).toEqual(
      expect.arrayContaining(['heading', 'intro', 'items', 'layout', 'background']),
    )
  })

  it('offers grid, carousel and logos', () => {
    const layout = GalleryBlock.fields.find((f) => 'name' in f && f.name === 'layout')
    expect(layout && selectOptions(layout)).toEqual(['grid', 'carousel', 'logos'])
  })
})

describe('columns follow the count', () => {
  it('seats up to `fit` in one row, then picks the choice that fills the last row', () => {
    expect([1, 2, 3].map((n) => gridColumnsFor(n))).toEqual(['1', '2', '3'])
    // 4 fills a row of four; 5 and 6 fill rows of three; 7 and 8 rows of four.
    expect([4, 5, 6, 7, 8, 9].map((n) => gridColumnsFor(n))).toEqual(['4', '3', '3', '4', '4', '3'])
  })

  it('has no ceiling: any count gets an answer from the choices', () => {
    for (const count of [13, 50, 101]) {
      expect([3, 4]).toContain(columnsFor(count, 3, [3, 4]))
    }
  })

  it('draws the column classes the count picked', () => {
    const four = render(<Gallery items={pics(4)} />).container
    expect(four.querySelector('.lg\\:grid-cols-4')).not.toBeNull()
    const five = render(<Gallery items={pics(5)} />).container
    expect(five.querySelector('.lg\\:grid-cols-3')).not.toBeNull()
    const one = render(<Gallery items={pics(1)} />).container
    expect(one.querySelector('.max-w-3xl.mx-auto')).not.toBeNull()
  })
})

describe('<Gallery /> layouts', () => {
  it('grid: every picture as a figure, with its caption and Media alt text', () => {
    const { container, getByText } = render(
      <Gallery layout="grid" items={[pic(1, 'First'), pic(2)]} />,
    )
    expect(container.querySelectorAll('figure')).toHaveLength(2)
    expect(getByText('First').tagName).toBe('FIGCAPTION')
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Picture 1')
  })

  it('carousel: one scrolling row that keyboard users can reach', () => {
    const { getByRole } = render(
      <Gallery layout="carousel" heading="Engagement photos" items={pics(3)} />,
    )
    const row = getByRole('region', { name: 'Engagement photos' })
    expect(row.getAttribute('tabindex')).toBe('0')
    expect(row.className).toContain('overflow-x-auto')
    expect(row.querySelectorAll('figure')).toHaveLength(3)
  })

  it('logos: a wrapping list of bare logos in colour, caption small underneath', () => {
    const { container, getByRole, getByText } = render(
      <Gallery layout="logos" heading="Clients" items={[pic(1, 'Example Co.'), pic(2)]} />,
    )
    const list = getByRole('list')
    expect(list.className).toContain('flex-wrap')
    expect(list.querySelectorAll('li')).toHaveLength(2)
    const img = container.querySelector('img')
    expect(img?.className).not.toContain('grayscale')
    expect(img?.className).toContain('hover:scale-110')
    expect(img?.className).not.toContain('bg-surface')
    expect(img?.getAttribute('alt')).toBe('Picture 1')
    expect(getByText('Example Co.').className).toContain('text-caption')
    expect(getByRole('heading', { level: 2 }).parentElement?.className).toContain('text-center')
    expect(container.querySelector('figure')).toBeNull()
  })

  it('logos: sized by area from the media dimensions, a fixed height without them', () => {
    expect(logoScale({ width: 400, height: 100 })).toBe(2)
    expect(logoScale({ width: 100, height: 100 })).toBe(1)
    expect(logoScale({ width: 2000, height: 100 })).toBe(2.5)
    expect(logoScale({ width: 100, height: 400 })).toBe(0.75)
    expect(logoScale({ url: '/l.svg' })).toBeNull()

    const { container } = render(
      <Gallery
        layout="logos"
        items={[
          { image: { url: '/wide.png', alt: 'Wide', width: 400, height: 100 }, caption: null },
          { image: { url: '/l.svg', alt: 'No size' }, caption: null },
        ]}
      />,
    )
    const [wide, unsized] = Array.from(container.querySelectorAll('img'))
    expect(wide.style.getPropertyValue('--logo')).toBe('2')
    expect(wide.className).toContain('w-[calc(var(--logo)*3.5rem)]')
    expect(unsized.className).toContain('h-14')
  })

  it('logos: each sits on a light plate on the dark band', () => {
    const { container } = render(<Gallery layout="logos" background="inverse" items={pics(2)} />)
    expect(container.querySelector('img')?.className).toContain('bg-surface')
  })

  it('falls back to the caption for a logo with no alt text', () => {
    const { container } = render(
      <Gallery layout="logos" items={[{ image: { url: '/l.svg', alt: null }, caption: 'Acme' }]} />,
    )
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Acme')
  })
})

describe('<Gallery /> heading, intro and background', () => {
  it('draws the heading and intro above any layout', () => {
    for (const layout of ['grid', 'carousel', 'logos'] as const) {
      const { getByRole, getByText, unmount } = render(
        <Gallery layout={layout} heading="Proof" intro="What it looked like." items={pics(2)} />,
      )
      expect(getByRole('heading', { level: 2 }).textContent).toBe('Proof')
      expect(getByText('What it looked like.')).toBeTruthy()
      unmount()
    }
  })

  it.each([
    ['subtle', 'bg-surface-subtle'],
    ['accent', 'bg-surface-accent'],
    ['inverse', 'bg-surface-inverse'],
  ] as const)('takes the %s background from Section', (background, cls) => {
    const { container } = render(<Gallery background={background} items={pics(2)} />)
    expect(container.querySelector('section')?.className).toContain(cls)
  })

  it('lightens its secondary text on the dark band', () => {
    const { getByText } = render(
      <Gallery background="inverse" intro="Intro line." items={[pic(1, 'Caption line')]} />,
    )
    expect(getByText('Intro line.').className).toContain('text-neutral-200')
    expect(getByText('Caption line').className).toContain('text-neutral-200')
  })

  it('still names a carousel that has no heading', () => {
    const { getByRole } = render(<Gallery layout="carousel" items={pics(3)} />)
    expect(getByRole('region', { name: 'Photo gallery' }).tabIndex).toBe(0)
  })
})
