import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FeaturedTestimonials } from '../../../src/components/sections/FeaturedTestimonials'

// personTitle is optional on the Testimonials collection, and four of the real
// quotes (Jeremy Larson x2, Jim Hewston x2 — all Cross Precision Measurement)
// have a company but no title. Interpolating the title unconditionally rendered
// a stray leading comma: ", Cross Precision Measurement".
const doc = (fields: Record<string, unknown>) => ({
  id: 1,
  quote: 'They shipped it.',
  personName: 'Jeremy Larson',
  ...fields,
})

describe('FeaturedTestimonials — attribution line', () => {
  it('joins title and company when both are present', () => {
    const { getByText } = render(
      <FeaturedTestimonials testimonials={[doc({ personTitle: 'CEO', company: 'Acme' })]} />,
    )
    expect(getByText('CEO, Acme')).toBeTruthy()
  })

  it('renders the company alone, with no leading comma, when there is no title', () => {
    const { getByText, container } = render(
      <FeaturedTestimonials testimonials={[doc({ company: 'Cross Precision Measurement' })]} />,
    )
    expect(getByText('Cross Precision Measurement')).toBeTruthy()
    expect(container.textContent).not.toContain(', Cross Precision Measurement')
  })

  it('renders the title alone when there is no company', () => {
    const { getByText } = render(
      <FeaturedTestimonials testimonials={[doc({ personTitle: 'CEO' })]} />,
    )
    expect(getByText('CEO')).toBeTruthy()
  })

  it('omits the attribution line entirely when there is neither', () => {
    const { getByText, container } = render(<FeaturedTestimonials testimonials={[doc({})]} />)
    expect(getByText('Jeremy Larson')).toBeTruthy()
    expect(container.querySelectorAll('p.text-caption')).toHaveLength(0)
  })
})
