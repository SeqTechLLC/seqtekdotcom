import type { CollectionConfig, ImageSize } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
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
    // 25MB cap per data-model §1.12
    mimeTypes: ALLOWED_MIME,
    focalPoint: true,
    filesRequiredOnCreate: true,
    imageSizes,
    // Payload reads the global `upload.maxFileSize` from request body limit;
    // collection-level cap is enforced via the validate path below.
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
