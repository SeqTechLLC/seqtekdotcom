import path from 'path'

import type { Plugin } from 'payload'
import { s3Storage } from '@payloadcms/storage-s3'

/**
 * The S3 storage plugin is ALWAYS registered; only its runtime behavior is
 * toggled by environment. With `S3_BUCKET` + `S3_REGION` set (staging/prod) the
 * S3 adapter is active and local-filesystem storage is disabled; without them
 * (local dev, CI) the plugin is `enabled: false`, so uploads fall back to the
 * local filesystem (FR-022) and no S3 access is needed.
 *
 * Why always-register instead of returning `null` when S3 is absent: Payload's
 * cloud-storage plugin unconditionally adds its admin client component
 * (`@payloadcms/storage-s3/client#S3ClientUploadHandler`) to the import map
 * "to avoid import map discrepancies between dev and prod" (see
 * `initClientUploads` in @payloadcms/plugin-cloud-storage). Omitting the plugin
 * entirely defeats that safeguard: an import map generated with S3 absent is
 * missing that entry, so when S3 goes live the admin can't resolve the
 * component and renders a blank page (login included). Keeping the plugin in
 * the config and toggling `enabled` is the documented pattern
 * (payload.com/docs/upload/storage-adapters → "Conditionally Enable/Disable")
 * and keeps the import map identical across every environment.
 *
 * `alwaysInsertFields` applies the same dev/prod-consistency principle to the
 * collection schema: the `prefix` field is inserted whether or not the plugin
 * is enabled, so `media` carries the column in every environment instead of
 * only where S3 is active. This is the Payload v4 default and keeps the
 * generated `payload-types.ts` and the database schema env-independent (the
 * prod column is provisioned by the companion migration in #39; dev/CI get it
 * via drizzle push).
 *
 * AWS credentials come from the default credential chain (EC2 instance profile
 * in prod, optional `~/.aws/credentials` locally).
 */

/**
 * Object-key prefix for the media collection. Keys are `media/<filename>`
 * (spec 009 / ADR 0008, clarified 2026-06-09): the CloudFront `/media/*`
 * behavior (infra/lib/edge-stack.ts) has no originPath, so the public URL
 * path is forwarded VERBATIM as the S3 object key — the static `media`
 * prefix makes path == key with zero edge configuration. Size variants are
 * flat siblings under the same prefix. See ARCHITECTURE.md §5 and
 * specs/009-media-cloudfront-serving/contracts/media-url.md; changing any
 * side of that contract requires changing all three.
 */
const MEDIA_PREFIX = 'media'

/**
 * The single source of the public media URL:
 * `${NEXT_PUBLIC_SITE_URL}/media/<encoded-filename>` — served by the
 * CloudFront `/media/*` S3-via-OAC behavior, never the app proxy.
 *
 * - Pure (no I/O) so the contract is unit-testable in isolation
 *   (tests/int/media-url.int.spec.ts).
 * - Built from the DOC's stored `prefix` (passed by the plugin's hooks),
 *   mirroring how `@payloadcms/storage-s3` computes the actual object key —
 *   URL and key cannot drift per-document.
 * - Encoding mirrors the adapter's own `generateURL.js`: encode the filename
 *   segment, never the `/` joiner.
 * - Host fallback matches `payload.config.ts` serverURL. In deployed envs
 *   `NEXT_PUBLIC_SITE_URL` comes from the `next_public_site_url` SSM param at
 *   RUNTIME (server-side reads only) — `NEXT_PUBLIC_*` build-time inlining
 *   applies to client bundles, so client components must NOT rely on this
 *   value (the CI build has it unset).
 *
 * Why `generateFileURL` and not `disablePayloadAccessControl`: the latter
 * emits raw S3-endpoint URLs (bypassing CloudFront) and removes the
 * `/api/media/file/*` static-handler fallback the admin still uses. Hook
 * order makes `generateFileURL` authoritative: Payload core's url-field
 * afterRead hook runs FIRST (mergeBaseFields concats base-then-plugin), and
 * the plugin's hook returns `generateFileURL`'s result unconditionally — so
 * the URL is recomputed on every read and nothing persisted goes stale.
 */
export const mediaFileURL = ({
  prefix,
  filename,
}: {
  prefix?: string | null
  filename: string
}): string => {
  const host = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100').replace(/\/+$/, '')
  const key = path.posix.join(prefix || '', encodeURIComponent(filename))
  return `${host}/${key}`
}

export const s3StoragePlugin = (): Plugin => {
  const bucket = process.env.S3_BUCKET
  const region = process.env.S3_REGION
  const active = Boolean(bucket && region)

  return s3Storage({
    enabled: active,
    alwaysInsertFields: true,
    collections: {
      media: {
        prefix: MEDIA_PREFIX,
        // Recomputed on every read for the original and each size variant
        // (the plugin passes the variant's filename + the doc-level prefix).
        // Inactive in local dev/CI: with `enabled: false` the plugin attaches
        // no URL hooks, so local uploads keep the core
        // `/api/media/file/<filename>` URLs against the local filesystem.
        generateFileURL: ({ filename, prefix }) => mediaFileURL({ prefix, filename }),
        // Only bypass local-FS storage when the S3 adapter is actually active;
        // when disabled, uploads must keep writing to the local filesystem.
        disableLocalStorage: active,
      },
    },
    bucket: bucket ?? '',
    config: { region: region ?? '' },
  })
}
