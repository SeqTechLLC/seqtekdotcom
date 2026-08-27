import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { httpsUrlValidate, hubspotFormIdValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Lead-magnet CTA: HubSpot-gated download card.
export const DownloadCard: Block = {
  slug: 'download-card',
  interfaceName: 'DownloadCardBlock',
  labels: { singular: 'Download card', plural: 'Download cards' },
  admin: blockAdmin('specialty', 'download-card', 'Download card'),
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'What is being offered',
      required: true,
      admin: {
        description: 'The name of the guide, template or report, as it appears on the card.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Why it is worth the email',
      required: true,
      admin: {
        description:
          'One or two sentences on what the reader gets. This is what earns the form fill.',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover image',
      required: true,
      admin: {
        description:
          'A picture of the thing itself, e.g. the report cover. Portrait or square reads best.',
      },
    },
    {
      name: 'formId',
      type: 'text',
      label: 'HubSpot form ID',
      required: true,
      validate: hubspotFormIdValidate,
      admin: {
        description:
          'The HubSpot form ID (Marketing > Forms > Share > embed code), e.g. 12345678-90ab-cdef-1234-567890abcdef. Nothing is gated yet: the block draws a disabled form and prints "HubSpot form <id> loads in production" on the page (ROADMAP INERT-2).',
      },
    },
    {
      name: 'fileUrl',
      type: 'text',
      label: 'File to deliver',
      required: true,
      validate: httpsUrlValidate,
      admin: {
        description:
          'The full https:// address of the file. It is currently printed on the published page as "Asset: <address>", so anyone can take it without filling anything in. Do not put anything here you would not publish outright (ROADMAP INERT-2).',
      },
    },
  ],
}
