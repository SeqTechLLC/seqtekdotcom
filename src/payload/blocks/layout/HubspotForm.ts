import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { hubspotFormIdValidate, safeUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Full HubSpot form embed.
export const HubspotForm: Block = {
  slug: 'hubspot-form',
  interfaceName: 'HubspotFormBlock',
  labels: { singular: 'HubSpot form', plural: 'HubSpot forms' },
  admin: blockAdmin('specialty', 'hubspot-form', 'HubSpot form'),
  fields: [
    headingField(),
    {
      name: 'description',
      type: 'textarea',
      label: 'Intro text',
      admin: {
        description: 'Optional line above the form saying what happens after they submit it.',
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
          'Which HubSpot form to embed. Copy the form ID out of HubSpot (Marketing > Forms > Share > embed code); it looks like 12345678-90ab-cdef-1234-567890abcdef.',
      },
    },
    {
      name: 'submitRedirect',
      type: 'text',
      label: 'Thank-you page',
      validate: safeUrlValidate,
      admin: {
        description:
          'Where to send someone after they submit, e.g. "/thank-you". Leave blank to keep them on this page with the form\'s own confirmation message.',
      },
    },
  ],
}
