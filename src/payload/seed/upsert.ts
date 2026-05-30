import type { CollectionSlug, Payload } from 'payload'

import type { MigrationLogger } from './log'

export type UpsertOperation = 'create' | 'update' | 'skip'

export interface UpsertResult<TData = Record<string, unknown>> {
  collection: CollectionSlug
  slug: string
  operation: UpsertOperation
  id: string | number | null
  data: TData
}

export interface UpsertOptions<TData> {
  payload: Payload
  collection: CollectionSlug
  /** Final, post-rewrite slug. Used both as the lookup key and as the data's `slug` field. */
  slug: string
  data: TData
  /** When true, no writes happen; the planned operation is returned for stdout. */
  dryRun?: boolean
  /** Optional logger so the helper can surface parse/lookup gaps. */
  logger?: MigrationLogger
}

/**
 * Idempotent upsert keyed by `slug` per R-09 / FR-030. Goes through the
 * Payload Local API so access control, hooks (slugFromTitle,
 * enforceDraftWhenScheduled, revalidateOnChange), and required-field
 * validation fire exactly as they would in `/admin`. Re-running the seed
 * therefore produces zero new rows for any previously seeded record.
 *
 * All writes use `draft: true` + `overrideAccess: true` so the seed can
 * land records that intentionally have null required relationships
 * (heroImage, author, industry) — those gaps are surfaced via
 * `migration-errors.log` and resolved by the editor before publish.
 */
export async function upsertBySlug<TData extends { slug?: string }>({
  payload,
  collection,
  slug,
  data,
  dryRun = false,
  logger,
}: UpsertOptions<TData>): Promise<UpsertResult<TData>> {
  if (!slug) {
    logger?.log({
      level: 'ERROR',
      kind: 'PARSE_ERROR',
      collection,
      slug: '<empty>',
      detail: 'upsertBySlug called with empty slug; record skipped',
    })
    return { collection, slug, operation: 'skip', id: null, data }
  }

  const merged = { ...data, slug } as TData

  if (dryRun) {
    const existing = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      draft: true,
    })
    return {
      collection,
      slug,
      operation: existing.totalDocs > 0 ? 'update' : 'create',
      id: existing.docs[0]?.id ?? null,
      data: merged,
    }
  }

  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    draft: true,
  })

  if (existing.totalDocs > 0) {
    const found = existing.docs[0]
    const updated = await payload.update({
      collection,
      id: found.id,
      data: merged as never,
      overrideAccess: true,
      draft: true,
    })
    return { collection, slug, operation: 'update', id: updated.id, data: merged }
  }

  const created = await payload.create({
    collection,
    data: merged as never,
    overrideAccess: true,
    draft: true,
  })
  return { collection, slug, operation: 'create', id: created.id, data: merged }
}
