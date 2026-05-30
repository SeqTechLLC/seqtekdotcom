import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'

let cachedPayload: Payload | null = null

async function payloadInstance(): Promise<Payload> {
  if (!cachedPayload) {
    cachedPayload = await getPayload({ config: await config })
  }
  return cachedPayload
}

/**
 * Lightweight helpers for seeding minimal draft documents in the four
 * preview-supported collections. Used by the spec 003 US2 preview E2E tests
 * to populate fixtures the `/preview/:collection/:slug` route can resolve.
 *
 * Each helper is idempotent on slug: it deletes any prior fixture with the
 * same slug before creating the new draft so reruns are clean.
 */

export interface SeededDoc {
  id: string
  slug: string
}

async function deleteBySlug(collection: string, slug: string): Promise<void> {
  const payload = await payloadInstance()
  await payload.delete({
    collection: collection as 'pages',
    where: { slug: { equals: slug } },
    overrideAccess: true,
  })
}

// Payload only relaxes required-field validation for a `create` when `draft:
// true` is passed alongside the data. Without it, Posts (featuredImage,
// author) and CaseStudies (industry, etc.) would refuse to save even as
// `_status: 'draft'`. The route handler under test queries with `draft:
// true`, so draft-only fixtures are the correct shape to exercise.
const DRAFT_CREATE_OPTS = { draft: true, overrideAccess: true } as const

export async function seedDraftPage(slug: string, title?: string): Promise<SeededDoc> {
  const payload = await payloadInstance()
  await deleteBySlug('pages', slug)
  const doc = await payload.create({
    collection: 'pages',
    data: { title: title ?? `Draft page ${slug}`, slug },
    ...DRAFT_CREATE_OPTS,
  })
  return { id: String(doc.id), slug: doc.slug ?? slug }
}

export async function seedDraftPost(slug: string, title?: string): Promise<SeededDoc> {
  const payload = await payloadInstance()
  await deleteBySlug('posts', slug)
  const doc = await payload.create({
    collection: 'posts',
    data: { title: title ?? `Draft post ${slug}`, slug },
    ...DRAFT_CREATE_OPTS,
  })
  return { id: String(doc.id), slug: doc.slug ?? slug }
}

export async function seedDraftCaseStudy(slug: string, title?: string): Promise<SeededDoc> {
  const payload = await payloadInstance()
  await deleteBySlug('caseStudies', slug)
  const doc = await payload.create({
    collection: 'caseStudies',
    data: { title: title ?? `Draft case study ${slug}`, slug },
    ...DRAFT_CREATE_OPTS,
  })
  return { id: String(doc.id), slug: doc.slug ?? slug }
}

export interface SeededService extends SeededDoc {
  pillarSlug: string
  pillarId: string
}

export async function seedDraftService(
  slug: string,
  options: { pillarSlug?: string; title?: string } = {},
): Promise<SeededService> {
  const payload = await payloadInstance()
  const pillarSlug = options.pillarSlug ?? `preview-pillar-${slug}`

  // Reuse or seed the pillar so multiple services with the same pillar are
  // safe across tests. servicePillars don't require draft state — they
  // anchor public navigation.
  const existing = await payload.find({
    collection: 'servicePillars',
    where: { slug: { equals: pillarSlug } },
    limit: 1,
    overrideAccess: true,
    draft: true,
  })
  const pillarDoc =
    existing.docs[0] ??
    (await payload.create({
      collection: 'servicePillars',
      data: {
        title: `Pillar ${pillarSlug}`,
        slug: pillarSlug,
      },
      ...DRAFT_CREATE_OPTS,
    }))

  await deleteBySlug('services', slug)
  const doc = await payload.create({
    collection: 'services',
    data: {
      title: options.title ?? `Draft service ${slug}`,
      slug,
      pillar: pillarDoc.id,
    },
    ...DRAFT_CREATE_OPTS,
  })

  return {
    id: String(doc.id),
    slug: doc.slug ?? slug,
    pillarSlug,
    pillarId: String(pillarDoc.id),
  }
}

export async function cleanupDraftDoc(collection: string, slug: string): Promise<void> {
  await deleteBySlug(collection, slug)
}

export async function cleanupServicePillar(slug: string): Promise<void> {
  const payload = await payloadInstance()
  await payload.delete({
    collection: 'servicePillars',
    where: { slug: { equals: slug } },
    overrideAccess: true,
  })
}
