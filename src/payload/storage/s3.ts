import type { Plugin } from 'payload'
import { s3Storage } from '@payloadcms/storage-s3'

/**
 * Returns the S3 storage plugin when `S3_BUCKET` + `S3_REGION` are set,
 * otherwise `null` so `payload.config` can fall back to local filesystem
 * storage (FR-022). AWS credentials come from the default credential chain
 * (EC2 instance profile in prod, optional `~/.aws/credentials` locally).
 */
export const conditionalS3Storage = (): Plugin | null => {
  const bucket = process.env.S3_BUCKET
  const region = process.env.S3_REGION
  if (!bucket || !region) return null

  return s3Storage({
    collections: {
      media: {
        // Key shape: `<media-id>/<filename>` per ARCHITECTURE.md §5.
        prefix: '',
        disableLocalStorage: true,
      },
    },
    bucket,
    config: { region },
  })
}
