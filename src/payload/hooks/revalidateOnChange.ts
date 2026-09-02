import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'
import { revalidateTag } from 'next/cache'

import { invalidateCloudFrontPaths } from '../../lib/cloudfront/invalidate'

interface DocLike {
  _status?: 'draft' | 'published'
  slug?: string
  [key: string]: unknown
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
  // Non-draftable collections (categories, testimonials) and un-versioned
  // globals have no `_status` — every save is a publish, so the draft-skip
  // guard only applies when `_status` is actually present. (teamMembers gained
  // drafts in spec 010 US2, so it now carries `_status` like the other draftable types.)
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
      case 'services':
        // SVC-2: one flat namespace. A service, the group holding it and the
        // axis page above it are all `/services/<slug>`. The nested
        // `/services/[pillar]/[slug]` IA this used to bust was retired in #79;
        // its last machinery went with the servicePillars merge.
        detailPaths.push(`/services/${s}`, '/services')
        break
      case 'workshops':
        detailPaths.push(`/workshops/${s}`, '/workshops')
        break
      case 'teamMembers':
        // spec 010 US2 (Phase E): teamMembers gains a `/team/[slug]` detail route.
        detailPaths.push(`/team/${s}`, '/team')
        break
      case 'partners':
        // ADR 0009 metadata collection: the detail route plus the index it feeds.
        detailPaths.push(`/partners/${s}`, '/partners')
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

  // spec 011 T016: `siteSettings` / `navigation` dropped from this list with
  // the globals themselves — site chrome is code-owned now (ADR 0010), so a
  // chrome change is a deploy, not a publish, and nothing to revalidate.
  if (collection === 'homepage' || collection === 'testimonials') {
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
 * Returns an afterChange hook bound to a specific collection slug.
 */
export const revalidateOnChange =
  (collection: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc }) => {
    const enriched = doc as DocLike
    const prev = previousDoc as PreviousDocLike | undefined
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
