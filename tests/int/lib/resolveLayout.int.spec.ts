// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ROADMAP UI-2 — `resolveLayout` is the "template time" the four
// collection-backed blocks' placeholders were deferring to. It fills each
// block's `manualItems` from the cached readers so the render components stay
// pure and synchronous. The readers are mocked here: this file pins the
// selection/ordering logic, not the database.

// `src/lib/payload.ts` opens with `import 'server-only'`, which throws outside
// the `react-server` condition — the same mock the other lib specs use.
vi.mock('server-only', () => ({}))

const {
  listTeamMembers,
  listPosts,
  listCaseStudies,
  listServices,
  listIndustries,
  listWorkshops,
  listLocations,
  listPartners,
} = vi.hoisted(() => ({
  listTeamMembers: vi.fn(),
  listPosts: vi.fn(),
  listCaseStudies: vi.fn(),
  listServices: vi.fn(),
  listIndustries: vi.fn(),
  listWorkshops: vi.fn(),
  listLocations: vi.fn(),
  listPartners: vi.fn(),
}))

vi.mock('../../../src/lib/payload', () => ({
  listTeamMembers,
  listPosts,
  listCaseStudies,
  listServices,
  listIndustries,
  listWorkshops,
  listLocations,
  listPartners,
}))

import {
  resolveLayout,
  byLeadershipThenOrder,
  type LayoutBlock,
} from '../../../src/lib/resolveLayout'

const hank = { id: 1, name: 'Hank Haines', isLeadership: true, order: 1 }
const dana = { id: 2, name: 'Dana Dudley', isLeadership: true, order: 2 }
const trevor = { id: 3, name: 'Trevor Staub', isLeadership: false, order: 9 }
const unordered = { id: 4, name: 'No Order', isLeadership: false, order: null }

beforeEach(() => {
  vi.clearAllMocks()
  listTeamMembers.mockResolvedValue([hank, dana, trevor, unordered])
  listPosts.mockResolvedValue([])
  listCaseStudies.mockResolvedValue([])
  listServices.mockResolvedValue([])
  listIndustries.mockResolvedValue([])
  listWorkshops.mockResolvedValue([])
  listLocations.mockResolvedValue([])
  listPartners.mockResolvedValue([])
})

describe('resolveLayout — team-grid', () => {
  it('fills leadership-only with the members marked as leadership', async () => {
    const [block] = await resolveLayout([{ blockType: 'team-grid', filter: 'leadership-only' }])
    expect(block.manualItems).toEqual([hank, dana])
  })

  it('fills `all` with every member, leadership first then by order', async () => {
    const [block] = await resolveLayout([{ blockType: 'team-grid', filter: 'all' }])
    expect((block.manualItems as (typeof hank)[]).map((m) => m.name)).toEqual([
      'Hank Haines',
      'Dana Dudley',
      'Trevor Staub',
      'No Order',
    ])
  })

  it('honours an explicit manual pick over the filter and issues no query', async () => {
    const picked = [{ id: 9, name: 'Picked' }]
    const [block] = await resolveLayout([
      { blockType: 'team-grid', filter: 'leadership-only', manualItems: picked },
    ])
    expect(block.manualItems).toBe(picked)
    expect(listTeamMembers).not.toHaveBeenCalled()
  })

  it('treats an empty manual list as "not picked" and falls back to the filter', async () => {
    const [block] = await resolveLayout([
      { blockType: 'team-grid', filter: 'leadership-only', manualItems: [] },
    ])
    expect(block.manualItems).toEqual([hank, dana])
  })
})

describe('resolveLayout — post-list', () => {
  const a = { id: 1, title: 'A', categories: [10] }
  const b = { id: 2, title: 'B', categories: [{ id: 20 }] }
  const c = { id: 3, title: 'C', categories: [10, 20] }

  beforeEach(() => listPosts.mockResolvedValue([a, b, c]))

  it('fills `latest` from the reader, capped by limit', async () => {
    const [block] = await resolveLayout([{ blockType: 'post-list', source: 'latest', limit: 2 }])
    expect(block.manualItems).toEqual([a, b])
  })

  it('defaults the limit to 3 when unset', async () => {
    const [block] = await resolveLayout([{ blockType: 'post-list', source: 'latest' }])
    expect(block.manualItems).toHaveLength(3)
  })

  it('filters by-category across raw ids and populated relations alike', async () => {
    const [block] = await resolveLayout([
      { blockType: 'post-list', source: 'by-category', category: 20 },
    ])
    expect((block.manualItems as (typeof a)[]).map((p) => p.title)).toEqual(['B', 'C'])
  })

  it('leaves a manual block untouched', async () => {
    const manual = { blockType: 'post-list', source: 'manual', manualItems: [a] }
    const [block] = await resolveLayout([manual])
    expect(block).toBe(manual)
    expect(listPosts).not.toHaveBeenCalled()
  })
})

describe('resolveLayout — case-study-grid', () => {
  const one = { id: 1, title: 'One', industry: 5, services: [7] }
  const two = { id: 2, title: 'Two', industry: { id: 6 }, services: [8, 7] }

  beforeEach(() => listCaseStudies.mockResolvedValue([one, two]))

  it('filters by-industry', async () => {
    const [block] = await resolveLayout([
      { blockType: 'case-study-grid', source: 'by-industry', industry: 6 },
    ])
    expect(block.manualItems).toEqual([two])
  })

  it('filters by-service across a hasMany relation', async () => {
    const [block] = await resolveLayout([
      { blockType: 'case-study-grid', source: 'by-service', service: 7 },
    ])
    expect(block.manualItems).toEqual([one, two])
  })

  it('fills `latest` with the whole list', async () => {
    const [block] = await resolveLayout([{ blockType: 'case-study-grid', source: 'latest' }])
    expect(block.manualItems).toEqual([one, two])
  })
})

// ROADMAP SVC-2. The relation lives on the GROUP, and groups live in the SAME
// collection as the services under `tier`. So this resolver does two things the
// old `pillar`-on-the-service version did not: it filters the tiers apart, and
// it walks the group's ordered list rather than filtering the service list.
describe('resolveLayout — service-cards', () => {
  const alpha = { id: 1, title: 'Alpha', tier: 'leaf' }
  const beta = { id: 2, title: 'Beta', tier: 'leaf' }
  const gamma = { id: 3, title: 'Gamma', tier: 'leaf' }
  const build = { id: 30, title: 'Build', tier: 'group', items: [gamma, alpha] }
  const operate = { id: 40, title: 'Operate', tier: 'group', items: [2] }
  const axis = { id: 50, title: 'What We Do', tier: 'axis', items: [build, operate] }

  beforeEach(() => listServices.mockResolvedValue([alpha, beta, gamma, build, operate, axis]))

  it('resolves by-pillar through the group that holds the services', async () => {
    const [block] = await resolveLayout([
      { blockType: 'service-cards', source: 'by-pillar', pillar: 30 },
    ])
    expect(block.manualItems).toEqual([gamma, alpha])
  })

  it("renders in the GROUP's order, not the services' own order", async () => {
    const [block] = await resolveLayout([
      { blockType: 'service-cards', source: 'by-pillar', pillar: 30 },
    ])
    expect((block.manualItems as { title: string }[]).map((s) => s.title)).toEqual([
      'Gamma',
      'Alpha',
    ])
  })

  it('accepts a group whose items came back as bare ids', async () => {
    const [block] = await resolveLayout([
      { blockType: 'service-cards', source: 'by-pillar', pillar: 40 },
    ])
    expect(block.manualItems).toEqual([beta])
  })

  it('never lists a group or an axis page as if it were a service', async () => {
    // The whole risk of one collection: three tiers share it, and a card list
    // is always services.
    const [block] = await resolveLayout([{ blockType: 'service-cards', source: 'all' }])
    expect(block.manualItems).toEqual([alpha, beta, gamma])
  })

  it('lists nothing for an axis page, whose items are groups rather than services', async () => {
    const [block] = await resolveLayout([
      { blockType: 'service-cards', source: 'by-pillar', pillar: 50 },
    ])
    expect(block.manualItems).toEqual([])
  })

  it('renders nothing when the block names no group, or an unknown one', async () => {
    const [none] = await resolveLayout([{ blockType: 'service-cards', source: 'by-pillar' }])
    expect(none.manualItems).toEqual([])
    const [missing] = await resolveLayout([
      { blockType: 'service-cards', source: 'by-pillar', pillar: 999 },
    ])
    expect(missing.manualItems).toEqual([])
  })
})

// The `cards` block (docs/planning/block-consolidation.md) replaces the ten
// per-collection grids with one resolver. Whatever the source, the component
// is handed plain documents in `manualItems`, in the order the matching
// listing page uses, trimmed by `limit`.
describe('resolveLayout — cards', () => {
  const titles = (block: LayoutBlock) =>
    (block.manualItems as Array<{ title?: string; name?: string; city?: string }>).map(
      (d) => d.title ?? d.name ?? d.city,
    )

  const cards = (over: Record<string, unknown>) => ({ blockType: 'cards', source: 'all', ...over })

  describe('each collection, source all', () => {
    it('case studies, in the reader order (newest first)', async () => {
      listCaseStudies.mockResolvedValue([
        { id: 1, title: 'Newer' },
        { id: 2, title: 'Older' },
      ])
      const [block] = await resolveLayout([cards({ collection: 'caseStudies' })])
      expect(titles(block)).toEqual(['Newer', 'Older'])
    })

    it('posts, in the reader order (newest first)', async () => {
      listPosts.mockResolvedValue([
        { id: 1, title: 'P1' },
        { id: 2, title: 'P2' },
      ])
      const [block] = await resolveLayout([cards({ collection: 'posts' })])
      expect(titles(block)).toEqual(['P1', 'P2'])
    })

    it('services lists services only, never a group or an axis page', async () => {
      listServices.mockResolvedValue([
        { id: 1, title: 'Leaf A', tier: 'leaf' },
        { id: 2, title: 'Group', tier: 'group', items: [1] },
        { id: 3, title: 'Axis', tier: 'axis' },
        { id: 4, title: 'Leaf B', tier: 'leaf' },
      ])
      const [block] = await resolveLayout([cards({ collection: 'services' })])
      expect(titles(block)).toEqual(['Leaf A', 'Leaf B'])
    })

    it('team members, leadership first then by order', async () => {
      listTeamMembers.mockResolvedValue([trevor, unordered, dana, hank])
      const [block] = await resolveLayout([cards({ collection: 'teamMembers' })])
      expect(titles(block)).toEqual(['Hank Haines', 'Dana Dudley', 'Trevor Staub', 'No Order'])
    })

    it.each([
      ['industries', listIndustries, [{ id: 1, title: 'Energy' }]],
      ['workshops', listWorkshops, [{ id: 1, title: 'Touchstone' }]],
      ['locations', listLocations, [{ id: 1, city: 'Tulsa' }]],
      ['partners', listPartners, [{ id: 1, name: 'Acme' }]],
    ] as const)('%s, straight from its reader', async (collection, reader, docs) => {
      reader.mockResolvedValue(docs)
      const [block] = await resolveLayout([cards({ collection })])
      expect(block.manualItems).toEqual(docs)
      expect(reader).toHaveBeenCalledTimes(1)
    })
  })

  describe('source filtered', () => {
    const one = { id: 1, title: 'One', industry: 5, services: [7] }
    const two = { id: 2, title: 'Two', industry: { id: 6 }, services: [8, 7] }
    const three = { id: 3, title: 'Three', industry: 6, services: [8] }

    beforeEach(() => listCaseStudies.mockResolvedValue([one, two, three]))

    it('case studies by industry, across raw ids and populated relations', async () => {
      const [block] = await resolveLayout([
        cards({ collection: 'caseStudies', source: 'filtered', industry: { id: 6 } }),
      ])
      expect(titles(block)).toEqual(['Two', 'Three'])
    })

    it('case studies by service, across a hasMany relation', async () => {
      const [block] = await resolveLayout([
        cards({ collection: 'caseStudies', source: 'filtered', service: 7 }),
      ])
      expect(titles(block)).toEqual(['One', 'Two'])
    })

    it('case studies by industry AND service when both are set', async () => {
      const [block] = await resolveLayout([
        cards({ collection: 'caseStudies', source: 'filtered', industry: 6, service: 7 }),
      ])
      expect(titles(block)).toEqual(['Two'])
    })

    it('a blank filter does not narrow', async () => {
      const [block] = await resolveLayout([
        cards({ collection: 'caseStudies', source: 'filtered' }),
      ])
      expect(titles(block)).toEqual(['One', 'Two', 'Three'])
    })

    it('filters are ignored unless the source is filtered', async () => {
      const [block] = await resolveLayout([
        cards({ collection: 'caseStudies', source: 'all', industry: 5 }),
      ])
      expect(titles(block)).toEqual(['One', 'Two', 'Three'])
    })

    it('posts by category', async () => {
      listPosts.mockResolvedValue([
        { id: 1, title: 'A', categories: [10] },
        { id: 2, title: 'B', categories: [{ id: 20 }] },
        { id: 3, title: 'C', categories: [10, 20] },
      ])
      const [block] = await resolveLayout([
        cards({ collection: 'posts', source: 'filtered', category: 20 }),
      ])
      expect(titles(block)).toEqual(['B', 'C'])
    })

    it('team members, leadership only, still leadership-first ordered', async () => {
      listTeamMembers.mockResolvedValue([trevor, dana, hank])
      const [block] = await resolveLayout([
        cards({ collection: 'teamMembers', source: 'filtered', leadershipOnly: true }),
      ])
      expect(titles(block)).toEqual(['Hank Haines', 'Dana Dudley'])
    })

    it('team members with the leadership box clear is the whole team', async () => {
      const [block] = await resolveLayout([
        cards({ collection: 'teamMembers', source: 'filtered', leadershipOnly: false }),
      ])
      expect(titles(block)).toHaveLength(4)
    })

    it('leadershipOnly is ignored unless the source is filtered', async () => {
      const [block] = await resolveLayout([
        cards({ collection: 'teamMembers', source: 'all', leadershipOnly: true }),
      ])
      expect(titles(block)).toHaveLength(4)
    })

    it.each([
      ['industries', listIndustries],
      ['workshops', listWorkshops],
      ['locations', listLocations],
      ['partners', listPartners],
    ] as const)('%s has no filter, so "filtered" lists them all', async (collection, reader) => {
      reader.mockResolvedValue([{ id: 1, title: 'x' }])
      const [block] = await resolveLayout([cards({ collection, source: 'filtered' })])
      expect(block.manualItems).toEqual([{ id: 1, title: 'x' }])
    })

    // SVC-2: the relation lives on the GROUP, and groups share the collection
    // with the services under `tier`.
    describe('services by group', () => {
      const alpha = { id: 1, title: 'Alpha', tier: 'leaf' }
      const beta = { id: 2, title: 'Beta', tier: 'leaf' }
      const gamma = { id: 3, title: 'Gamma', tier: 'leaf' }
      const build = { id: 30, title: 'Build', tier: 'group', items: [gamma, alpha] }
      const operate = { id: 40, title: 'Operate', tier: 'group', items: [2] }
      const axis = { id: 50, title: 'What We Do', tier: 'axis', items: [build, operate] }

      beforeEach(() => listServices.mockResolvedValue([alpha, beta, gamma, build, operate, axis]))

      it("renders in the GROUP's order, not the services' own order", async () => {
        const [block] = await resolveLayout([
          cards({ collection: 'services', source: 'filtered', serviceGroup: 30 }),
        ])
        expect(titles(block)).toEqual(['Gamma', 'Alpha'])
      })

      it('accepts a group whose items came back as bare ids', async () => {
        const [block] = await resolveLayout([
          cards({ collection: 'services', source: 'filtered', serviceGroup: { id: 40 } }),
        ])
        expect(titles(block)).toEqual(['Beta'])
      })

      it('lists nothing for an axis page, or a group that is not published', async () => {
        for (const serviceGroup of [50, 999]) {
          const [block] = await resolveLayout([
            cards({ collection: 'services', source: 'filtered', serviceGroup }),
          ])
          expect(block.manualItems).toEqual([])
        }
      })
    })
  })

  describe('source manual', () => {
    const picked = (relationTo: string, value: unknown) => ({ relationTo, value })

    it('keeps the picks for the chosen collection, unwrapped, in pick order', async () => {
      const a = { id: 1, title: 'A' }
      const b = { id: 2, title: 'B' }
      const [block] = await resolveLayout([
        cards({
          collection: 'caseStudies',
          source: 'manual',
          manualItems: [picked('caseStudies', b), picked('caseStudies', a)],
        }),
      ])
      expect(block.manualItems).toEqual([b, a])
    })

    it('drops picks left over from another collection, and unpopulated ids', async () => {
      const kept = { id: 1, title: 'Kept' }
      const [block] = await resolveLayout([
        cards({
          collection: 'posts',
          source: 'manual',
          manualItems: [
            picked('caseStudies', { id: 9, title: 'Stale' }),
            picked('posts', 42),
            picked('posts', kept),
          ],
        }),
      ])
      expect(block.manualItems).toEqual([kept])
    })

    it('issues no query, and an empty pick is an empty list rather than "all"', async () => {
      const [team] = await resolveLayout([
        cards({ collection: 'teamMembers', source: 'manual', manualItems: [] }),
      ])
      expect(team.manualItems).toEqual([])
      expect(listTeamMembers).not.toHaveBeenCalled()
    })
  })

  describe('limit', () => {
    beforeEach(() =>
      listPosts.mockResolvedValue([1, 2, 3, 4, 5].map((id) => ({ id, title: `P${id}` }))),
    )

    it('trims a queried list', async () => {
      const [block] = await resolveLayout([cards({ collection: 'posts', limit: 2 })])
      expect(titles(block)).toEqual(['P1', 'P2'])
    })

    it('trims a hand-picked list, keeping pick order', async () => {
      const [block] = await resolveLayout([
        cards({
          collection: 'posts',
          source: 'manual',
          manualItems: [3, 1, 2].map((id) => ({
            relationTo: 'posts',
            value: { id, title: `P${id}` },
          })),
          limit: 2,
        }),
      ])
      expect(titles(block)).toEqual(['P3', 'P1'])
    })

    it('blank means all of them: there is no default cap', async () => {
      const [block] = await resolveLayout([cards({ collection: 'posts' })])
      expect(titles(block)).toHaveLength(5)
    })

    it('a limit past the end of the list is the whole list', async () => {
      const [block] = await resolveLayout([cards({ collection: 'posts', limit: 50 })])
      expect(titles(block)).toHaveLength(5)
    })
  })

  it('an unknown or missing collection resolves to nothing and queries nothing', async () => {
    const [missing, unknown] = await resolveLayout([
      { blockType: 'cards', source: 'all' },
      cards({ collection: 'pages' }),
    ])
    expect(missing.manualItems).toEqual([])
    expect(unknown.manualItems).toEqual([])
    expect(listCaseStudies).not.toHaveBeenCalled()
  })

  it('propagates a reader failure rather than degrading to an empty section', async () => {
    listPartners.mockRejectedValue(new Error('Payload read "listPartners" exceeded 5000ms'))
    await expect(resolveLayout([cards({ collection: 'partners' })])).rejects.toThrow(
      /exceeded 5000ms/,
    )
  })
})

describe('resolveLayout — pass-through', () => {
  it('returns [] for null/undefined/empty and issues no queries', async () => {
    expect(await resolveLayout(null)).toEqual([])
    expect(await resolveLayout(undefined)).toEqual([])
    expect(await resolveLayout([])).toEqual([])
    expect(listTeamMembers).not.toHaveBeenCalled()
  })

  it('leaves blocks it does not know about exactly as they were', async () => {
    const content = { blockType: 'content', body: { root: {} } }
    const [block] = await resolveLayout([content])
    expect(block).toBe(content)
  })

  it('resolves every block in one layout, preserving order', async () => {
    const out = await resolveLayout([
      { blockType: 'content' },
      { blockType: 'team-grid', filter: 'leadership-only' },
      { blockType: 'hero' },
    ])
    expect(out.map((b) => b.blockType)).toEqual(['content', 'team-grid', 'hero'])
    expect(out[1].manualItems).toEqual([hank, dana])
  })

  it('propagates a reader failure rather than degrading to an empty section', async () => {
    listTeamMembers.mockRejectedValue(new Error('Payload read "listTeamMembers" exceeded 5000ms'))
    await expect(resolveLayout([{ blockType: 'team-grid', filter: 'all' }])).rejects.toThrow(
      /exceeded 5000ms/,
    )
  })
})

describe('byLeadershipThenOrder', () => {
  it('sorts leadership ahead of everyone, then by order, unset last', () => {
    expect([unordered, trevor, dana, hank].sort(byLeadershipThenOrder).map((m) => m.id)).toEqual([
      1, 2, 3, 4,
    ])
  })
})
