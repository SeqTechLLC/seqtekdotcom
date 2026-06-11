import type { CollectionAfterChangeHook, GlobalAfterChangeHook, PayloadRequest } from 'payload'
import { revalidateTag } from 'next/cache'

import { invalidateCloudFrontPaths } from '../../lib/cloudfront/invalidate'

interface DocLike {
  _status?: 'draft' | 'published'
  slug?: string
  [key: string]: unknown
}

/**
 * Resolve a service's pillar slug from the doc for the nested
 * `/services/[pillar]/[slug]` path (drift #1 / research §D4). Reads a populated
 * `pillar` relationship object's `.slug`, or a `pillarSlug` the afterChange
 * hook injects after fetching the pillar (the hook sees `pillar` as an ID).
 */
const resolvePillarSlug = (doc: DocLike): string | undefined => {
  const pillar = doc.pillar
  if (pillar && typeof pillar === 'object' && 'slug' in pillar) {
    const slug = (pillar as { slug?: unknown }).slug
    if (typeof slug === 'string' && slug.length > 0) return slug
  }
  return typeof doc.pillarSlug === 'string' && doc.pillarSlug.length > 0
    ? doc.pillarSlug
    : undefined
}

/**
 * Extract a service's pillar relationship ID. At afterChange depth `pillar` is
 * an ID; the populated-object form is handled defensively. Used to detect a
 * pillar *move* so the previous pillar's now-stale paths get busted too.
 */
const pillarIdOf = (doc: DocLike): string | number | undefined => {
  const pillar = doc.pillar
  if (typeof pillar === 'number' || typeof pillar === 'string') return pillar
  if (pillar && typeof pillar === 'object' && 'id' in pillar) {
    const id = (pillar as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return undefined
}

interface PreviousDocLike {
  _status?: 'draft' | 'published'
  slug?: string
  pillar?: unknown
  pillarSlug?: string
  [key: string]: unknown
}

export interface RevalidatePlan {
  tags: string[]
  paths: string[]
}

/**
 * Build the (tag, path) plan for a given collection/document. Returns empty
 * arrays for documents that shouldn't bust caches (e.g., draft saves that
 * never transition through published).
 */
export const buildRevalidatePlan = (
  collection: string,
  doc: DocLike,
  previousDoc?: PreviousDocLike,
): RevalidatePlan => {
  // Non-draftable collections (categories, teamMembers, testimonials) and
  // un-versioned globals have no `_status` — every save is a publish, so the
  // draft-skip guard only applies when `_status` is actually present.
  const hasStatus = doc._status !== undefined || previousDoc?._status !== undefined
  if (hasStatus) {
    const isPublished = doc._status === 'published'
    const wasPublished = previousDoc?._status === 'published'
    if (!isPublished && !wasPublished) return { tags: [], paths: [] }
  }

  const slug = typeof doc.slug === 'string' ? doc.slug : undefined
  const oldSlug = previousDoc && typeof previousDoc.slug === 'string' ? previousDoc.slug : undefined
  const slugs = Array.from(new Set([slug, oldSlug].filter((s): s is string => Boolean(s))))

  const detailPaths: string[] = []
  const tags: string[] = [`${collection}_list`]

  for (const s of slugs) {
    switch (collection) {
      case 'pages':
        detailPaths.push(`/${s}`)
        break
      case 'posts':
        detailPaths.push(`/insights/${s}`, '/insights')
        break
      case 'caseStudies':
        detailPaths.push(`/case-studies/${s}`, '/case-studies')
        break
      case 'services': {
        // drift #1 (research §D4): service detail lives at the NESTED path
        // `/services/[pillar]/[slug]`; the pillar landing at `/services/[pillar]`.
        // When a service MOVES pillars, the *previous* pillar's nested + landing
        // paths also go stale — so bust both pillars (the hook resolves the old
        // pillar slug onto `previousDoc.pillarSlug`). Fall back to the flat path
        // only when no pillar resolves (e.g. a minimal test doc) so revalidation
        // still busts something rather than nothing.
        const pillarSlugs = Array.from(
          new Set(
            [resolvePillarSlug(doc), resolvePillarSlug(previousDoc ?? {})].filter(
              (p): p is string => Boolean(p),
            ),
          ),
        )
        if (pillarSlugs.length > 0) {
          for (const p of pillarSlugs) {
            detailPaths.push(`/services/${p}/${s}`, `/services/${p}`)
          }
        } else {
          detailPaths.push(`/services/${s}`)
        }
        break
      }
      case 'servicePillars':
        detailPaths.push(`/services/${s}`, '/services')
        break
      case 'workshops':
        detailPaths.push(`/workshops/${s}`, '/workshops')
        break
      case 'industries':
        detailPaths.push(`/industries/${s}`)
        break
      case 'locations':
        detailPaths.push(`/consulting/${s}`)
        break
      case 'categories':
        detailPaths.push(`/insights/category/${s}`, '/insights')
        break
      default:
        break
    }
    tags.push(`${collection}_${s}`)
  }

  if (
    collection === 'homepage' ||
    collection === 'siteSettings' ||
    collection === 'navigation' ||
    collection === 'testimonials'
  ) {
    detailPaths.push('/')
  }

  return { tags, paths: Array.from(new Set([...detailPaths, '/sitemap.xml'])) }
}

const runRevalidation = async (plan: RevalidatePlan): Promise<void> => {
  if (plan.tags.length === 0 && plan.paths.length === 0) return
  for (const tag of plan.tags) {
    try {
      revalidateTag(tag, { expire: 0 })
    } catch {
      // revalidateTag throws when called outside a request scope in dev — swallow per R-03
    }
  }
  try {
    await invalidateCloudFrontPaths(plan.paths)
  } catch {
    // CloudFront failure must not roll back the editor save.
  }
}

/**
 * At afterChange depth a service's `pillar` is an ID, not a populated object —
 * so `buildRevalidatePlan` can't read the pillar slug for the nested path
 * (drift #1 / research §D4 implementation risk). Resolve it via `req.payload`
 * (the hook's own Payload instance — no `getPayloadInstance`/`server-only`
 * import, which would break the hook's pure unit tests) and inject `pillarSlug`.
 */
const enrichServiceDoc = async (doc: DocLike, req: PayloadRequest): Promise<DocLike> => {
  if (resolvePillarSlug(doc)) return doc
  const pillarId = pillarIdOf(doc)
  if (pillarId === undefined || !req?.payload) return doc
  try {
    const fetched = await req.payload.findByID({
      collection: 'servicePillars',
      id: pillarId,
      depth: 0,
    })
    return fetched?.slug ? { ...doc, pillarSlug: fetched.slug } : doc
  } catch {
    return doc
  }
}

/**
 * Returns an afterChange hook bound to a specific collection slug.
 */
export const revalidateOnChange =
  (collection: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    let enriched = doc as DocLike
    let prev = previousDoc as PreviousDocLike | undefined
    if (collection === 'services') {
      enriched = await enrichServiceDoc(doc as DocLike, req)
      // A pillar move makes the OLD pillar's nested + landing paths stale too.
      // Resolve the previous pillar slug only when the pillar actually changed,
      // so the common no-move save stays a single fetch.
      if (prev && pillarIdOf(prev) !== undefined && pillarIdOf(prev) !== pillarIdOf(enriched)) {
        prev = (await enrichServiceDoc(prev as DocLike, req)) as PreviousDocLike
      }
    }
    const plan = buildRevalidatePlan(collection, enriched, prev)
    await runRevalidation(plan)
    return doc
  }

/**
 * Global variant — Payload's GlobalAfterChangeHook has a different signature.
 */
export const revalidateGlobalOnChange =
  (globalSlug: string): GlobalAfterChangeHook =>
  async ({ doc, previousDoc }) => {
    const plan = buildRevalidatePlan(globalSlug, doc as DocLike, previousDoc as PreviousDocLike)
    await runRevalidation(plan)
    return doc
  }
