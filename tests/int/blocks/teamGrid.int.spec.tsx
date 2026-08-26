import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TeamGrid } from '../../../src/components/sections/TeamGrid'

// ROADMAP UI-1 — `teamMembers` carries two overlapping text fields: `title`
// (the job title) and `role` (a full descriptive sentence). The cards render
// `title`; `role` belongs to the `/team/[slug]` detail header, which renders
// both. This file pins that split so the grid can't drift back to `role`.

const photo = { url: '/media/headshot.jpg', alt: 'Headshot' }

const dana = {
  id: 1,
  name: 'Dana Dudley',
  slug: 'dana-dudley',
  title: 'CTO',
  role: 'Owns SEQTEK’s technology and software development, and as a senior partner helps steer the firm.',
  photo,
}

describe('<TeamGrid /> card subtitle (UI-1)', () => {
  it('renders the job title, not the descriptive sentence', () => {
    const { getByText, queryByText } = render(<TeamGrid filter="all" manualItems={[dana]} />)
    expect(getByText('Dana Dudley')).toBeTruthy()
    expect(getByText('CTO')).toBeTruthy()
    expect(queryByText(dana.role)).toBeNull()
  })

  it('renders the job title in the compact layout too', () => {
    const { getByText, queryByText } = render(
      <TeamGrid filter="all" layout="compact" manualItems={[dana]} />,
    )
    expect(getByText('CTO')).toBeTruthy()
    expect(queryByText(dana.role)).toBeNull()
  })

  it('shows the name alone when there is no job title — never falls back to `role`', () => {
    const { getByText, queryByText, container } = render(
      <TeamGrid filter="all" manualItems={[{ ...dana, title: null }]} />,
    )
    expect(getByText('Dana Dudley')).toBeTruthy()
    expect(queryByText(dana.role)).toBeNull()
    expect(container.querySelectorAll('li p')).toHaveLength(0)
  })

  it('links each card to the member detail route', () => {
    const { container } = render(<TeamGrid filter="all" manualItems={[dana]} />)
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/team/dana-dudley')
  })

  it('drops unpopulated relationship rows (depth-0 ids)', () => {
    const { container } = render(<TeamGrid filter="all" manualItems={[42, 'abc', dana]} />)
    expect(container.querySelectorAll('li')).toHaveLength(1)
  })
})
