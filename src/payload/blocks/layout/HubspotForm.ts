import type { Block } from 'payload'

import { outputContract } from '../outputContract'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { hubspotFormIdValidate, safeUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Full HubSpot form embed.
export const HubspotForm: Block = {
  slug: 'hubspot-form',
  interfaceName: 'HubspotFormBlock',
  labels: { singular: 'HubSpot form', plural: 'HubSpot forms' },
  admin: blockAdmin('specialty', 'hubspot-form', 'HubSpot form'),
  custom: outputContract({
    // The GUID is the submit target, read by `lib/hubspot/submit.ts` when the
    // visitor sends the form, not while it paints.
    behavioural: { formId: 'submit target — src/lib/hubspot/submit.ts' },
    inert: {
      // Read by nothing: the form shows an inline success panel and never
      // navigates.
      fields: ['submitRedirect'],
      why: 'the form never redirects — ROADMAP INERT-2',
    },
  }),
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
          'Not wired up: nothing reads this yet, so a path typed here changes nothing. Set the redirect on the form in HubSpot instead (ROADMAP INERT-2).',
      },
    },
  ],
}
