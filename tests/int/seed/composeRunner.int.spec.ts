// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config'
import { runComposer, runGlobalComposer } from '../../../src/payload/seed/compose/shared'
import { composeWorkshopLayout } from '../../../src/payload/seed/compose/workshopToLayout'
import { composeHomepageLayout } from '../../../src/payload/seed/compose/homepageToLayout'
import { buildLexical } from '../../../src/payload/seed/showcase/lexical'

/**
 * spec 010 — coverage for the migration-runner ORCHESTRATION (`runComposer` /
 * `runGlobalComposer` in compose/shared.ts), distinct from the pure `composeX`
 * transforms (covered by composeFidelity) and `upsertBySlug` (covered by
 * upsertIdempotency). Pins the contract behind the SC-003 zero-dropped-content
 * bar: env-gating, `--dry-run` (JSON-Lines plan + zero writes), the real write
 * of the composed `layout`, and an idempotent re-run — for both the collection
 * runner and the homepage-global runner.
 */

let payload: Payload

const capture = () => {
  const lines: string[] = []
  return { push: (l: string) => lines.push(l), lines }
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

// ---------------------------------------------------------------------------
// runComposer — collection path (workshops)
// ---------------------------------------------------------------------------
describe('runComposer (collection orchestration)', () => {
  const SLUG = 'compose-runner-workshop'

  beforeAll(async () => {
    await payload.delete({
      collection: 'workshops',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'workshops',
      data: {
        title: 'Compose Runner Workshop',
        slug: SLUG,
        _status: 'published',
        description: buildLexical([{ kind: 'p', text: 'RUNNER-description-marker' }]) as never,
        deliverables: [
          { label: 'RUNNER-deliv-1' },
          { label: 'RUNNER-deliv-2' },
          { label: 'RUNNER-deliv-3' },
        ],
      },
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    await payload.delete({
      collection: 'workshops',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
    })
  })

  const readLayout = async (): Promise<Array<{ blockType: string }>> => {
    const { docs } = await payload.find({
      collection: 'workshops',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
      draft: true,
      depth: 0,
      limit: 1,
    })
    return (docs[0] as { layout?: Array<{ blockType: string }> })?.layout ?? []
  }

  it('env-gates: missing DATABASE_URL/PAYLOAD_SECRET (and no payload override) → exitCode 1, no run', async () => {
    const err = capture()
    const summary = await runComposer({
      collection: 'workshops',
      compose: composeWorkshopLayout,
      env: {},
      stderr: err.push,
    })
    expect(summary.exitCode).toBe(1)
    expect(err.lines.join('\n')).toContain('Missing required env var(s)')
  })

  it('--dry-run emits a JSON-Lines plan and writes nothing', async () => {
    const out = capture()
    const summary = await runComposer({
      collection: 'workshops',
      compose: composeWorkshopLayout,
      payload,
      argv: ['--dry-run'],
      stdout: out.push,
      stderr: capture().push,
    })
    expect(summary.exitCode).toBe(0)
    const plan = out.lines
      .map((l) => {
        try {
          return JSON.parse(l) as { slug?: string; blockTypes?: string[] }
        } catch {
          return null
        }
      })
      .find((p) => p?.slug === SLUG)
    expect(plan, 'dry-run emits a JSON-Lines entry for the seeded workshop').toBeTruthy()
    expect(plan?.blockTypes).toContain('deliverables')
    // Zero writes: the composed deliverable labels are NOT persisted by a dry run
    // (the seeded record carries the collection's default skeleton, not these).
    expect(JSON.stringify(await readLayout())).not.toContain('RUNNER-deliv-2')
  })

  it('real run writes the composed layout, and a re-run is idempotent', async () => {
    await runComposer({
      collection: 'workshops',
      compose: composeWorkshopLayout,
      payload,
      stdout: capture().push,
    })
    const first = await readLayout()
    expect(first.map((b) => b.blockType)).toEqual(['content', 'deliverables', 'contact-cta'])
    expect(JSON.stringify(first)).toContain('RUNNER-deliv-2')

    await runComposer({
      collection: 'workshops',
      compose: composeWorkshopLayout,
      payload,
      stdout: capture().push,
    })
    const second = await readLayout()
    expect(second.map((b) => b.blockType)).toEqual(first.map((b) => b.blockType))
  })
})

// ---------------------------------------------------------------------------
// runGlobalComposer — global path (homepage)
// ---------------------------------------------------------------------------
describe('runGlobalComposer (global orchestration)', () => {
  beforeAll(async () => {
    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        _status: 'published',
        hero: { headline: 'RUNNER-hero-headline', cta: { label: 'Go', url: '/services' } },
        stats: [
          { number: '1', label: 'RUNNER-stat-a' },
          { number: '2', label: 'RUNNER-stat-b' },
          { number: '3', label: 'RUNNER-stat-c' },
        ],
      } as never,
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    // Reset the shared global so sibling suites don't read this fixture's layout.
    await payload.updateGlobal({
      slug: 'homepage',
      data: { layout: [] } as never,
      overrideAccess: true,
    })
  })

  const readLayout = async (): Promise<Array<{ blockType: string }>> => {
    const hp = (await payload.findGlobal({
      slug: 'homepage',
      draft: true,
      overrideAccess: true,
      depth: 0,
    })) as {
      layout?: Array<{ blockType: string }>
    }
    return hp.layout ?? []
  }

  it('--dry-run emits a plan and writes nothing', async () => {
    await payload.updateGlobal({
      slug: 'homepage',
      data: { layout: [] } as never,
      overrideAccess: true,
    })
    const out = capture()
    const summary = await runGlobalComposer({
      global: 'homepage',
      compose: composeHomepageLayout,
      payload,
      argv: ['--dry-run'],
      stdout: out.push,
      stderr: capture().push,
    })
    expect(summary.exitCode).toBe(0)
    const plan = out.lines.map(
      (l) => JSON.parse(l) as { global?: string; blockTypes?: string[] },
    )[0]
    expect(plan?.global).toBe('homepage')
    expect(plan?.blockTypes).toEqual(['homepage-hero', 'stats-bar'])
    expect(await readLayout()).toEqual([])
  })

  it('real run writes the composed layout, and a re-run is idempotent', async () => {
    const s1 = await runGlobalComposer({
      global: 'homepage',
      compose: composeHomepageLayout,
      payload,
      stdout: capture().push,
    })
    expect(s1.exitCode).toBe(0)
    const first = await readLayout()
    expect(first.map((b) => b.blockType)).toEqual(['homepage-hero', 'stats-bar'])
    expect(JSON.stringify(first)).toContain('RUNNER-hero-headline')

    await runGlobalComposer({
      global: 'homepage',
      compose: composeHomepageLayout,
      payload,
      stdout: capture().push,
    })
    const second = await readLayout()
    expect(second.map((b) => b.blockType)).toEqual(first.map((b) => b.blockType))
  })
})
