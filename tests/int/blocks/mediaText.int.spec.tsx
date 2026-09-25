import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MediaText } from '../../../src/components/sections/MediaText'
import { registry } from '../../../src/components/sections/registry'
import { buildLexical } from '../../../src/payload/seed/showcase/lexical'

/**
 * `media-text` — a picture beside a column of prose. It replaces `two-column`,
 * and `brand-teaser`'s headline, paragraph and link are its rich text and
 * button (docs/planning/block-consolidation.md).
 */

const photo = { url: '/media/photo.jpg', alt: 'A workshop in progress' }
const body = buildLexical([
  { kind: 'h', tag: 'h2', text: 'Named for a problem-solver' },
  { kind: 'p', text: 'Two or three sentences about the story.' },
])

/** Element order inside the grid: 'media' for the picture, 'text' for the prose. */
const order = (container: HTMLElement): string[] => {
  const grid = container.querySelector('.lg\\:grid-cols-2')
  if (!grid) throw new Error('no two-column grid rendered')
  return Array.from(grid.children).map((el) =>
    el.tagName === 'PICTURE' || el.tagName === 'IMG' ? 'media' : 'text',
  )
}

describe('<MediaText />', () => {
  it('is registered under its slug', () => {
    expect(registry['media-text']).toBe(MediaText)
  })

  it('puts the image first on the left, and the text first on the right', () => {
    expect(
      order(render(<MediaText media={photo} mediaPosition="left" body={body} />).container),
    ).toEqual(['media', 'text'])
    expect(
      order(render(<MediaText media={photo} mediaPosition="right" body={body} />).container),
    ).toEqual(['text', 'media'])
  })

  it('carries a teaser: heading, paragraph and a button beside the image', () => {
    const { getByRole, getByText, container } = render(
      <MediaText media={photo} body={body} cta={{ label: 'Read our story', url: '/our-story' }} />,
    )
    expect(getByRole('heading', { level: 2 }).textContent).toBe('Named for a problem-solver')
    expect(getByText('Two or three sentences about the story.')).toBeTruthy()
    expect(getByRole('link', { name: 'Read our story' }).getAttribute('href')).toBe('/our-story')
    expect(container.querySelector('img')?.getAttribute('alt')).toBe(photo.alt)
  })

  it('draws no button when the button is half filled in', () => {
    const { queryByRole } = render(
      <MediaText media={photo} body={body} cta={{ label: 'Orphan', url: null }} />,
    )
    expect(queryByRole('link')).toBeNull()
  })

  it.each([
    ['none', ''],
    ['subtle', 'bg-surface-subtle'],
    ['accent', 'bg-surface-accent'],
    ['inverse', 'bg-surface-inverse'],
  ] as const)('takes the %s background from Section', (background, cls) => {
    const { container } = render(<MediaText media={photo} body={body} background={background} />)
    const section = container.querySelector('section')
    if (cls) expect(section?.className).toContain(cls)
    else expect(section?.className).not.toMatch(/bg-surface/)
  })

  it('inverts the prose on the dark band', () => {
    const dark = render(<MediaText media={photo} body={body} background="inverse" />)
    expect(dark.container.querySelector('.prose-invert')).not.toBeNull()
    const light = render(<MediaText media={photo} body={body} background="subtle" />)
    expect(light.container.querySelector('.prose-invert')).toBeNull()
  })

  it('centres the text on its own when the image relation did not populate', () => {
    const { container, getByRole } = render(<MediaText media={7} body={body} />)
    expect(container.querySelector('.lg\\:grid-cols-2')).toBeNull()
    expect(container.querySelector('.max-w-prose.mx-auto')).not.toBeNull()
    expect(getByRole('heading', { level: 2 })).toBeTruthy()
  })
})
