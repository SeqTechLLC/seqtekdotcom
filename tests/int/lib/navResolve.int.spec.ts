// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { resolveLink, resolveNavigation, type NavigationDoc } from '../../../src/lib/nav/resolve'
import { navigation } from '../../../src/lib/site-content'
import { NAV_LINKABLE_COLLECTIONS, pathFor } from '../../../src/lib/routes'

/**
 * ADR 0010 amendment — the header menu as content.
 *
 * `resolveNavigation` is deliberately pure, so this is the layer where the
 * interesting behaviour is actually pinned: URL derivation per target
 * collection, the label fallback, and what a menu does when its data is
 * missing. None of it needs a database.
 */

/** A populated polymorphic relationship, as Payload returns it at depth 1. */
const target = (relationTo: string, slug: string, title: Record<string, string> = {}) => ({
  relationTo,
  value: { id: 1, slug, ...title },
})

const internal = (relationTo: string, slug: string, extra: Record<string, unknown> = {}) => ({
  type: 'internal' as const,
  doc: target(relationTo, slug, extra as Record<string, string>),
})

describe('resolveLink — the URL is derived, never stored', () => {
  it.each([
    ['pages', 'our-story', '/our-story'],
    ['services', 'generative-ai', '/services/generative-ai'],
    ['workshops', 'touchstone', '/workshops/touchstone'],
    ['industries', 'energy', '/industries/energy'],
    ['posts', 'first-post', '/insights/first-post'],
    ['caseStudies', 'acme', '/case-studies/acme'],
    ['partners', 'microsoft', '/partners/microsoft'],
  ])('%s/%s resolves to %s', (collection, slug, expected) => {
    expect(resolveLink(internal(collection, slug))?.url).toBe(expected)
  })

  it('covers every collection an editor is offered — no silent gap', () => {
    // The failure this catches: widening NAV_LINKABLE_COLLECTIONS without
    // teaching the route map about it, which would offer editors a target that
    // resolves to nothing and drops out of the menu with no error.
    for (const collection of NAV_LINKABLE_COLLECTIONS) {
      expect(resolveLink(internal(collection, 'x'))?.url).toBe(pathFor(collection, 'x'))
    }
  })

  it('passes an external URL through as entered', () => {
    expect(resolveLink({ type: 'external', url: 'https://example.com/x' })?.url).toBe(
      'https://example.com/x',
    )
  })

  it('drops a link whose target is gone rather than emitting a dead one', () => {
    expect(resolveLink({ type: 'internal', doc: null })).toBeNull()
    // Depth 0: a bare id, so there is no slug to build a URL from.
    expect(resolveLink({ type: 'internal', doc: { relationTo: 'pages', value: 7 } })).toBeNull()
    expect(resolveLink({ type: 'external', url: '   ' })).toBeNull()
    expect(resolveLink({ type: 'heading' })).toBeNull()
    expect(resolveLink(null)).toBeNull()
  })

  it('refuses a collection that has no route', () => {
    expect(resolveLink(internal('media', 'logo'))).toBeNull()
  })
})

describe('resolveNavigation — labels', () => {
  const docWith = (link: NavigationDoc['link']): NavigationDoc[] => [{ label: 'Button', link }]

  it("falls back to the target's own title, so renaming a page renames the menu", () => {
    const [item] = resolveNavigation([
      {
        label: 'Top',
        link: internal('pages', 'our-story', { title: 'Our Story' }),
        groups: [
          {
            label: 'Company',
            link: { type: 'heading' },
            items: [{ link: internal('pages', 'team', { title: 'Meet the Team' }) }],
          },
        ],
      },
    ])
    expect(item.panel?.groups[0].items[0]).toEqual({ label: 'Meet the Team', url: '/team' })
  })

  it('prefers an explicit override when the menu wants different wording', () => {
    const [item] = resolveNavigation([
      {
        label: 'Top',
        link: internal('pages', 'x', { title: 'X' }),
        groups: [
          {
            label: 'Company',
            link: { type: 'heading' },
            items: [
              {
                link: {
                  ...internal('pages', 'team', { title: 'Meet the Team' }),
                  label: 'Team',
                },
              },
            ],
          },
        ],
      },
    ])
    expect(item.panel?.groups[0].items[0].label).toBe('Team')
  })

  it("keeps the top-level button's own wording, which is never derived", () => {
    const [item] = resolveNavigation(
      docWith(internal('services', 'what-we-do', { title: 'What We Do (services)' })),
    )
    expect(item.label).toBe('Button')
  })
})

describe('resolveNavigation — structure', () => {
  it('renders a headless group as a heading with no URL', () => {
    const [item] = resolveNavigation([
      {
        label: 'How We Work',
        link: internal('services', 'how-we-work'),
        groups: [
          {
            label: 'How We Work',
            link: { type: 'heading' },
            items: [{ link: internal('workshops', 'touchstone', { title: 'Touchstone' }) }],
          },
        ],
      },
    ])
    const group = item.panel?.groups[0]
    expect(group?.label).toBe('How We Work')
    // `NavGroup.url` optional is what makes a heading a heading — PrimaryNav
    // renders a <span> rather than a link when it is absent.
    expect(group?.url).toBeUndefined()
  })

  it('gives a linked group its derived URL', () => {
    const [item] = resolveNavigation([
      {
        label: 'What We Do',
        link: internal('services', 'what-we-do'),
        groups: [
          {
            label: 'AI and Automation',
            link: internal('services', 'ai-and-automation'),
            items: [{ link: internal('services', 'generative-ai', { title: 'Generative AI' }) }],
          },
        ],
      },
    ])
    expect(item.panel?.groups[0].url).toBe('/services/ai-and-automation')
  })

  // These go through `resolveNavigation`, not `resolveLink`, because the label
  // is what decides survival and only the resolver consults it. An external
  // link has no target document, so its own wording is the ONLY label source —
  // which is why `navLink.ts` requires it for that type. These pin the
  // behaviour that makes the validator necessary.
  it('renders an external leaf that carries its own wording', () => {
    const [item] = resolveNavigation([
      {
        label: 'Top',
        link: internal('pages', 'top'),
        groups: [
          {
            label: 'Elsewhere',
            link: { type: 'heading' },
            items: [
              { link: { type: 'external', url: 'https://example.com/pod', label: 'Podcast' } },
            ],
          },
        ],
      },
    ])
    expect(item.panel?.groups[0].items).toEqual([
      { label: 'Podcast', url: 'https://example.com/pod' },
    ])
  })

  it('drops an external leaf with no wording — nothing to label it with', () => {
    const [item] = resolveNavigation([
      {
        label: 'Top',
        link: internal('pages', 'top'),
        groups: [
          {
            label: 'Elsewhere',
            link: { type: 'heading' },
            items: [
              { link: { type: 'external', url: 'https://example.com/pod' } },
              { link: internal('pages', 'kept', { title: 'Kept' }) },
            ],
          },
        ],
      },
    ])
    // Only the internal sibling survives. Publishing this state is what
    // `requiredWhen(type === 'external')` on the label now prevents.
    expect(item.panel?.groups[0].items).toEqual([{ label: 'Kept', url: '/kept' }])
  })

  it('leaves an item with no groups a plain link, so no caret is drawn', () => {
    const [item] = resolveNavigation([{ label: 'Contact', link: internal('pages', 'contact') }])
    expect(item.panel).toBeUndefined()
    expect(item.url).toBe('/contact')
  })

  it('orders by sort position, then alphabetically', () => {
    const items = resolveNavigation([
      { label: 'Third', link: internal('pages', 'c'), order: 2 },
      { label: 'Beta', link: internal('pages', 'b') },
      { label: 'Alpha', link: internal('pages', 'a') },
      { label: 'First', link: internal('pages', 'd'), order: 1 },
    ])
    expect(items.map((i) => i.label)).toEqual(['First', 'Third', 'Alpha', 'Beta'])
  })

  // NO LINKS, NO COLUMN — including a column whose heading has a page of its
  // own. Keeping the linked one looks defensible until you read the renderer:
  // `PrimaryNav` suppresses a single column's heading, so it draws a caret
  // opening an empty box.
  it('drops a column with no links, linked heading or not', () => {
    const [item] = resolveNavigation([
      {
        label: 'Top',
        link: internal('pages', 'top'),
        groups: [
          { label: 'Empty heading', link: { type: 'heading' }, items: [] },
          { label: 'Linked but empty', link: internal('services', 'group'), items: [] },
        ],
      },
    ])
    // Every column dropped, so there is no panel — and therefore no caret.
    expect(item.panel).toBeUndefined()
    expect(item.url).toBe('/top')
  })

  it('keeps the columns that do have links, and drops only the empty one', () => {
    const [item] = resolveNavigation([
      {
        label: 'Top',
        link: internal('pages', 'top'),
        groups: [
          { label: 'Empty', link: internal('services', 'group'), items: [] },
          {
            label: 'Full',
            link: internal('services', 'other'),
            items: [{ link: internal('services', 'leaf', { title: 'Leaf' }) }],
          },
        ],
      },
    ])
    expect(item.panel?.groups.map((g) => g.label)).toEqual(['Full'])
  })

  it('drops a top-level button whose target no longer resolves', () => {
    const items = resolveNavigation([
      { label: 'Good', link: internal('pages', 'good') },
      { label: 'Broken', link: { type: 'internal', doc: null } },
    ])
    expect(items.map((i) => i.label)).toEqual(['Good'])
  })
})

describe('resolveNavigation — the fallback to code-owned chrome', () => {
  // This is the half that keeps a fresh deploy and an empty CI database from
  // rendering a headerless site. `layout.e2e.spec.ts` and `navPanels.int.spec.ts`
  // both assert against the shipped nav and would go red without it.
  it('hands the menu back to site-content.ts when nothing is published', () => {
    expect(resolveNavigation([])).toBe(navigation.mainNav)
  })

  it('falls back when every row is unusable, rather than rendering an empty bar', () => {
    expect(
      resolveNavigation([
        { label: '', link: null },
        { label: 'X', link: null },
      ]),
    ).toBe(navigation.mainNav)
  })

  it('stops falling back as soon as one real item resolves', () => {
    const items = resolveNavigation([{ label: 'Only', link: internal('pages', 'only') }])
    expect(items).not.toBe(navigation.mainNav)
    expect(items).toHaveLength(1)
  })
})
