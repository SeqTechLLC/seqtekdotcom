import type { Block } from 'payload'

import { outputContract } from '../outputContract'

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
  custom: outputContract({
    behavioural: { formId: 'submit target — src/lib/hubspot/submit.ts' },
  }),
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
          'The HubSpot form ID (Marketing > Forms > Share > embed code), e.g. 12345678-90ab-cdef-1234-567890abcdef. The form collects an email address and sends it to that form. Required: with no ID there is no way to subscribe, so the whole section is left off the page.',
      },
    },
  ],
}
