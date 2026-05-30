import type { Block } from 'payload'

import { httpsUrlValidate, safeUrlValidate } from '../../fields/url'

// Tasks.md T053 specialty: a CTA pointing at the contact path (book a call,
// email, meeting embed). Distinct from cta-section because the variants
// here are narrower (email + book-a-call) and the rendering is purpose-
// built (HubSpot meetings affordance under §5.6 hubspot-meetings).
export const ContactCta: Block = {
  slug: 'contact-cta',
  interfaceName: 'ContactCtaBlock',
  labels: { singular: 'Contact CTA', plural: 'Contact CTAs' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    {
      name: 'primaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true, validate: safeUrlValidate },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text', validate: safeUrlValidate },
      ],
    },
    {
      name: 'meetingUrl',
      type: 'text',
      validate: httpsUrlValidate,
      admin: {
        description: 'Optional HubSpot meetings URL — embeds an inline scheduler.',
      },
    },
  ],
}
