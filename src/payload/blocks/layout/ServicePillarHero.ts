import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { ctaField } from '../../fields/cta'

// Per BLOCK_LIBRARY.md §5.1: pillar landings reuse the hero shape with a
// required pillar-name eyebrow and required image. Modeled as a distinct
// block so the pillar landing template can rely on the structured fields
// without conditional fallbacks. (BLOCK_LIBRARY.md §9 rule 3.)
export const ServicePillarHero: Block = {
  slug: 'service-pillar-hero',
  interfaceName: 'ServicePillarHeroBlock',
  labels: { singular: 'Service pillar hero', plural: 'Service pillar heroes' },
  admin: blockAdmin('hero', 'service-pillar-hero', 'Service pillar hero'),
  fields: [
    {
      name: 'pillarName',
      type: 'text',
      label: 'Pillar name',
      required: true,
      admin: {
        description:
          'The small line above the headline naming which pillar this page is, e.g. "Strategy".',
      },
    },
    {
      name: 'headline',
      type: 'text',
      label: 'Headline',
      required: true,
      admin: { description: 'What this pillar does for a client, in a line.' },
    },
    {
      name: 'subheadline',
      type: 'textarea',
      label: 'Supporting sentence',
      admin: { description: 'One or two sentences under the headline. Optional.' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Header image',
      required: true,
      admin: {
        description: 'The image at the top of the pillar page. Landscape, at least 1600px wide.',
      },
    },
    ctaField({
      name: 'primaryCta',
      label: 'Main button',
      description: 'Optional. Leave both fields empty and the hero renders without a button.',
    }),
  ],
}
