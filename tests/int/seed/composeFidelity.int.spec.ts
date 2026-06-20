// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '../../../src/payload.config'
import { composeWorkshopLayout } from '../../../src/payload/seed/compose/workshopToLayout'
import { composeCaseStudyLayout } from '../../../src/payload/seed/compose/caseStudyToLayout'
import { composeServiceLayout } from '../../../src/payload/seed/compose/serviceToLayout'
import { composeTeamMemberLayout } from '../../../src/payload/seed/compose/teamMemberToLayout'
import { composeHomepageLayout } from '../../../src/payload/seed/compose/homepageToLayout'
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
      'hubspot-form',
    ])

    const json = JSON.stringify(layout)
    // Every source unit survives into a block.
    for (const marker of [
      'DESC-the-workshop-explained',
      'FORMAT-one-day-onsite',
      'AUDIENCE-leadership-teams',
      'DELIV-plan-of-record',
      'DELIV-runbook',
      'DELIV-handoff-session',
      'CAPTION-discovery',
      'dQw4w9WgXcQ',
      'VIDEO-recap',
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

// ---------------------------------------------------------------------------
// US2 — Case studies (Phase C). SC-003 fidelity + SC-004 idempotency.
// ---------------------------------------------------------------------------
describe('case studies field→layout composer (US2)', () => {
  const SLUG = 'compose-fidelity-case'
  let mediaId: string | number
  let industryId: string | number
  let testimonialId: string | number

  beforeAll(async () => {
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Case hero' },
      file: {
        data: TINY_PNG,
        mimetype: 'image/png',
        name: `${SLUG}-hero.png`,
        size: TINY_PNG.length,
      },
      overrideAccess: true,
    })
    mediaId = media.id
    const industry = await payload.create({
      collection: 'industries',
      data: { title: 'Energy', slug: `${SLUG}-industry` },
      overrideAccess: true,
    })
    industryId = industry.id
    const testimonial = await payload.create({
      collection: 'testimonials',
      data: { quote: 'They cut our deploy time in half.', personName: 'C. Lead' },
      overrideAccess: true,
      draft: true,
    })
    testimonialId = testimonial.id

    await payload.create({
      collection: 'caseStudies',
      data: {
        title: 'Fidelity Pilot Case',
        slug: SLUG,
        industry: industryId,
        heroImage: mediaId,
        _status: 'published',
        problem: buildLexical([{ kind: 'p', text: 'PROB-legacy-system-slow' }]) as never,
        solution: buildLexical([{ kind: 'p', text: 'SOL-strangler-fig-migration' }]) as never,
        impact: buildLexical([{ kind: 'p', text: 'IMP-daily-deploys' }]) as never,
        metrics: [
          { number: '50%', label: 'METRIC-faster-deploys', context: 'CTX-over-90-days' },
          { number: '3x', label: 'METRIC-release-frequency' },
        ],
        technologies: [{ label: 'TECH-typescript' }, { label: 'TECH-postgres' }],
        testimonial: testimonialId,
      },
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    await payload.delete({
      collection: 'caseStudies',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'industries',
      where: { id: { equals: industryId } },
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
      collection: 'caseStudies',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
      draft: true,
      depth: 0,
      limit: 1,
    })
    const layout = composeCaseStudyLayout(docs[0] as unknown as Record<string, unknown>)
    await upsertBySlug({
      payload,
      collection: 'caseStudies',
      slug: SLUG,
      data: { slug: SLUG, layout: layout as unknown[] },
      draft: false,
    })
    return readLayout('caseStudies', SLUG)
  }

  it('composes the documented block order with no content lost (SC-003)', async () => {
    const layout = await runComposeOnce()
    expect(blockTypesOf(layout)).toEqual([
      'content',
      'content',
      'content',
      'metric-display',
      'metric-display',
      'tech-stack',
      'testimonial-block',
    ])
    const json = JSON.stringify(layout)
    for (const marker of [
      'PROB-legacy-system-slow',
      'SOL-strangler-fig-migration',
      'IMP-daily-deploys',
      'METRIC-faster-deploys',
      'CTX-over-90-days',
      'METRIC-release-frequency',
      'TECH-typescript',
      'TECH-postgres',
    ]) {
      expect(json).toContain(marker)
    }
    const tb = layout.find((b) => b.blockType === 'testimonial-block') as { testimonial?: unknown }
    expect(tb?.testimonial).toBe(testimonialId)
  })

  it('is idempotent — a second run yields an identical layout (SC-004)', async () => {
    const first = await runComposeOnce()
    const second = await runComposeOnce()
    expect(stripIds(second)).toEqual(stripIds(first))
  })
})

// ---------------------------------------------------------------------------
// US2 — Services (Phase D). SC-003 fidelity + SC-004 idempotency.
// ---------------------------------------------------------------------------
describe('services field→layout composer (US2)', () => {
  const SLUG = 'compose-fidelity-service'
  let pillarId: string | number

  beforeAll(async () => {
    const pillar = await payload.create({
      collection: 'servicePillars',
      data: { title: 'Engineering', slug: `${SLUG}-pillar`, _status: 'published' },
      overrideAccess: true,
    })
    pillarId = pillar.id
    await payload.create({
      collection: 'services',
      data: {
        title: 'Fidelity Pilot Service',
        slug: SLUG,
        pillar: pillarId,
        _status: 'published',
        description: buildLexical([
          { kind: 'p', text: 'SVC-DESC-platform-modernization' },
        ]) as never,
        approach: buildLexical([{ kind: 'p', text: 'SVC-APPROACH-incremental' }]) as never,
        deliverables: [
          { label: 'SVC-DELIV-roadmap' },
          { label: 'SVC-DELIV-pipeline' },
          { label: 'SVC-DELIV-runbook' },
        ],
        faq: [
          {
            question: 'FAQ-Q-how-long',
            answer: buildLexical([{ kind: 'p', text: 'FAQ-A-four-weeks' }]) as never,
          },
          {
            question: 'FAQ-Q-pricing',
            answer: buildLexical([{ kind: 'p', text: 'FAQ-A-fixed-fee' }]) as never,
          },
        ],
      },
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    await payload.delete({
      collection: 'services',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'servicePillars',
      where: { id: { equals: pillarId } },
      overrideAccess: true,
    })
  })

  const runComposeOnce = async (): Promise<BlockLike[]> => {
    const { docs } = await payload.find({
      collection: 'services',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
      draft: true,
      depth: 0,
      limit: 1,
    })
    const layout = composeServiceLayout(docs[0] as unknown as Record<string, unknown>)
    await upsertBySlug({
      payload,
      collection: 'services',
      slug: SLUG,
      data: { slug: SLUG, layout: layout as unknown[] },
      draft: false,
    })
    return readLayout('services', SLUG)
  }

  it('composes the documented block order with no content lost (SC-003)', async () => {
    const layout = await runComposeOnce()
    expect(blockTypesOf(layout)).toEqual([
      'content',
      'content',
      'deliverables',
      'faq',
      'contact-cta',
    ])
    const json = JSON.stringify(layout)
    for (const marker of [
      'SVC-DESC-platform-modernization',
      'SVC-APPROACH-incremental',
      'SVC-DELIV-roadmap',
      'SVC-DELIV-pipeline',
      'SVC-DELIV-runbook',
      'FAQ-Q-how-long',
      'FAQ-A-four-weeks',
      'FAQ-Q-pricing',
      'FAQ-A-fixed-fee',
    ]) {
      expect(json).toContain(marker)
    }
  })

  it('is idempotent — a second run yields an identical layout (SC-004)', async () => {
    const first = await runComposeOnce()
    const second = await runComposeOnce()
    expect(stripIds(second)).toEqual(stripIds(first))
  })
})

// ---------------------------------------------------------------------------
// US2 — Team members (Phase E). SC-003 fidelity + SC-004 idempotency.
// ---------------------------------------------------------------------------
describe('team members field→layout composer (US2)', () => {
  const SLUG = 'compose-fidelity-member'
  let mediaId: string | number

  beforeAll(async () => {
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Member photo' },
      file: {
        data: TINY_PNG,
        mimetype: 'image/png',
        name: `${SLUG}-photo.png`,
        size: TINY_PNG.length,
      },
      overrideAccess: true,
    })
    mediaId = media.id
    await payload.create({
      collection: 'teamMembers',
      data: {
        name: 'Fidelity Pilot Member',
        slug: SLUG,
        title: 'Principal Engineer',
        photo: mediaId,
        _status: 'published',
        bio: buildLexical([{ kind: 'p', text: 'BIO-twenty-years-experience' }]) as never,
        expertise: [{ label: 'EXP-typescript' }, { label: 'EXP-postgres' }, { label: 'EXP-aws' }],
        certifications: [{ label: 'CERT-aws-solutions-architect' }],
        education: [{ degree: 'EDU-bs-cs', institution: 'EDU-state-university' }],
        personalFacts: [
          { label: 'FACT-trail-runner' },
          { label: 'FACT-coffee-roaster' },
          { label: 'FACT-volunteers' },
        ],
        quote: 'QUOTE-build-for-the-next-decade',
      },
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    await payload.delete({
      collection: 'teamMembers',
      where: { slug: { equals: SLUG } },
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
      collection: 'teamMembers',
      where: { slug: { equals: SLUG } },
      overrideAccess: true,
      draft: true,
      depth: 0,
      limit: 1,
    })
    const layout = composeTeamMemberLayout(docs[0] as unknown as Record<string, unknown>)
    await upsertBySlug({
      payload,
      collection: 'teamMembers',
      slug: SLUG,
      data: { slug: SLUG, layout: layout as unknown[] },
      draft: false,
    })
    return readLayout('teamMembers', SLUG)
  }

  it('composes the documented block order with no content lost (SC-003)', async () => {
    const layout = await runComposeOnce()
    expect(blockTypesOf(layout)).toEqual([
      'content', // bio
      'deliverables', // expertise (3 items)
      'content', // certifications
      'content', // education
      'key-takeaways', // personalFacts (3 items)
      'content', // quote
    ])
    const json = JSON.stringify(layout)
    for (const marker of [
      'BIO-twenty-years-experience',
      'EXP-typescript',
      'EXP-postgres',
      'EXP-aws',
      'CERT-aws-solutions-architect',
      'EDU-bs-cs',
      'EDU-state-university',
      'FACT-trail-runner',
      'FACT-coffee-roaster',
      'FACT-volunteers',
      'QUOTE-build-for-the-next-decade',
    ]) {
      expect(json).toContain(marker)
    }
  })

  it('is idempotent — a second run yields an identical layout (SC-004)', async () => {
    const first = await runComposeOnce()
    const second = await runComposeOnce()
    expect(stripIds(second)).toEqual(stripIds(first))
  })
})

// ---------------------------------------------------------------------------
// US5 (Phase F) — the homepage GLOBAL field→layout composer. composeHomepageLayout
// is a pure function (no DB), so fidelity + idempotency are asserted directly on
// a synthetic global record (the relation fields carry bare ids at depth 0, the
// shape the composer reads). The global write/read path is exercised by the e2e
// (tests/e2e/blocks/homepage-compose) and the real composer run (T069).
// ---------------------------------------------------------------------------
describe('homepage global field→layout composer (US5)', () => {
  // A fully-populated homepage: every deprecated field present so the mapping
  // emits all six blocks in the documented order.
  const homepageRecord = {
    _status: 'published',
    hero: {
      headline: 'HP-headline-local-partner',
      subheadline: 'HP-sub-better-tomorrow',
      backgroundImage: 11,
      cta: { label: 'HP-cta-get-started', url: '/services' },
    },
    stats: [
      { number: '25', suffix: '+', label: 'HP-stat-years' },
      { number: '500', suffix: '+', label: 'HP-stat-projects' },
      { number: '10000', suffix: '+', label: 'HP-stat-lives' },
    ],
    featuredCaseStudy: 22,
    brandTeaser: {
      headline: 'HP-brand-headline-purpose',
      body: 'HP-brand-body-innovate-implement-deliver',
      linkLabel: 'HP-brand-link-read-story',
      linkUrl: '/about/our-story',
      image: 33,
    },
    clientLogos: [{ logo: 41 }, { logo: 42 }, { logo: 43 }, { logo: 44 }],
    featuredTestimonials: [51, 52],
  }

  it('composes the documented block order with no content lost (SC-003)', () => {
    const layout = composeHomepageLayout(homepageRecord)
    expect(blockTypesOf(layout as BlockLike[])).toEqual([
      'homepage-hero',
      'stats-bar',
      'featured-case-study',
      'brand-teaser',
      'client-logo-grid',
      'featured-testimonials',
    ])
    const json = JSON.stringify(layout)
    for (const marker of [
      'HP-headline-local-partner',
      'HP-sub-better-tomorrow',
      'HP-cta-get-started',
      'HP-stat-years',
      'HP-stat-projects',
      'HP-stat-lives',
      'HP-brand-headline-purpose',
      'HP-brand-body-innovate-implement-deliver',
      'HP-brand-link-read-story',
    ]) {
      expect(json).toContain(marker)
    }
    // Relations are carried as ids.
    const hero = layout.find((b) => b.blockType === 'homepage-hero') as {
      primaryCta?: { label?: string; url?: string }
      secondaryCta?: { label?: string; url?: string }
      backgroundImage?: unknown
    }
    expect(hero?.primaryCta).toEqual({ label: 'HP-cta-get-started', url: '/services' })
    // The block requires a secondary CTA the global does not carry — a documented default.
    expect(hero?.secondaryCta?.label).toBeTruthy()
    expect(hero?.secondaryCta?.url).toBeTruthy()
    expect(hero?.backgroundImage).toBe(11)
    const fcs = layout.find((b) => b.blockType === 'featured-case-study') as { caseStudy?: unknown }
    expect(fcs?.caseStudy).toBe(22)
    const ft = layout.find((b) => b.blockType === 'featured-testimonials') as {
      testimonials?: unknown
    }
    expect(ft?.testimonials).toEqual([51, 52])
  })

  it('is idempotent — a second run yields an identical layout (SC-004)', () => {
    expect(stripIds(composeHomepageLayout(homepageRecord))).toEqual(
      stripIds(composeHomepageLayout(homepageRecord)),
    )
  })

  it('falls back to logo-bar / testimonial-block below the grid minRows', () => {
    const sparse = composeHomepageLayout({
      ...homepageRecord,
      clientLogos: [{ logo: 41 }, { logo: 42 }],
      featuredTestimonials: [51],
    })
    const types = blockTypesOf(sparse as BlockLike[])
    expect(types).toContain('logo-bar')
    expect(types).not.toContain('client-logo-grid')
    expect(types).toContain('testimonial-block')
    expect(types).not.toContain('featured-testimonials')
  })

  it('caps stats at the stats-bar maxRows (5) — >5 degrades to a content line, no stat lost', () => {
    const overflow = composeHomepageLayout({
      ...homepageRecord,
      stats: Array.from({ length: 7 }, (_, i) => ({
        number: String(i + 1),
        label: `HP-overflow-stat-${i + 1}`,
      })),
    })
    const types = blockTypesOf(overflow as BlockLike[])
    // 7 stats can't satisfy maxRows 5 → no stats-bar (which would fail validation).
    expect(types).not.toContain('stats-bar')
    // Every stat is still present (preserved as a content line — SC-003).
    const json = JSON.stringify(overflow)
    for (let i = 1; i <= 7; i++) expect(json).toContain(`HP-overflow-stat-${i}`)
  })
})
