import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Hero } from '../../../src/components/sections/Hero'
import { Hero as HeroBlock } from '../../../src/payload/blocks/layout/Hero'
import { selectOptions } from '../helpers/synthesizeBlock'

/**
 * The one page opener (docs/planning/block-consolidation.md). `cover` is the
 * old homepage hero; `with-image` folded into `split`.
 */

const photo = { url: '/media/photo.jpg', alt: 'A team at a whiteboard' }

const optionsOf = (name: string): string[] => {
  const field = HeroBlock.fields.find((f) => 'name' in f && f.name === name)
  if (!field) throw new Error(`hero has no ${name} field`)
  return selectOptions(field)
}

describe('hero variants', () => {
  it('offers exactly text-only, split, cover and with-video', () => {
    expect(optionsOf('variant')).toEqual(['text-only', 'split', 'cover', 'with-video'])
  })

  it('text-only draws the words and no media', () => {
    const { container, getByRole } = render(
      <Hero variant="text-only" headline="Plain words" media={photo} />,
    )
    expect(getByRole('heading', { level: 1 }).textContent).toBe('Plain words')
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('split sets the image beside the copy in a two-column grid', () => {
    const { container } = render(<Hero variant="split" headline="Beside" media={photo} />)
    const grid = container.querySelector('.lg\\:grid-cols-2')
    expect(grid).not.toBeNull()
    const img = grid?.querySelector('img')
    expect(img?.getAttribute('alt')).toBe(photo.alt)
  })

  it('split with no populated image falls back to the words alone', () => {
    const { container } = render(<Hero variant="split" headline="No picture" media={42} />)
    expect(container.querySelector('.lg\\:grid-cols-2')).toBeNull()
    expect(container.querySelector('h1')?.textContent).toBe('No picture')
  })

  it('with-video embeds an allowed player and drops any other host', () => {
    const ok = render(
      <Hero
        variant="with-video"
        headline="Watch"
        videoUrl="https://www.youtube-nocookie.com/embed/abc123"
      />,
    )
    expect(ok.container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123',
    )
    const refused = render(
      <Hero variant="with-video" headline="Watch" videoUrl="https://evil.example.com/x" />,
    )
    expect(refused.container.querySelector('iframe')).toBeNull()
  })
})

describe('hero cover', () => {
  const cover = (props: Partial<Parameters<typeof Hero>[0]> = {}) =>
    render(
      <Hero
        variant="cover"
        eyebrow="Campaign"
        headline="Words over a photo"
        subheadline="Readable on any picture."
        media={photo}
        primaryCta={{ label: 'Book a call', url: '/contact', variant: 'primary' }}
        secondaryCta={{ label: 'See the work', url: '/work' }}
        {...props}
      />,
    )

  it('lays the photo full-bleed behind the rail, with its alt text from the Media doc', () => {
    const { container } = cover()
    const section = container.querySelector('section')
    const img = container.querySelector('img')
    expect(img?.getAttribute('alt')).toBe(photo.alt)
    expect(img?.className).toContain('absolute inset-0')
    // The bleed sits outside the rail div, so it is not capped by the shell.
    const rail = section?.querySelector(':scope > div.mx-auto')
    expect(rail?.contains(img as Node)).toBe(false)
  })

  it('puts a navy scrim between the photo and the words, hidden from assistive tech', () => {
    const { container } = cover()
    const scrim = container.querySelector('.bg-brand-navy-900\\/80')
    expect(scrim).not.toBeNull()
    expect(scrim?.getAttribute('aria-hidden')).toBe('true')
  })

  it('sets every line of copy light (AAA on the scrim), never the green-700 accent', () => {
    const { container, getByText } = cover()
    const section = container.querySelector('section')
    expect(section?.className).toContain('text-text-inverse')
    expect(getByText('Readable on any picture.').className).toContain('text-white')
    expect(getByText('Campaign').className).toContain('text-brand-green-200')
    expect(container.innerHTML).not.toContain('text-text-secondary')
    expect(container.innerHTML).not.toContain('text-accent-strong')
  })

  it('turns the outlined and text-only button styles white', () => {
    for (const variant of ['secondary', 'ghost']) {
      const { getByRole, unmount } = cover({
        primaryCta: { label: 'Go', url: '/go', variant },
      })
      expect(getByRole('link', { name: 'Go' }).className).toContain('text-white')
      unmount()
    }
  })

  it('still renders its words on the dark surface when the photo is missing', () => {
    const { container, getByRole } = cover({ media: null })
    expect(container.querySelector('img')).toBeNull()
    expect(getByRole('heading', { level: 1 }).textContent).toBe('Words over a photo')
  })

  it('centres the copy and the buttons when alignment is center', () => {
    const { container } = cover({ alignment: 'center' })
    expect(container.querySelector('.text-center')).not.toBeNull()
    expect(container.querySelector('.justify-center')).not.toBeNull()
  })
})

describe('hero config', () => {
  it('needs an image for split and cover, and only there', () => {
    const media = HeroBlock.fields.find((f) => 'name' in f && f.name === 'media') as {
      validate: (v: unknown, a: { siblingData: unknown }) => true | string
    }
    for (const variant of ['split', 'cover']) {
      expect(media.validate(null, { siblingData: { variant } })).not.toBe(true)
    }
    for (const variant of ['text-only', 'with-video']) {
      expect(media.validate(null, { siblingData: { variant } })).toBe(true)
    }
  })
})
