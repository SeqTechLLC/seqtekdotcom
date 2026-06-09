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
 * AWS credentials come from the default credential chain (EC2 instance profile
 * in prod, optional `~/.aws/credentials` locally).
 */
export const s3StoragePlugin = (): Plugin => {
  const bucket = process.env.S3_BUCKET
  const region = process.env.S3_REGION
  const active = Boolean(bucket && region)

  return s3Storage({
    enabled: active,
    collections: {
      media: {
        // Key shape: `<media-id>/<filename>` per ARCHITECTURE.md §5.
        prefix: '',
        // Only bypass local-FS storage when the S3 adapter is actually active;
        // when disabled, uploads must keep writing to the local filesystem.
        disableLocalStorage: active,
      },
    },
    bucket: bucket ?? '',
    config: { region: region ?? '' },
  })
}
