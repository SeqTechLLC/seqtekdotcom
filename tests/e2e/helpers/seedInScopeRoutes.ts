import { getPayload, type Payload } from 'payload'

import config from '../../../src/payload.config'
import type { Post } from '../../../src/payload-types'

/**
 * spec 007 T004 — shared seeded-route fixture for the full in-scope route set
 * (contracts/a11y-perf-acceptance.md C-1). Extends the marquee-pages Local-API
 * seeding pattern into a reusable helper so the detail routes the empty CI DB
 * 404s render real content. Consumed by US1 (color-contrast sweep, T005) and
 * US2 (full-WCAG sweep + keyboard/landmark/alt, T015–T017).
 *
 * All slugs are namespaced (`a11y-*`) except `/our-story` + `/localshoring`,
 * whose URLs are fixed by the generic `(frontend)/[slug]` route. Seeding is
 * idempotent (delete-by-slug before create) and `cleanupInScopeRoutes` removes
 * everything it created, so the suite never depends on ambient seed state.
 */

// 1x1 transparent PNG — smallest valid upload for the required image fields.
export const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQI12NgYGBgAAAABQABXvMqOgAAAABJRU5ErkJggg==',
  'base64',
)

/** Minimal valid Payload/Lexical richText value carrying a single paragraph. */
export const lexical = (text: string): NonNullable<Post['content']> =>
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
  }) as NonNullable<Post['content']>

export interface InScopeSeed {
  caseStudySlug: string
  postSlug: string
  workshopSlug: string
  teamSlug: string
  partnerSlug: string
  storySlug: string
  localshoringSlug: string
  industrySlug: string
  mediaAlt: string
}

export const IN_SCOPE_SEED: InScopeSeed = {
  caseStudySlug: 'a11y-case',
  postSlug: 'a11y-post',
  workshopSlug: 'a11y-workshop',
  teamSlug: 'a11y-member',
  partnerSlug: 'a11y-partner',
  storySlug: 'our-story',
  localshoringSlug: 'localshoring',
  industrySlug: 'a11y-industry',
  mediaAlt: 'a11y in-scope seed image',
}

/**
 * ROADMAP SVC-2. `/services` is still a block-composed Page looked up by a fixed
 * slug (`services/page.tsx` hard-codes it), so it stays here. The leaves and
 * groups below it are no longer Pages: `/services/<slug>` resolves off the
 * `services` and `servicePillars` collections, so a slug needs no code change.
 */
const SERVICE_OVERVIEW_PAGE_SLUG = 'service-overview'

/** Leaf services — `/services/<slug>` resolves these off the `services` collection. */
const SERVICE_SLUGS = ['localshoring', 'ai-integration', 'digital-transformation'] as const

/**
 * A group — same flat namespace as a leaf, resolved off `servicePillars`. Seeded
 * so the group branch of `/services/[slug]` gets the same a11y sweep the leaf
 * branch does; without it half the route would ship unexercised.
 */
const SERVICE_GROUP_SLUG = 'delivery-and-change'

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
    { path: '/services', label: 'services (overview)' },
    ...SERVICE_SLUGS.map((slug) => ({
      path: `/services/${slug}`,
      label: `service leaf (${slug})`,
    })),
    // Same flat namespace, different collection — SVC-2's group branch.
    { path: `/services/${SERVICE_GROUP_SLUG}`, label: 'service group' },
    { path: '/workshops', label: 'workshops (listing)' },
    { path: `/workshops/${seed.workshopSlug}`, label: 'workshop (detail)' },
    // ADR 0009 metadata collection (feat/partners-accesseva) — the index is new
    // UI (PartnerGrid) and the detail body is entirely block-composed, so both
    // ends of the route pair are swept.
    { path: '/partners', label: 'partners (listing)' },
    { path: `/partners/${seed.partnerSlug}`, label: 'partner (detail)' },
    { path: '/privacy-policy', label: 'privacy-policy' },
    { path: '/terms-of-service', label: 'terms-of-service' },
    { path: `/${seed.storySlug}`, label: 'our-story' },
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

  const caseStudy = await payload.create({
    collection: 'caseStudies',
    data: {
      title: 'Modernizing a Legacy Platform',
      slug: seed.caseStudySlug,
      subtitle: 'A phased rebuild that cut deploy time in half.',
      industry: industry.id,
      heroImage: media.id,
      // spec 011: the legacy problem/solution/impact/metrics fields were
      // dropped (FR-007). The body is the block layout, same as production.
      layout: [
        {
          blockType: 'content',
          body: lexical('The legacy system shipped quarterly and broke often.'),
        },
        {
          blockType: 'content',
          body: lexical('We introduced CI/CD and a strangler-fig migration.'),
        },
        {
          blockType: 'content',
          body: lexical('Deploys went from quarterly to daily.'),
        },
        { blockType: 'metric-display', number: '50%', label: 'Faster deploys' },
        { blockType: 'metric-display', number: '3x', label: 'Release frequency' },
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

  // /services + /services/<offering> — the four block-composed Pages of the
  // four-offering IA (feat/services-restructure). These are GENERIC test
  // fixtures (a representative mix of blocks), not the real marketing copy —
  // the real services content lives in the gitignored docs/content-drafts JSON
  // loaded by tools/payload-seed. The block TYPES get full a11y coverage from
  // the showcase seeder; here we only need each route to 200 and pass the
  // sweep. overview + digital-transformation keep a featured-case-study block
  // pointing at the case study seeded just above, so those pages resolve a real
  // study and never read-timeout on an unseeded id.
  const servicePage = (
    title: string,
    slug: string,
    layout: Record<string, unknown>[],
  ): Promise<unknown> =>
    payload.create({
      collection: 'pages',
      data: { title, slug, layout: layout as never, _status: 'published' },
      overrideAccess: true,
    })

  // A leaf is a `services` doc now, not a Page. It leads with a hero because the
  // route owns no <h1> — the body supplies it, same as partners.
  const serviceDoc = (
    title: string,
    slug: string,
    body: Record<string, unknown>[],
  ): Promise<unknown> =>
    payload.create({
      collection: 'services',
      data: {
        title,
        slug,
        layout: [
          { blockType: 'hero', variant: 'text-only', alignment: 'left', headline: title },
          ...body,
        ] as never,
        _status: 'published',
      },
      overrideAccess: true,
    })

  await servicePage('Services', SERVICE_OVERVIEW_PAGE_SLUG, [
    { blockType: 'content', body: lexical('Four ways SEQTEK helps.') },
    {
      blockType: 'nav-cards',
      cards: [
        {
          title: 'Localshoring',
          description: 'A senior US team.',
          linkUrl: '/services/localshoring',
        },
        { title: 'Workshops', description: 'Start with a workshop.', linkUrl: '/workshops' },
      ],
    },
    { blockType: 'featured-case-study', heading: 'Featured work', caseStudy: caseStudy.id },
  ])

  const localshoring = await serviceDoc('Localshoring', 'localshoring', [
    {
      blockType: 'content',
      body: lexical('A senior US engineering team that plugs into your roadmap.'),
    },
    {
      blockType: 'comparison-table',
      heading: 'Localshoring vs the alternatives',
      columns: [{ label: 'Localshoring' }, { label: 'Offshore' }],
      rows: [{ dimension: 'Time zone', cells: [{ value: 'Same' }, { value: 'Opposite' }] }],
      bestForRow: [{ value: 'Aligned teams' }, { value: 'Lowest hourly rate' }],
    },
  ])

  const aiIntegration = await serviceDoc('AI Integration', 'ai-integration', [
    { blockType: 'content', body: lexical('Where AI fits your business, and where it does not.') },
    {
      blockType: 'process-steps',
      heading: 'How an engagement runs',
      steps: [
        { title: 'Map the workflow', body: 'We learn how the work happens today.' },
        { title: 'Prove it small', body: 'A narrow, measurable pilot.' },
      ],
    },
  ])

  await serviceDoc('Digital Transformation', 'digital-transformation', [
    {
      blockType: 'content',
      body: lexical('Custom software plus the change management to make it stick.'),
    },
    { blockType: 'featured-case-study', heading: 'Featured work', caseStudy: caseStudy.id },
  ])

  // The group holds an ordered list of its services (SVC-2) — the relation lives
  // here, not on the leaf, so a leaf can sit under more than one group.
  await payload.create({
    collection: 'servicePillars',
    data: {
      title: 'Delivery and Change',
      slug: SERVICE_GROUP_SLUG,
      items: [(localshoring as { id: number }).id, (aiIntegration as { id: number }).id] as never,
      layout: [
        {
          blockType: 'hero',
          variant: 'text-only',
          alignment: 'left',
          headline: 'Delivery and Change',
          subheadline: 'How an engagement actually runs.',
        },
        { blockType: 'service-cards', source: 'manual' },
      ] as never,
      _status: 'published',
    },
    overrideAccess: true,
  })

  // /partners + /partners/<slug>. The body leads with a hero because the detail
  // route has no route-owned <h1> — the h1 is the hero's (see partnerSkeleton).
  await payload.create({
    collection: 'partners',
    data: {
      name: 'Northwind Analytics',
      slug: seed.partnerSlug,
      summary: 'Document intelligence for regulated industries.',
      logo: media.id,
      url: 'https://example.com/',
      order: 1,
      layout: [
        {
          blockType: 'hero',
          variant: 'text-only',
          alignment: 'left',
          eyebrow: 'SEQTEK partner',
          headline: 'SEQTEK and Northwind Analytics',
          subheadline: 'What the partnership gives clients.',
        },
        { blockType: 'content', body: lexical('Why we work with them.') },
      ] as never,
      _status: 'published',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'workshops',
    data: {
      title: 'Touchstone AI Strategy Workshop',
      slug: seed.workshopSlug,
      // spec 011: legacy description/audience dropped (FR-007) — body is blocks.
      layout: [
        {
          blockType: 'content',
          body: lexical('A facilitated working session for leadership teams.'),
        },
        {
          blockType: 'content',
          body: lexical('For executives accountable for an AI roadmap.'),
        },
      ],
      testimonial: testimonial.id,
      _status: 'published',
    },
    overrideAccess: true,
  })

  // /our-story — accent-bearing blocks on a real in-scope route: metric-display
  // (text-accent-strong number on green-50) + process-steps (step numbers).
  await payload.create({
    collection: 'pages',
    data: {
      title: 'Our Story',
      slug: seed.storySlug,
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
  await del(payload, 'workshops', 'slug', seed.workshopSlug)
  await del(payload, 'teamMembers', 'slug', seed.teamSlug)
  await del(payload, 'partners', 'slug', seed.partnerSlug)
  await del(payload, 'pages', 'slug', seed.storySlug)
  await del(payload, 'pages', 'slug', seed.localshoringSlug)
  await del(payload, 'pages', 'slug', SERVICE_OVERVIEW_PAGE_SLUG)
  // SVC-2: the leaves and the group are collection docs, not Pages.
  await del(payload, 'servicePillars', 'slug', SERVICE_GROUP_SLUG)
  for (const slug of SERVICE_SLUGS) {
    await del(payload, 'services', 'slug', slug)
  }
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
