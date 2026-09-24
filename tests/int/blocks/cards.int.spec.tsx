import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Cards, type CardsProps } from '../../../src/components/sections/Cards'

/**
 * The `cards` block draws whatever list `resolveLayout` hands it, as the card
 * its collection has always been drawn as. The resolver's selection and
 * ordering are pinned in `tests/int/lib/resolveLayout.int.spec.ts`; this file
 * pins what reaches the page.
 */

const draw = (props: CardsProps) => render(<Cards {...props} />).container

const hrefs = (el: HTMLElement) => [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'))

const photo = { url: '/media/photo.jpg', alt: 'A photo' }

describe('cards — each collection draws its own card and links to its own route', () => {
  it.each([
    [
      'caseStudies',
      { title: 'NovaMud', slug: 'novamud', heroImage: photo },
      '/case-studies/novamud',
    ],
    ['posts', { title: 'On delivery', slug: 'on-delivery' }, '/insights/on-delivery'],
    ['services', { title: 'Platform', slug: 'platform', tier: 'leaf' }, '/services/platform'],
    [
      'industries',
      { title: 'Energy', slug: 'energy', _status: 'published', layout: [{ blockType: 'hero' }] },
      '/industries/energy',
    ],
    ['workshops', { title: 'Touchstone', slug: 'touchstone' }, '/workshops/touchstone'],
    [
      'teamMembers',
      { name: 'Dana Dudley', slug: 'dana-dudley', title: 'CTO' },
      '/team/dana-dudley',
    ],
    ['partners', { name: 'Acme', slug: 'acme', logo: photo }, '/partners/acme'],
  ] as const)('%s', (collection, doc, href) => {
    const el = draw({ collection, manualItems: [{ id: 1, ...doc }] })
    expect(hrefs(el)).toEqual([href])
  })

  it('locations name the market and do not link (no per-market route exists)', () => {
    const el = draw({
      collection: 'locations',
      manualItems: [{ id: 1, city: 'Tulsa', slug: 'tulsa', address: { state: 'OK' } }],
    })
    expect(el.textContent).toContain('Tulsa')
    expect(el.textContent).toContain('OK')
    expect(el.querySelector('a')).toBeNull()
  })

  it('unwraps raw polymorphic picks for the chosen collection only', () => {
    const el = draw({
      collection: 'posts',
      manualItems: [
        { relationTo: 'posts', value: { id: 1, title: 'Kept', slug: 'kept' } },
        { relationTo: 'caseStudies', value: { id: 2, title: 'Stale', slug: 'stale' } },
      ],
    })
    expect(el.textContent).toContain('Kept')
    expect(el.textContent).not.toContain('Stale')
  })

  it('draws nothing for a collection it does not know', () => {
    const el = draw({ collection: 'pages' as never, manualItems: [{ id: 1, title: 'x' }] })
    expect(el.innerHTML).toBe('')
  })
})

describe('cards — section chrome', () => {
  const studies = [{ id: 1, title: 'One', slug: 'one' }]

  it('renders the heading and intro', () => {
    const el = draw({
      collection: 'caseStudies',
      heading: 'Selected work',
      intro: 'A sentence under it.',
      manualItems: studies,
    })
    expect(el.querySelector('h2')?.textContent).toBe('Selected work')
    expect(el.textContent).toContain('A sentence under it.')
  })

  it('puts cards at h3 under a heading, and at h2 with none, so order never skips', () => {
    const withHeading = draw({ collection: 'caseStudies', heading: 'Work', manualItems: studies })
    expect(withHeading.querySelector('li h3')?.textContent).toBe('One')
    const bare = draw({ collection: 'caseStudies', manualItems: studies })
    expect(bare.querySelector('li h2')?.textContent).toBe('One')
  })

  it('an explicit heading level wins', () => {
    const el = draw({
      collection: 'caseStudies',
      heading: 'Work',
      manualItems: studies,
      headingLevel: 'h2',
    })
    expect(el.querySelector('li h2')?.textContent).toBe('One')
  })

  it('takes its band from `background`, and inverts the intro on the dark one', () => {
    const el = draw({
      collection: 'caseStudies',
      intro: 'Intro',
      background: 'inverse',
      manualItems: studies,
    })
    expect(el.querySelector('section')?.className).toContain('bg-surface-inverse')
    expect(el.querySelector('p')?.className).toContain('text-text-inverse/80')
    // The cards are light panels on the dark band, so their text must not
    // inherit the inverse colour.
    expect(el.querySelector('li')?.className).toContain('text-text-primary')
  })
})

describe('cards — featured display', () => {
  const studies = [
    { id: 1, title: 'Lead', slug: 'lead', subtitle: 'The big one', heroImage: photo },
    { id: 2, title: 'Second', slug: 'second' },
    { id: 3, title: 'Third', slug: 'third' },
  ]

  it('draws the first item large with a button, and the rest as the grid', () => {
    const el = draw({ collection: 'caseStudies', display: 'featured', manualItems: studies })
    const button = el.querySelector('a[href="/case-studies/lead"]')
    expect(button?.textContent).toBe('Read the case study')
    expect(el.textContent).toContain('The big one')
    expect(el.querySelector('img')?.getAttribute('src')).toBe('/media/photo.jpg')
    const gridTitles = [...el.querySelectorAll('li')].map((li) => li.textContent)
    expect(gridTitles).toEqual(['Second', 'Third'])
  })

  it('differs from the grid display', () => {
    const grid = draw({ collection: 'caseStudies', display: 'grid', manualItems: studies })
    expect(grid.querySelectorAll('li')).toHaveLength(3)
  })

  it('with one item draws the featured item and no empty grid', () => {
    const el = draw({ collection: 'caseStudies', display: 'featured', manualItems: [studies[0]] })
    expect(el.querySelector('ul')).toBeNull()
    expect(el.textContent).toContain('Lead')
  })

  it('a kind with no picture is featured on a panel, and a market has no button', () => {
    const el = draw({
      collection: 'locations',
      display: 'featured',
      manualItems: [{ id: 1, city: 'Tulsa', address: { state: 'OK' } }],
    })
    expect(el.textContent).toContain('Tulsa')
    expect(el.querySelector('a')).toBeNull()
    expect(el.querySelector('img')).toBeNull()
  })

  it('keeps workshop numbering running past the featured one', () => {
    const el = draw({
      collection: 'workshops',
      display: 'featured',
      manualItems: [
        { id: 1, title: 'First', slug: 'first' },
        { id: 2, title: 'Second', slug: 'second' },
        { id: 3, title: 'Third', slug: 'third' },
      ],
    })
    const numbers = [...el.querySelectorAll('ol li')].map(
      (li) => li.querySelector('p')?.textContent,
    )
    expect(numbers).toEqual(['2', '3'])
  })
})

// ROADMAP UI-1 — cards show `title` (the job title), never `role` (a sentence).
describe('cards — team members', () => {
  const dana = {
    id: 1,
    name: 'Dana Dudley',
    slug: 'dana-dudley',
    title: 'CTO',
    role: 'Owns the technology and software development, and helps steer the firm.',
    photo,
  }

  it('renders the job title, not the descriptive sentence', () => {
    const el = draw({ collection: 'teamMembers', manualItems: [dana] })
    expect(el.textContent).toContain('CTO')
    expect(el.textContent).not.toContain(dana.role)
  })

  it('shows the name alone when there is no job title', () => {
    const el = draw({ collection: 'teamMembers', manualItems: [{ ...dana, title: null }] })
    expect(el.textContent).toContain('Dana Dudley')
    expect(el.querySelectorAll('li p')).toHaveLength(0)
  })
})

// ROADMAP IND-1 — a card links only where `/industries/[slug]` resolves.
describe('cards — industries link only where the route resolves', () => {
  const industry = (over: Record<string, unknown> = {}) => ({
    id: 1,
    title: 'Oil and Gas',
    slug: 'oil-and-gas',
    _status: 'published',
    layout: [{ blockType: 'hero' }],
    ...over,
  })
  const linkFor = (doc: Record<string, unknown>) =>
    draw({ collection: 'industries', manualItems: [doc] }).querySelector(
      'a[href="/industries/oil-and-gas"]',
    )

  it('links a published industry with a body', () => {
    expect(linkFor(industry())).not.toBeNull()
  })

  it.each([
    ['an empty body', { layout: [] }],
    ['a body that was never populated', { layout: undefined }],
    ['a NULL body', { layout: null }],
    ['a draft', { _status: 'draft' }],
  ])('does not link %s, but still draws the card', (_label, over) => {
    expect(linkFor(industry(over))).toBeNull()
    const el = draw({ collection: 'industries', manualItems: [industry(over)] })
    expect(el.querySelectorAll('li')).toHaveLength(1)
    expect(el.textContent).toContain('Oil and Gas')
  })
})

describe('cards — services and groups', () => {
  it('a group keeps the larger title-only card, a service keeps its icon line', () => {
    const el = draw({
      collection: 'services',
      manualItems: [
        { id: 1, title: 'Build', slug: 'build', tier: 'group' },
        { id: 2, title: 'Platform', slug: 'platform', tier: 'leaf', icon: 'gear' },
      ],
    })
    const [group, leaf] = [...el.querySelectorAll('li')]
    expect(group.querySelector('h2')?.className).toContain('text-h3')
    expect(leaf.querySelector('h2')?.className).toContain('text-h4')
    expect(leaf.textContent).toContain('gear')
  })

  it('a list of groups only keeps the three-up pillar grid', () => {
    const el = draw({
      collection: 'services',
      manualItems: [{ id: 1, title: 'Build', slug: 'build', tier: 'group' }],
    })
    expect(el.querySelector('ul')?.className).toContain('md:grid-cols-3')
    expect(el.querySelector('ul')?.className).not.toContain('md:grid-cols-2')
  })
})

describe('cards — partners', () => {
  it('a partner with no slug is not drawn, since the card is only ever a link', () => {
    const el = draw({
      collection: 'partners',
      manualItems: [
        { id: 1, name: 'Linked', slug: 'linked' },
        { id: 2, name: 'Nowhere', slug: null },
      ],
    })
    expect(el.textContent).toContain('Linked')
    expect(el.textContent).not.toContain('Nowhere')
  })
})
