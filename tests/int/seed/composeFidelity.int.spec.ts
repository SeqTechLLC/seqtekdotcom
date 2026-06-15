// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config'
import { composeWorkshopLayout } from '../../../src/payload/seed/compose/workshopToLayout'
import { upsertBySlug } from '../../../src/payload/seed/upsert'
import { buildLexical } from '../../../src/payload/seed/showcase/lexical'

// 1x1 transparent PNG — the smallest valid upload (same bytes the e2e seed
// helper uses) so `photos`/`gallery` fidelity is real.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * spec 010 (contract migration-fidelity.md) — the field→layout composer
 * fidelity + idempotency harness. Shared helpers live here; each migration
 * story (US1 workshops, US2 case studies / services / team, US5 homepage)
 * appends its own `describe` block that:
 *   1. seeds a record with known discrete fields,
 *   2. runs the composer,
 *   3. asserts every source unit appears in a block (fidelity, SC-003) and the
 *      block types match the documented mapping (data-model.md per type), and
 *   4. re-runs and asserts an identical layout (idempotency, SC-004/FR-007).
 */

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

// Created records are cleaned up by each per-type describe via its own slug list.
afterAll(async () => {
  // no-op: per-type blocks own their fixture cleanup.
})

export interface BlockLike {
  blockType: string
  [key: string]: unknown
}

/** The ordered list of blockTypes in a layout — the primary fidelity assertion. */
export const blockTypesOf = (layout: BlockLike[] | null | undefined): string[] =>
  (layout ?? []).map((b) => b.blockType)

/**
 * Strip the Payload-assigned `id` (and nested array-row `id`s) so two composer
 * runs can be compared structurally — auto-generated ids legitimately differ
 * between runs and are not a fidelity signal.
 */
export const stripIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripIds)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'id' || k === '_uuid') continue
      out[k] = stripIds(v)
    }
    return out
  }
  return value
}

/** Re-read a record's stored `layout` at depth 0 (media/relations as ids). */
export const readLayout = async (collection: string, slug: string): Promise<BlockLike[]> => {
  const { docs } = await payload.find({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: collection as any,
    where: { slug: { equals: slug } },
    overrideAccess: true,
    draft: true,
    depth: 0,
    limit: 1,
  })
  return ((docs[0] as { layout?: BlockLike[] })?.layout ?? []) as BlockLike[]
}

export const getPayloadForCompose = (): Payload => payload

// ---------------------------------------------------------------------------
// Harness self-test — proves the shared helpers behave before the per-type
// cases rely on them. (No DB writes.)
// ---------------------------------------------------------------------------
describe('compose fidelity harness', () => {
  it('blockTypesOf returns the ordered slugs', () => {
    expect(blockTypesOf([{ blockType: 'content' }, { blockType: 'gallery' }])).toEqual([
      'content',
      'gallery',
    ])
    expect(blockTypesOf(null)).toEqual([])
  })

  it('stripIds removes id/_uuid recursively but keeps content equal across runs', () => {
    const runA = [
      { blockType: 'content', id: 'a1', body: buildLexical([{ kind: 'p', text: 'hi' }]) },
    ]
    const runB = [
      { blockType: 'content', id: 'b2', body: buildLexical([{ kind: 'p', text: 'hi' }]) },
    ]
    expect(stripIds(runA)).toEqual(stripIds(runB))
  })
})

// ---------------------------------------------------------------------------
// US1 — Workshops (Phase B pilot). SC-003 fidelity + SC-004 idempotency.
// ---------------------------------------------------------------------------
describe('workshops field→layout composer (US1)', () => {
  const SLUG = 'compose-fidelity-workshop'
  let mediaId: string | number
  let testimonialId: string | number

  beforeAll(async () => {
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Workshop proof photo' },
      file: {
        data: TINY_PNG,
        mimetype: 'image/png',
        name: `${SLUG}-proof.png`,
        size: TINY_PNG.length,
      },
      overrideAccess: true,
    })
    mediaId = media.id
    const testimonial = await payload.create({
      collection: 'testimonials',
      data: { quote: 'The workshop reframed our roadmap.', personName: 'A. Client' },
      overrideAccess: true,
      draft: true,
    })
    testimonialId = testimonial.id

    await payload.create({
      collection: 'workshops',
      data: {
        title: 'Fidelity Pilot Workshop',
        slug: SLUG,
        _status: 'published',
        description: buildLexical([{ kind: 'p', text: 'DESC-the-workshop-explained' }]) as never,
        format: buildLexical([{ kind: 'p', text: 'FORMAT-one-day-onsite' }]) as never,
        audience: buildLexical([{ kind: 'p', text: 'AUDIENCE-leadership-teams' }]) as never,
        deliverables: [
          { label: 'DELIV-plan-of-record' },
          { label: 'DELIV-runbook' },
          { label: 'DELIV-handoff-session' },
        ],
        photos: [{ image: mediaId, caption: 'CAPTION-discovery' }],
        video: { provider: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'VIDEO-recap' },
        testimonial: testimonialId,
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
    await payload.delete({
      collection: 'testimonials',
      where: { id: { equals: testimonialId } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'media',
      where: { id: { equals: mediaId } },
      overrideAccess: true,
    })
  })

  const runComposeOnce = async (): Promise<BlockLike[]> => {
    const { docs } = await payload.find({
      collection: 'workshops',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
      draft: true,
      depth: 0,
      limit: 1,
    })
    const layout = composeWorkshopLayout(docs[0] as unknown as Record<string, unknown>)
    await upsertBySlug({
      payload,
      collection: 'workshops',
      slug: SLUG,
      data: { slug: SLUG, layout: layout as unknown[] },
      draft: false,
    })
    return readLayout('workshops', SLUG)
  }

  it('composes the documented block order with no content lost (SC-003)', async () => {
    const layout = await runComposeOnce()
    expect(blockTypesOf(layout)).toEqual([
      'content',
      'content',
      'content',
      'deliverables',
      'gallery',
      'video-embed',
      'testimonial-block',
      'contact-cta',
    ])

    const json = JSON.stringify(layout)
    // Every source unit survives into a block.
    for (const marker of [
      'DESC-the-workshop-explained',
      'FORMAT-one-day-onsite',
      'AUDIENCE-leadership-teams',
      'DELIV-plan-of-record',
      'DELIV-runbook',
      'CAPTION-discovery',
      'dQw4w9WgXcQ',
    ]) {
      expect(json).toContain(marker)
    }
    // Section headers from the retired template are preserved.
    expect(json).toContain('What it is')
    expect(json).toContain('Who it is for')
    // Media + testimonial relationships land as ids on their blocks.
    const gallery = layout.find((b) => b.blockType === 'gallery') as {
      items?: Array<{ image?: unknown }>
    }
    expect(gallery?.items?.[0]?.image).toBe(mediaId)
    const tb = layout.find((b) => b.blockType === 'testimonial-block') as { testimonial?: unknown }
    expect(tb?.testimonial).toBe(testimonialId)
  })

  it('is idempotent — a second run yields an identical layout (SC-004)', async () => {
    const first = await runComposeOnce()
    const second = await runComposeOnce()
    expect(stripIds(second)).toEqual(stripIds(first))
  })
})
