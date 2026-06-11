import { getPayload, type Payload } from 'payload'

import config from '../../../src/payload.config'
import type { CaseStudy } from '../../../src/payload-types'

/**
 * spec 007 T004 — shared seeded-route fixture for the full in-scope route set
 * (contracts/a11y-perf-acceptance.md C-1). Extends the marquee-pages Local-API
 * seeding pattern into a reusable helper so the detail routes the empty CI DB
 * 404s render real content. Consumed by US1 (color-contrast sweep, T005) and
 * US2 (full-WCAG sweep + keyboard/landmark/alt, T015–T017).
 *
 * All slugs are namespaced (`a11y-*`) except `/about` + `/localshoring`, whose
 * URLs are fixed by the generic `(frontend)/[slug]` route. Seeding is
 * idempotent (delete-by-slug before create) and `cleanupInScopeRoutes` removes
 * everything it created, so the suite never depends on ambient seed state.
 */

// 1x1 transparent PNG — smallest valid upload for the required image fields.
export const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

/** Minimal valid Payload/Lexical richText value carrying a single paragraph. */
export const lexical = (text: string): NonNullable<CaseStudy['problem']> =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
          ],
        },
      ],
    },
  }) as NonNullable<CaseStudy['problem']>

export interface InScopeSeed {
  caseStudySlug: string
  postSlug: string
  pillarSlug: string
  serviceSlug: string
  workshopSlug: string
  teamSlug: string
  aboutSlug: string
  localshoringSlug: string
  industrySlug: string
  mediaAlt: string
}

export const IN_SCOPE_SEED: InScopeSeed = {
  caseStudySlug: 'a11y-case',
  postSlug: 'a11y-post',
  pillarSlug: 'a11y-pillar',
  serviceSlug: 'a11y-service',
  workshopSlug: 'a11y-workshop',
  teamSlug: 'a11y-member',
  aboutSlug: 'about',
  localshoringSlug: 'localshoring',
  industrySlug: 'a11y-industry',
  mediaAlt: 'a11y in-scope seed image',
}

/**
 * The full in-scope route inventory (contracts C-1). Listing routes render even
 * empty; detail/generic routes need the seeded content above. `/admin` keeps
 * its separate critical/serious-only spec and is intentionally excluded.
 */
export function inScopeRoutes(
  seed: InScopeSeed = IN_SCOPE_SEED,
): { path: string; label: string }[] {
  return [
    { path: '/', label: 'home' },
    { path: '/team', label: 'team' },
    { path: '/case-studies', label: 'case-studies (listing)' },
    { path: `/case-studies/${seed.caseStudySlug}`, label: 'case-study (detail)' },
    { path: '/insights', label: 'insights (listing)' },
    { path: `/insights/${seed.postSlug}`, label: 'insight (detail)' },
    { path: '/services', label: 'services (listing)' },
    { path: `/services/${seed.pillarSlug}`, label: 'service pillar' },
    { path: `/services/${seed.pillarSlug}/${seed.serviceSlug}`, label: 'service detail' },
    { path: '/workshops', label: 'workshops (listing)' },
    { path: `/workshops/${seed.workshopSlug}`, label: 'workshop (detail)' },
    { path: '/privacy-policy', label: 'privacy-policy' },
    { path: `/${seed.aboutSlug}`, label: 'about' },
    { path: `/${seed.localshoringSlug}`, label: 'localshoring' },
  ]
}

export async function getPayloadClient(): Promise<Payload> {
  return getPayload({ config: await config })
}

const del = async (
  payload: Payload,
  collection: Parameters<Payload['delete']>[0]['collection'],
  slugField: string,
  value: string,
) =>
  payload.delete({
    collection,
    where: { [slugField]: { equals: value } },
    overrideAccess: true,
  })

/** Idempotently seed every doc the in-scope detail/generic routes render. */
export async function seedInScopeRoutes(
  payload: Payload,
  seed: InScopeSeed = IN_SCOPE_SEED,
): Promise<void> {
  await cleanupInScopeRoutes(payload, seed)

  const media = await payload.create({
    collection: 'media',
    data: { alt: seed.mediaAlt },
    file: { data: PNG_1x1, mimetype: 'image/png', name: 'a11y-seed.png', size: PNG_1x1.length },
    overrideAccess: true,
  })

  const industry = await payload.create({
    collection: 'industries',
    data: { title: 'Energy', slug: seed.industrySlug },
    overrideAccess: true,
  })

  const member = await payload.create({
    collection: 'teamMembers',
    data: {
      name: 'Avery Consultant',
      slug: seed.teamSlug,
      title: 'Principal Consultant',
      role: 'Engineering',
      photo: media.id,
      isLeadership: true,
      order: 1,
    },
    overrideAccess: true,
  })

  const testimonial = await payload.create({
    collection: 'testimonials',
    data: {
      quote: 'They shipped ahead of schedule and the team levelled up in the process.',
      personName: 'Dana Client',
      personTitle: 'VP Engineering',
      company: 'Acme Energy',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'caseStudies',
    data: {
      title: 'Modernizing a Legacy Platform',
      slug: seed.caseStudySlug,
      subtitle: 'A phased rebuild that cut deploy time in half.',
      industry: industry.id,
      heroImage: media.id,
      problem: lexical('The legacy system shipped quarterly and broke often.'),
      solution: lexical('We introduced CI/CD and a strangler-fig migration.'),
      impact: lexical('Deploys went from quarterly to daily.'),
      metrics: [
        { number: '50%', label: 'Faster deploys' },
        { number: '3x', label: 'Release frequency' },
      ],
      testimonial: testimonial.id,
      _status: 'published',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'posts',
    data: {
      title: 'How we approach localshoring',
      slug: seed.postSlug,
      excerpt: 'A short read on the localshoring delivery model.',
      content: lexical('Localshoring keeps delivery close, aligned, and accountable.'),
      featuredImage: media.id,
      author: member.id,
      _status: 'published',
    },
    overrideAccess: true,
  })

  const pillar = await payload.create({
    collection: 'servicePillars',
    data: {
      title: 'Product Engineering',
      slug: seed.pillarSlug,
      description: lexical('We build and modernize software products.'),
      order: 1,
      _status: 'published',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'services',
    data: {
      title: 'Platform Modernization',
      slug: seed.serviceSlug,
      pillar: pillar.id,
      description: lexical('Incremental modernization of legacy platforms.'),
      deliverables: [{ label: 'Migration roadmap' }, { label: 'CI/CD pipeline' }],
      order: 1,
      _status: 'published',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'workshops',
    data: {
      title: 'Touchstone AI Strategy Workshop',
      slug: seed.workshopSlug,
      description: lexical('A facilitated working session for leadership teams.'),
      audience: lexical('For executives accountable for an AI roadmap.'),
      testimonial: testimonial.id,
      _status: 'published',
    },
    overrideAccess: true,
  })

  // /about — accent-bearing blocks on a real in-scope route: metric-display
  // (text-accent-strong number on green-50) + process-steps (step numbers).
  await payload.create({
    collection: 'pages',
    data: {
      title: 'About SEQTEK',
      slug: seed.aboutSlug,
      layout: [
        {
          blockType: 'metric-display',
          number: '25+',
          label: 'Years in business',
          background: 'accent',
        },
        {
          blockType: 'process-steps',
          heading: 'How we work',
          steps: [
            { title: 'Discover', body: 'We learn the business and its constraints.' },
            { title: 'Deliver', body: 'We ship in small, verifiable increments.' },
          ],
        },
      ],
      _status: 'published',
    },
    overrideAccess: true,
  })

  // /localshoring — comparison-table (the proven marquee shape).
  await payload.create({
    collection: 'pages',
    data: {
      title: 'Localshoring',
      slug: seed.localshoringSlug,
      layout: [
        {
          blockType: 'comparison-table',
          heading: 'Localshoring vs the alternatives',
          columns: [{ label: 'Localshoring' }, { label: 'Offshore' }],
          rows: [{ dimension: 'Time zone', cells: [{ value: 'Same' }, { value: 'Opposite' }] }],
          bestForRow: [{ value: 'Aligned teams' }, { value: 'Lowest hourly rate' }],
        },
      ],
      _status: 'published',
    },
    overrideAccess: true,
  })
}

/** Remove everything `seedInScopeRoutes` created (idempotent). */
export async function cleanupInScopeRoutes(
  payload: Payload,
  seed: InScopeSeed = IN_SCOPE_SEED,
): Promise<void> {
  await del(payload, 'caseStudies', 'slug', seed.caseStudySlug)
  await del(payload, 'posts', 'slug', seed.postSlug)
  await del(payload, 'services', 'slug', seed.serviceSlug)
  await del(payload, 'servicePillars', 'slug', seed.pillarSlug)
  await del(payload, 'workshops', 'slug', seed.workshopSlug)
  await del(payload, 'teamMembers', 'slug', seed.teamSlug)
  await del(payload, 'pages', 'slug', seed.aboutSlug)
  await del(payload, 'pages', 'slug', seed.localshoringSlug)
  await del(payload, 'industries', 'slug', seed.industrySlug)
  await payload.delete({
    collection: 'testimonials',
    where: { personName: { equals: 'Dana Client' } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'media',
    where: { alt: { equals: seed.mediaAlt } },
    overrideAccess: true,
  })
}
