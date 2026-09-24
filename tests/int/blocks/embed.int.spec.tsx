import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Embed } from '../../../src/components/sections/Embed'
import { Embed as EmbedBlock } from '../../../src/payload/blocks/layout/Embed'
import { selectOptions } from '../helpers/synthesizeBlock'

/**
 * `embed` — a video, a map or another web page, framed on the page. It merges
 * `video-embed`, `map` and the old iframe-only `embed`
 * (docs/planning/block-consolidation.md).
 */

const OSM =
  'https://www.openstreetmap.org/export/embed.html?bbox=-95.999%2C36.149%2C-95.985%2C36.156'
const poster = { url: '/media/poster.jpg', alt: 'A still from the recap' }

const field = (name: string) => {
  const found = EmbedBlock.fields.find((f) => 'name' in f && f.name === name)
  if (!found) throw new Error(`embed has no ${name} field`)
  return found
}

describe('embed config', () => {
  it('offers video, map and page', () => {
    expect(selectOptions(field('kind'))).toEqual(['video', 'map', 'page'])
  })

  it('sizes the frame by name, not by a number of pixels', () => {
    const height = field('height')
    expect(height.type).toBe('select')
    expect(selectOptions(height)).toEqual(['short', 'medium', 'tall'])
  })

  it('needs a video ID for a video and an address for a map or page, and only there', () => {
    const videoId = field('videoId') as unknown as {
      validate: (v: unknown, a: { siblingData: unknown }) => true | string
    }
    const url = field('url') as unknown as typeof videoId
    expect(videoId.validate('', { siblingData: { kind: 'video' } })).not.toBe(true)
    expect(videoId.validate('', { siblingData: { kind: 'map' } })).toBe(true)
    expect(url.validate('', { siblingData: { kind: 'map' } })).not.toBe(true)
    expect(url.validate('', { siblingData: { kind: 'page' } })).not.toBe(true)
    expect(url.validate('', { siblingData: { kind: 'video' } })).toBe(true)
  })

  it('still refuses a video ID carrying a query string, and a non-https address', () => {
    const videoId = field('videoId') as unknown as {
      validate: (v: unknown, a: { siblingData: unknown }) => true | string
    }
    const url = field('url') as unknown as typeof videoId
    expect(videoId.validate('abc?autoplay=1', { siblingData: { kind: 'video' } })).not.toBe(true)
    expect(videoId.validate('dQw4w9WgXcQ', { siblingData: { kind: 'video' } })).toBe(true)
    expect(url.validate('http://example.com', { siblingData: { kind: 'page' } })).not.toBe(true)
  })
})

describe('<Embed kind="video" />', () => {
  it('embeds the player directly when there is no poster', () => {
    const { container } = render(
      <Embed kind="video" provider="youtube" videoId="dQw4w9WgXcQ" title="Workshop recap" />,
    )
    const iframe = container.querySelector('iframe')
    expect(iframe?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(iframe?.getAttribute('title')).toBe('Workshop recap')
  })

  it('reads the ID for the chosen host', () => {
    const { container } = render(
      <Embed kind="video" provider="vimeo" videoId="76979871" title="Recap" />,
    )
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://player.vimeo.com/video/76979871',
    )
  })

  it('with a poster, loads nothing from the host until the reader presses Play', () => {
    const { container, getByRole } = render(
      <Embed
        kind="video"
        provider="youtube"
        videoId="dQw4w9WgXcQ"
        title="Workshop recap"
        thumbnail={poster}
      />,
    )
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.querySelector('img')?.getAttribute('alt')).toBe(poster.alt)
    fireEvent.click(getByRole('button', { name: 'Play video: Workshop recap' }))
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
    )
  })

  it('draws the eyebrow for a video, and never for a map or page', () => {
    const video = render(
      <Embed kind="video" videoId="dQw4w9WgXcQ" title="T" eyebrow="From the podcast" />,
    )
    expect(video.getByText('From the podcast').className).toContain('text-accent-strong')
    video.unmount()
    const map = render(<Embed kind="map" url={OSM} title="T" eyebrow="From the podcast" />)
    expect(map.queryByText('From the podcast')).toBeNull()
  })

  it('renders nothing when it has no video ID to play', () => {
    expect(render(<Embed kind="video" title="T" />).container.firstChild).toBeNull()
  })
})

describe('<Embed kind="map" />', () => {
  it('frames an OpenStreetMap or Google Maps embed, titled for screen readers', () => {
    const { container, getByText } = render(
      <Embed kind="map" url={OSM} title="Map of the office" caption="123 Example Street" />,
    )
    const iframe = container.querySelector('iframe')
    expect(iframe?.getAttribute('src')).toBe(OSM)
    expect(iframe?.getAttribute('title')).toBe('Map of the office')
    expect(getByText('123 Example Street').tagName).toBe('FIGCAPTION')
  })

  it('accepts only Google’s embed endpoint, not any Google page', () => {
    const ok = render(<Embed kind="map" url="https://www.google.com/maps/embed?pb=abc" title="T" />)
    expect(ok.container.querySelector('iframe')).not.toBeNull()
    const refused = render(<Embed kind="map" url="https://www.google.com/search?q=x" title="T" />)
    expect(refused.container.querySelector('iframe')).toBeNull()
    expect(refused.container.textContent).toContain('not on the allow-list')
  })
})

describe('<Embed kind="page" />', () => {
  it('frames any https page in a sandbox without same-origin access', () => {
    const { container } = render(<Embed kind="page" url="https://example.com/form" title="Form" />)
    const sandbox = container.querySelector('iframe')?.getAttribute('sandbox') ?? ''
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).not.toContain('allow-same-origin')
  })

  it('refuses a page that is not https', () => {
    const { container } = render(<Embed kind="page" url="http://example.com" title="Form" />)
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.textContent).toContain('must be https://')
  })

  it.each([
    ['short', 'h-80'],
    ['medium', 'h-[30rem]'],
    ['tall', 'h-[45rem]'],
  ] as const)('a %s frame is %s tall', (height, cls) => {
    const { container } = render(
      <Embed kind="page" url="https://example.com" title="T" height={height} />,
    )
    expect(container.querySelector('figure > div')?.classList.contains(cls)).toBe(true)
  })
})

describe('<Embed /> heading and background', () => {
  it('draws the heading above any kind', () => {
    for (const props of [
      { kind: 'video' as const, videoId: 'dQw4w9WgXcQ' },
      { kind: 'map' as const, url: OSM },
      { kind: 'page' as const, url: 'https://example.com' },
    ]) {
      const { getByRole, unmount } = render(<Embed {...props} title="T" heading="Watch this" />)
      expect(getByRole('heading', { level: 2 }).textContent).toBe('Watch this')
      unmount()
    }
  })

  it.each([
    ['subtle', 'bg-surface-subtle'],
    ['accent', 'bg-surface-accent'],
    ['inverse', 'bg-surface-inverse'],
  ] as const)('takes the %s background from Section', (background, cls) => {
    const { container } = render(
      <Embed kind="page" url="https://example.com" title="T" background={background} />,
    )
    expect(container.querySelector('section')?.className).toContain(cls)
  })

  it('switches the eyebrow and caption to light-on-dark on the dark band', () => {
    const video = render(
      <Embed kind="video" videoId="dQw4w9WgXcQ" title="T" eyebrow="Eyebrow" background="inverse" />,
    )
    expect(video.getByText('Eyebrow').className).toContain('text-brand-green-300')
    const page = render(
      <Embed
        kind="page"
        url="https://example.com"
        title="T"
        caption="Caption"
        background="inverse"
      />,
    )
    expect(page.getByText('Caption').className).toContain('text-neutral-200')
  })
})
