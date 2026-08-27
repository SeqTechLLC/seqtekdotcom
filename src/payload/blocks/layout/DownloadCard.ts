import type { Block } from 'payload'

import { outputContract } from '../outputContract'

import { blockAdmin } from '../blockAdmin'

import { httpsUrlValidate, hubspotFormIdValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Lead-magnet CTA: HubSpot-gated download card.
export const DownloadCard: Block = {
  slug: 'download-card',
  interfaceName: 'DownloadCardBlock',
  labels: { singular: 'Download card', plural: 'Download cards' },
  admin: blockAdmin('specialty', 'download-card', 'Download card'),
  custom: outputContract({
    behavioural: {
      formId: 'submit target — src/lib/hubspot/submit.ts',
      // Deliberately absent from the initial paint: revealing it there is what
      // made the gated asset ungated. It arrives in the form's success panel.
      fileUrl: 'revealed in the success panel — HubspotLeadForm successCta',
    },
  }),
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
          'The HubSpot form ID (Marketing > Forms > Share > embed code), e.g. 12345678-90ab-cdef-1234-567890abcdef. Name, email and company go to that form, and the download appears once it is sent.',
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
          'The full https:// address of the file. It appears only after the form is sent, so this is what the form is trading for. Anyone who fills the form in gets the link, so treat it as shareable rather than secret.',
      },
    },
  ],
}
