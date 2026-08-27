import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { ctaField } from '../../fields/cta'
import { httpsUrlValidate } from '../../fields/url'

// Tasks.md T053 specialty: a CTA pointing at the contact path (book a call,
// email, meeting embed). Distinct from cta-section because the variants
// here are narrower (email + book-a-call) and the rendering is purpose-
// built (HubSpot meetings affordance under §5.6 hubspot-meetings).
export const ContactCta: Block = {
  slug: 'contact-cta',
  interfaceName: 'ContactCtaBlock',
  labels: { singular: 'Contact CTA', plural: 'Contact CTAs' },
  admin: blockAdmin('cta', 'contact-cta', 'Contact CTA'),
  fields: [
    headingField({ required: true }),
    {
      name: 'body',
      type: 'textarea',
      label: 'Supporting sentence',
      admin: {
        description: 'Optional line under the heading saying what happens when they get in touch.',
      },
    },
    ctaField({
      name: 'primaryCta',
      label: 'Main button',
      description: 'The one action this section is asking for, usually booking a call.',
      required: true,
    }),
    ctaField({
      name: 'secondaryCta',
      label: 'Second button',
      description: 'An optional lighter alternative, for example emailing instead of booking.',
    }),
    {
      name: 'meetingUrl',
      type: 'text',
      label: 'HubSpot scheduling link',
      validate: httpsUrlValidate,
      admin: {
        description:
          'A HubSpot meetings address (https://meetings.hubspot.com/name). The panel beside the text renders either way, so leaving this blank publishes the words "Configure a HubSpot meetings URL to embed the scheduler" on the page. The live calendar is not embedded yet: filled in, the panel shows the address (ROADMAP INERT-2).',
      },
    },
  ],
}
