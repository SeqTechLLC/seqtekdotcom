import type { Block } from 'payload'

import { hubspotFormIdValidate, safeUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Full HubSpot form embed.
export const HubspotForm: Block = {
  slug: 'hubspot-form',
  interfaceName: 'HubspotFormBlock',
  labels: { singular: 'HubSpot form', plural: 'HubSpot forms' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'formId', type: 'text', required: true, validate: hubspotFormIdValidate },
    {
      name: 'submitRedirect',
      type: 'text',
      validate: safeUrlValidate,
      admin: { description: 'Optional thank-you page path on successful submit.' },
    },
  ],
}
