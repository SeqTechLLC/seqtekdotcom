import {
  APIError,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type ImageSize,
} from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import {
  invalidateMediaOnChange,
  invalidateMediaOnDelete,
} from '../payload/hooks/invalidateMediaOnChange'

// data-model §1.12: 25 MB upload cap. Payload v3 has no collection-level
// `maxFileSize` field on UploadConfig, so we enforce it in a beforeOperation
// hook. The global busboy parser is also a defense-in-depth gate, but it's
// site-wide; this hook keeps the limit scoped to Media.
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

const enforceMaxFileSize: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation !== 'create' && operation !== 'update') return args
  const file = args.req?.file
  if (file && typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
    // APIError(message, status, data, isPublic) — isPublic surfaces the
    // message to the admin UI; a bare `throw new Error` would land as a
    // generic 500 with no editor-readable reason.
    throw new APIError(
      `Upload exceeds 25 MB cap (received ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
      413,
      null,
      true,
    )
  }
  return args
}

// SVG is intentionally excluded: SVG can carry inline <script> / event
// handlers, and once served through CloudFront on the site origin the raw
// file URL would execute in the user's session. Re-enable only behind an
// upload-time sanitizer (svgo with removeScriptElement + removeOnHandlers,
// or DOMPurify) or a separate cookieless origin with Content-Disposition.
const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
]

// Two derivatives per breakpoint: one WebP (preferred) and one JPEG (fallback for
// the ~3% of clients that don't support WebP). The <picture> in ResponsiveImage
// picks the right source. Quality 80 is the standard sweet spot; mozjpeg gives
// 5-15% smaller JPEGs at the same visual quality with no decode-side cost.
const BREAKPOINTS = [
  { name: 'mobile', width: 640 },
  { name: 'tablet', width: 1024 },
  { name: 'desktop', width: 1600 },
  { name: 'wide', width: 2400 },
] as const

const imageSizes: ImageSize[] = BREAKPOINTS.flatMap(({ name, width }) => [
  {
    name: `${name}_webp`,
    width,
    withoutEnlargement: true,
    formatOptions: { format: 'webp', options: { quality: 80 } },
  },
  {
    name: `${name}_jpeg`,
    width,
    withoutEnlargement: true,
    formatOptions: { format: 'jpeg', options: { quality: 80, mozjpeg: true } },
  },
])

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
    admin: isAdminOrEditor,
  },
  upload: {
    mimeTypes: ALLOWED_MIME,
    focalPoint: true,
    filesRequiredOnCreate: true,
    imageSizes,
  },
  hooks: {
    beforeOperation: [enforceMaxFileSize],
    // Stable media/<filename> S3 keys (spec 009/ADR 0008) forfeit the
    // new-key-per-change cache busting — a file REPLACE or DELETE must
    // invalidate the long-TTL CloudFront /media/* paths (FR-011). No-op
    // locally/CI (no CLOUDFRONT_DISTRIBUTION_ID) and for metadata-only
    // updates.
    afterChange: [invalidateMediaOnChange],
    afterDelete: [invalidateMediaOnDelete],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      validate: (value: unknown): true | string => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Alt text is required for accessibility (FR-023)'
        }
        return true
      },
    },
    { name: 'caption', type: 'text' },
  ],
}
