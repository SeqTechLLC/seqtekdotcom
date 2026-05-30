import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.6 newsletter-signup. Renders as a HubSpot form
// embed in production; the showcase renderer uses a static placeholder so
// no third-party script loads in dev.
export const NewsletterCta: Block = {
  slug: 'newsletter-cta',
  interfaceName: 'NewsletterCtaBlock',
  labels: { singular: 'Newsletter CTA', plural: 'Newsletter CTAs' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'body', type: 'textarea' },
    {
      name: 'formId',
      type: 'text',
      admin: {
        description:
          'HubSpot form GUID. Falls back to NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID at render time.',
      },
    },
  ],
}
