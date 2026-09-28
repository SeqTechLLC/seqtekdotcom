/* eslint-disable jsx-a11y/alt-text -- `Image` here is our Payload block render
   component, not the HTML <img> element the rule assumes. */
import { render } from '@testing-library/react'
import type { Block } from 'payload'
import { describe, expect, it } from 'vitest'

import { Content } from '../../../src/components/sections/Content'
import { HubspotForm } from '../../../src/components/sections/HubspotForm'
import { Image } from '../../../src/components/sections/Image'
import { layoutBlocks } from '../../../src/payload/blocks/layout'
import { buildLexical } from '../../../src/payload/seed/showcase/lexical'
import { selectOptions } from '../helpers/synthesizeBlock'

/**
 * Every block but `hero` takes the shared `background` (none, subtle, accent,
 * inverse), mapped to `Section` (docs/planning/block-consolidation.md). These
 * are the blocks that gained or changed it in the media lane.
 */

const LANE_BLOCKS = ['content', 'media-text', 'image', 'gallery', 'embed', 'hubspot-form']

describe('the shared background field', () => {
  it.each(LANE_BLOCKS)('%s offers none, subtle, accent and inverse', (slug) => {
    const block = layoutBlocks.find((b) => b.slug === slug) as Block | undefined
    const field = block?.fields.find((f) => 'name' in f && f.name === 'background')
    expect(field, `${slug} has no background field`).toBeDefined()
    expect(field && selectOptions(field)).toEqual(['none', 'subtle', 'accent', 'inverse'])
  })

  it('hero takes none', () => {
    const hero = layoutBlocks.find((b) => b.slug === 'hero') as Block
    expect(hero.fields.some((f) => 'name' in f && f.name === 'background')).toBe(false)
  })
})

const body = buildLexical([{ kind: 'p', text: 'A paragraph of prose.' }])
const photo = { url: '/media/photo.jpg', alt: 'A photo' }
const FORM_ID = '11111111-aaaa-bbbb-cccc-dddddddddddd'

const BANDS = [
  ['subtle', 'bg-surface-subtle'],
  ['accent', 'bg-surface-accent'],
  ['inverse', 'bg-surface-inverse'],
] as const

describe('<Content /> background', () => {
  it.each(BANDS)('%s maps to Section', (background, cls) => {
    const { container } = render(<Content body={body} background={background} />)
    expect(container.querySelector('section')?.className).toContain(cls)
  })

  it('inverts the prose only on the dark band', () => {
    expect(
      render(<Content body={body} background="inverse" />).container.querySelector('.prose-invert'),
    ).not.toBeNull()
    expect(
      render(<Content body={body} background="accent" />).container.querySelector('.prose-invert'),
    ).toBeNull()
  })
})

describe('<Image /> background', () => {
  it.each(BANDS)('%s maps to Section', (background, cls) => {
    const { container } = render(<Image image={photo} background={background} />)
    expect(container.querySelector('section')?.className).toContain(cls)
  })

  it('lightens the caption on the dark band', () => {
    const { getByText } = render(<Image image={photo} caption="Caption" background="inverse" />)
    expect(getByText('Caption').className).toContain('text-neutral-200')
  })
})

describe('<HubspotForm /> background', () => {
  it.each(BANDS)('%s maps to Section', (background, cls) => {
    const { container } = render(<HubspotForm formId={FORM_ID} background={background} />)
    expect(container.querySelector('section')?.className).toContain(cls)
  })

  it('sets the form on a light panel on the dark band, and only there', () => {
    const dark = render(<HubspotForm formId={FORM_ID} background="inverse" />)
    const panel = dark.container.querySelector('.bg-surface-elevated')
    expect(panel?.querySelector('form')).not.toBeNull()
    const light = render(<HubspotForm formId={FORM_ID} background="subtle" />)
    expect(light.container.querySelector('.bg-surface-elevated')).toBeNull()
  })
})
