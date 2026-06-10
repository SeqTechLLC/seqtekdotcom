import path from 'path'

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { invalidateCloudFrontPaths } from '../../lib/cloudfront/invalidate'

/**
 * CDN invalidation for media files (spec 009 FR-011).
 *
 * With the stable `media/<filename>` key shape (ADR 0008), a same-filename
 * replacement keeps the same S3 key — the "every change mints a new key"
 * cache-busting that ARCHITECTURE §6 relied on under id-prefixed keys is
 * gone. The long-TTL `/media/*` CloudFront behavior would serve the old
 * bytes for up to a year. These hooks close that gap: invalidate the
 * affected paths on file replace and on delete.
 *
 * Deliberate no-ops:
 *   - create: fresh key, nothing cached yet.
 *   - metadata-only update (no incoming file): nothing on S3 changed. The
 *     staging re-key script's `PATCH {prefix}` depends on this no-op.
 *   - no `CLOUDFRONT_DISTRIBUTION_ID`: `invalidateCloudFrontPaths` itself
 *     skips (local dev / CI), same as the page-revalidation hooks.
 *
 * Failure posture matches `revalidateOnChange`: a CloudFront error is logged
 * and swallowed — it must never roll back the editor's mutation.
 */

interface MediaDocLike {
  filename?: string | null
  prefix?: string | null
  sizes?: Record<string, { filename?: string | null } | null | undefined> | null
}

/**
 * URL paths (original + every size variant) for one media doc, derived from
 * the doc's stored prefix exactly like `mediaFileURL` — encoded to match the
 * request URLs CloudFront actually caches.
 */
export const mediaInvalidationPaths = (doc: MediaDocLike): string[] => {
  const filenames = [
    doc.filename,
    ...Object.values(doc.sizes ?? {}).map((size) => size?.filename),
  ].filter((f): f is string => typeof f === 'string' && f.length > 0)
  return filenames.map((f) => `/${path.posix.join(doc.prefix || '', encodeURIComponent(f))}`)
}

type Invalidator = (paths: string[]) => Promise<unknown>

/**
 * Factory with an injectable invalidator: the int suite runs single-fork with
 * `isolate: false` (shared module cache), where `vi.mock` of the cloudfront
 * module is unreliable — an earlier test file booting payload.config caches
 * this module against the real helper. Injection sidesteps mock-identity
 * entirely; production wiring uses the default.
 */
export const makeMediaInvalidationHooks = (
  invalidator: Invalidator = invalidateCloudFrontPaths,
): { afterChange: CollectionAfterChangeHook; afterDelete: CollectionAfterDeleteHook } => {
  const invalidate = async (doc: MediaDocLike): Promise<void> => {
    try {
      await invalidator(mediaInvalidationPaths(doc))
    } catch (err) {
      // CloudFront failure must not roll back the mutation; worst case the
      // edge serves stale bytes until TTL — log so it's visible.
      console.error('[media] CloudFront invalidation failed', err)
    }
  }

  return {
    afterChange: async ({ doc, operation, previousDoc, req }) => {
      // Only a genuine file replacement leaves stale bytes behind: update +
      // an incoming file. The previous doc names the keys that were
      // overwritten (same filename) or deleted by the storage plugin
      // (renamed).
      if (operation === 'update' && req?.file && previousDoc) {
        await invalidate(previousDoc as MediaDocLike)
      }
      return doc
    },
    afterDelete: async ({ doc }) => {
      await invalidate(doc as MediaDocLike)
      return doc
    },
  }
}

export const { afterChange: invalidateMediaOnChange, afterDelete: invalidateMediaOnDelete } =
  makeMediaInvalidationHooks()
