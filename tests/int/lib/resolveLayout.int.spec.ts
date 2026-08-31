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

const { listTeamMembers, listPosts, listCaseStudies, listServices, listServicePillars } =
  vi.hoisted(() => ({
    listTeamMembers: vi.fn(),
    listPosts: vi.fn(),
    listCaseStudies: vi.fn(),
    listServices: vi.fn(),
    listServicePillars: vi.fn(),
  }))

vi.mock('../../../src/lib/payload', () => ({
  listTeamMembers,
  listPosts,
  listCaseStudies,
  listServices,
  listServicePillars,
}))

import { resolveLayout, byLeadershipThenOrder } from '../../../src/lib/resolveLayout'

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

// ROADMAP SVC-2 moved this relation from the leaf to the group: a service no
// longer names one pillar, the pillar holds an ordered list of its services.
// That is what lets a leaf be cross-listed under two groups (NAV-1).
describe('resolveLayout — service-cards', () => {
  const alpha = { id: 1, title: 'Alpha' }
  const beta = { id: 2, title: 'Beta' }
  const gamma = { id: 3, title: 'Gamma' }

  beforeEach(() => {
    // `listServices` is sorted by the services' own `order`.
    listServices.mockResolvedValue([alpha, beta, gamma])
    listServicePillars.mockResolvedValue([
      // Populated relations and bare ids both appear, depending on read depth.
      { id: 30, slug: 'build', items: [gamma, alpha] },
      { id: 40, slug: 'operate', items: [2] },
    ])
  })

  it('resolves by-pillar through the group that holds the services', async () => {
    const [block] = await resolveLayout([
      { blockType: 'service-cards', source: 'by-pillar', pillar: 30 },
    ])
    expect(block.manualItems).toEqual([gamma, alpha])
  })

  it("renders in the GROUP's order, not the services' own order", async () => {
    // `listServices` returns alpha, beta, gamma; the group says gamma first.
    // The editor's arrangement on the group is what a visitor sees.
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

  it('renders nothing when the block names no group, or an unknown one', async () => {
    const [none] = await resolveLayout([{ blockType: 'service-cards', source: 'by-pillar' }])
    expect(none.manualItems).toEqual([])
    const [missing] = await resolveLayout([
      { blockType: 'service-cards', source: 'by-pillar', pillar: 999 },
    ])
    expect(missing.manualItems).toEqual([])
  })

  it('still returns every service when the source is not by-pillar', async () => {
    const [block] = await resolveLayout([{ blockType: 'service-cards', source: 'all' }])
    expect(block.manualItems).toEqual([alpha, beta, gamma])
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
