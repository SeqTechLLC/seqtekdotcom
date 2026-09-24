import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Quote } from '../../../src/components/sections/Quote'

/**
 * The `quote` block replaces testimonial-block and featured-testimonials. One
 * quote draws large in the chosen layout; two or more draw as a grid.
 */

const doc = (id: number, fields: Record<string, unknown> = {}) => ({
  id,
  quote: `Quote ${id}.`,
  personName: `Person ${id}`,
  ...fields,
})
const PHOTO = { url: '/media/face.jpg', alt: 'A face' }

describe('<Quote /> picks its shape from the count', () => {
  it('draws one testimonial large', () => {
    const { container } = render(<Quote testimonials={[doc(1)]} />)
    expect(container.querySelector('blockquote')?.className).toMatch(/text-h3/)
    expect(container.querySelector('ul')).toBeNull()
  })

  it('draws several as a grid, in the order picked, whatever the layout says', () => {
    const { container } = render(
      <Quote testimonials={[doc(2), doc(1), doc(3)]} layout="with-photo-left" />,
    )
    const cards = container.querySelectorAll('ul > li')
    expect(cards).toHaveLength(3)
    expect([...cards].map((c) => c.querySelector('blockquote')?.textContent)).toEqual([
      '“Quote 2.”',
      '“Quote 1.”',
      '“Quote 3.”',
    ])
  })

  it('handles any number of testimonials', () => {
    const many = Array.from({ length: 11 }, (_, i) => doc(i + 1))
    const { container } = render(<Quote testimonials={many} />)
    expect(container.querySelectorAll('ul > li')).toHaveLength(11)
  })

  it('drops an unpopulated relation rather than drawing an empty card', () => {
    const { container } = render(<Quote testimonials={[doc(1), 42, 'abc']} />)
    // One real doc left, so it draws large rather than as a grid of one.
    expect(container.querySelector('ul')).toBeNull()
    expect(container.textContent).toContain('Quote 1.')
  })

  it('renders nothing with no testimonials', () => {
    expect(render(<Quote testimonials={[]} />).container.innerHTML).toBe('')
  })
})

describe('<Quote /> layouts for a single quote (from testimonial-block)', () => {
  it('centres the quote under the photo', () => {
    const { container } = render(<Quote testimonials={[doc(1, { photo: PHOTO })]} />)
    expect(container.querySelector('section > div')?.className).toMatch(/items-center text-center/)
    expect(container.querySelector('img')?.getAttribute('src')).toBe(PHOTO.url)
  })

  it('puts the photo on the side the layout names', () => {
    const row = (layout: 'with-photo-left' | 'with-photo-right') =>
      render(<Quote testimonials={[doc(1, { photo: PHOTO })]} layout={layout} />)
        .container.querySelector('img')
        ?.parentElement?.getAttribute('class')
    expect(row('with-photo-left')).toMatch(/flex-row(?!-reverse)/)
    expect(row('with-photo-right')).toMatch(/flex-row-reverse/)
  })

  it('omits the photo when the person has none on file', () => {
    const { container } = render(<Quote testimonials={[doc(1)]} layout="with-photo-left" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('blockquote')).toBeTruthy()
  })
})

describe('<Quote /> attribution line never starts with stray punctuation', () => {
  it('reads "Name, Title · Company" for a single quote', () => {
    const { getByText } = render(
      <Quote testimonials={[doc(1, { personTitle: 'CEO', company: 'Acme' })]} />,
    )
    expect(getByText('Person 1, CEO · Acme')).toBeTruthy()
  })

  it('drops the title cleanly when there is none', () => {
    const { container } = render(<Quote testimonials={[doc(1, { company: 'Acme' })]} />)
    expect(container.textContent).toContain('Person 1 · Acme')
    expect(container.textContent).not.toContain(', ·')
  })

  // From featuredTestimonials.int.spec.tsx: four real quotes have a company
  // but no title, and interpolating the title unconditionally rendered
  // ", Cross Precision Measurement".
  it('joins title and company in a grid card when both are present', () => {
    const { getByText } = render(
      <Quote testimonials={[doc(1, { personTitle: 'CEO', company: 'Acme' }), doc(2)]} />,
    )
    expect(getByText('CEO, Acme')).toBeTruthy()
  })

  it('renders the company alone in a grid card, with no leading comma', () => {
    const { getByText, container } = render(
      <Quote testimonials={[doc(1, { company: 'Cross Precision Measurement' }), doc(2)]} />,
    )
    expect(getByText('Cross Precision Measurement')).toBeTruthy()
    expect(container.textContent).not.toContain(', Cross Precision Measurement')
  })

  it('omits the credit line entirely when there is neither', () => {
    const { container } = render(<Quote testimonials={[doc(1), doc(2)]} />)
    expect(container.querySelectorAll('p.text-caption')).toHaveLength(0)
  })
})

describe('<Quote source="custom" /> — a pull quote with no testimonial record', () => {
  const typed = {
    source: 'custom' as const,
    quote: 'Put the people who do the work in the room.',
    attribution: 'A founder',
    role: 'Keynote',
  }

  it('draws the typed quote with its attribution', () => {
    const { container, getByText } = render(<Quote {...typed} />)
    expect(container.querySelector('blockquote')?.textContent).toBe(
      '“Put the people who do the work in the room.”',
    )
    expect(getByText('A founder, Keynote')).toBeTruthy()
  })

  it('publishes only the side `source` names when both are filled in', () => {
    const custom = render(<Quote {...typed} testimonials={[doc(1), doc(2)]} />).container
    expect(custom.textContent).not.toContain('Quote 1.')
    expect(custom.querySelector('ul')).toBeNull()

    const panel = render(
      <Quote {...typed} source="testimonials" testimonials={[doc(1)]} />,
    ).container
    expect(panel.textContent).toContain('Quote 1.')
    expect(panel.textContent).not.toContain('Put the people')
  })

  it('allows an unattributed pull quote', () => {
    const { container } = render(<Quote source="custom" quote="Just the words." />)
    expect(container.querySelector('blockquote')).toBeTruthy()
    expect(container.querySelector('blockquote + p')).toBeNull()
  })

  it('renders nothing when the typed quote is blank', () => {
    expect(render(<Quote source="custom" quote="   " />).container.innerHTML).toBe('')
  })
})

describe('<Quote /> heading, intro and background', () => {
  it('draws the heading and intro above either shape', () => {
    for (const testimonials of [[doc(1)], [doc(1), doc(2)]]) {
      const { container, unmount } = render(
        <Quote heading="Clients" intro="In their words." testimonials={testimonials} />,
      )
      expect(container.querySelector('h2')?.textContent).toBe('Clients')
      expect(container.textContent).toContain('In their words.')
      unmount()
    }
  })

  it('defaults to the subtle band a large quote has always sat on', () => {
    const { container } = render(<Quote testimonials={[doc(1)]} />)
    expect(container.querySelector('section')?.className).toMatch(/bg-surface-subtle/)
  })

  it('keeps grid cards legible on the dark band', () => {
    const { container } = render(<Quote background="inverse" testimonials={[doc(1), doc(2)]} />)
    expect(container.querySelector('section')?.className).toMatch(/bg-surface-inverse/)
    expect(container.querySelector('li')?.className).toMatch(/text-text-primary/)
  })
})
