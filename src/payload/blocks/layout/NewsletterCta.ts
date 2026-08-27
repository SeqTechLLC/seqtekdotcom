import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.6 newsletter-signup. Renders as a HubSpot form
// embed in production; the showcase renderer uses a static placeholder so
// no third-party script loads in dev.
export const NewsletterCta: Block = {
  slug: 'newsletter-cta',
  interfaceName: 'NewsletterCtaBlock',
  labels: { singular: 'Newsletter CTA', plural: 'Newsletter CTAs' },
  admin: blockAdmin('cta', 'newsletter-cta', 'Newsletter CTA'),
  fields: [
    headingField({ fallback: 'Subscribe to SEQTEK Insights' }),
    {
      name: 'body',
      type: 'textarea',
      label: 'Supporting sentence',
      admin: { description: 'Optional line saying what a subscriber gets and how often.' },
    },
    {
      name: 'formId',
      type: 'text',
      label: 'HubSpot form ID',
      admin: {
        description:
          'Only needed to use a different form here than the site-wide newsletter one. Leave it blank and the standard newsletter form is used.',
      },
    },
  ],
}
