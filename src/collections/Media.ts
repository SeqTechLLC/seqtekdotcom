import {
  APIError,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type GetAdminThumbnail,
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

/**
 * The derivative the admin previews from: the smallest WebP already generated
 * for every record. Derived from BREAKPOINTS rather than hard-coded so adding
 * a smaller breakpoint moves the thumbnail with it.
 */
const THUMBNAIL_SIZE = `${[...BREAKPOINTS].sort((a, b) => a.width - b.width)[0].name}_webp`

interface StoredSize {
  url?: unknown
}

/**
 * spec 011 US3 / FR-015, FR-016 / contracts/admin-metadata.md C6.
 *
 * Payload leaves `thumbnailURL` null unless `upload.adminThumbnail` is set, so
 * every media picker and list row fell back to whatever the client could infer
 * — in practice, nothing. This resolves the preview server-side from the
 * `mobile_webp` derivative all 78 existing records already carry, so no new
 * `imageSize` is introduced and no media is re-processed (research R7:
 * derivatives are generated at upload time only, so a newly declared size
 * would leave every existing record exactly as blank as it is now).
 *
 * Returns the derivative's own stored URL rather than the CloudFront
 * `/media/*` URL from `mediaFileURL`. That path is tempting — it is what the
 * public site renders — but it needs the doc's storage `prefix`, and Payload's
 * list view narrows its query to `{ mimeType, thumbnailURL, sizes.* }`
 * (`appendUploadSelectFields`), so `prefix` is simply absent there. The stored
 * `/api/media/file/<filename>` path resolves on every lane: locally against the
 * filesystem, and in the deployed lanes through the S3 static handler the admin
 * already uses for the full-size preview on the edit screen.
 *
 * `null` — never a guessed URL — for non-images and for any record missing the
 * derivative, so Payload falls back to its file-type glyph (FR-016).
 */
export const mediaAdminThumbnail: GetAdminThumbnail = ({ doc }) => {
  const mimeType = doc.mimeType
  if (typeof mimeType !== 'string' || !mimeType.startsWith('image/')) return null

  const sizes = doc.sizes as Record<string, StoredSize | null | undefined> | null | undefined
  const url = sizes?.[THUMBNAIL_SIZE]?.url
  return typeof url === 'string' && url.length > 0 ? url : null
}

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
    adminThumbnail: mediaAdminThumbnail,
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
      label: 'Alt text',
      required: true,
      admin: {
        description:
          'What this image shows, in a sentence, for someone using a screen reader. Describe the content, not the file: "Two engineers at a whiteboard", not "photo 1".',
      },
      validate: (value: unknown): true | string => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Alt text is required for accessibility (FR-023)'
        }
        return true
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: {
        description:
          'Optional visible caption. Only some blocks draw it, and it never replaces the alt text.',
      },
    },
  ],
}
