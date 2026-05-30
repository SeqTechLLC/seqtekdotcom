import type { Block } from 'payload'

import { httpsUrlValidate, hubspotFormIdValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Lead-magnet CTA: HubSpot-gated download card.
export const DownloadCard: Block = {
  slug: 'download-card',
  interfaceName: 'DownloadCardBlock',
  labels: { singular: 'Download card', plural: 'Download cards' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'coverImage', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'formId',
      type: 'text',
      required: true,
      validate: hubspotFormIdValidate,
      admin: { description: 'HubSpot form GUID for the gated download.' },
    },
    {
      name: 'fileUrl',
      type: 'text',
      required: true,
      validate: httpsUrlValidate,
      admin: { description: 'S3 URL to the asset (or other allow-listed host).' },
    },
  ],
}
