import type { CollectionConfig } from 'payload'

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
