/* eslint-disable jsx-a11y/alt-text -- `Image`/`Gallery` here are our Payload
   block render components, not the HTML <img> element the rule assumes. */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Image } from '../../../src/components/sections/Image'
import { Gallery } from '../../../src/components/sections/Gallery'
import { RenderBlocks } from '../../../src/components/sections/RenderBlocks'
import { registry } from '../../../src/components/sections/registry'

// spec 010 / FR-005 — the two gap-fill blocks. Pins render coverage for
// `image` + `gallery` through the shared RenderBlocks dispatcher and the
// null/empty resilience the retired workshop template had (depth-0 / missing
// upload rows are dropped, never thrown).

const media = (url: string, alt = 'A photo') => ({ url, alt })

describe('<Image /> block', () => {
  it('renders a figure with the image and caption', () => {
    const { container, getByText } = render(
      <Image image={media('/img/a.jpg')} caption="A caption" width="standard" alignment="center" />,
    )
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/img/a.jpg')
    expect(getByText('A caption')).toBeTruthy()
  })

  it('renders nothing when the image relation is unpopulated (id or null)', () => {
    const { container: a } = render(<Image image={42} caption="x" />)
    expect(a.firstChild).toBeNull()
    const { container: b } = render(<Image image={null} />)
    expect(b.firstChild).toBeNull()
  })
})

describe('<Gallery /> block', () => {
  it('renders a grid of figures with captions', () => {
    const { container, getByText } = render(
      <Gallery
        heading="Proof"
        layout="grid"
        columns="3"
        items={[
          { image: media('/g/1.jpg'), caption: 'One' },
          { image: media('/g/2.jpg'), caption: 'Two' },
        ]}
      />,
    )
    expect(container.querySelectorAll('img')).toHaveLength(2)
    expect(getByText('Proof')).toBeTruthy()
    expect(getByText('One')).toBeTruthy()
  })

  it('renders a carousel layout', () => {
    const { container } = render(
      <Gallery layout="carousel" items={[{ image: media('/g/1.jpg') }]} />,
    )
    expect(container.querySelector('img')).toBeTruthy()
  })

  it('drops unpopulated rows and renders nothing when none remain', () => {
    const { container } = render(
      <Gallery items={[{ image: 7 }, { image: null }, { image: undefined }]} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for empty / null items', () => {
    expect(render(<Gallery items={[]} />).container.firstChild).toBeNull()
    expect(render(<Gallery items={null} />).container.firstChild).toBeNull()
  })
})

describe('image + gallery are dispatchable via RenderBlocks', () => {
  it('the registry resolves both new slugs', () => {
    expect(registry.image).toBeDefined()
    expect(registry.gallery).toBeDefined()
  })

  it('RenderBlocks renders an image + gallery layout end-to-end', () => {
    const { container } = render(
      <RenderBlocks
        blocks={[
          {
            blockType: 'image',
            image: media('/img/a.jpg'),
            width: 'standard',
            alignment: 'center',
          },
          {
            blockType: 'gallery',
            layout: 'grid',
            columns: '2',
            items: [{ image: media('/g/1.jpg') }],
          },
        ]}
      />,
    )
    expect(container.querySelectorAll('img')).toHaveLength(2)
  })
})
