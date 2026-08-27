import type { Block } from 'payload'

import { outputContract } from '../outputContract'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.3 testimonial-carousel. Renamed in tasks.md T052
// to `featured-testimonials` to match the homepage composition naming
// (BLOCK_LIBRARY.md §6 row 7). Behaviourally identical.
export const FeaturedTestimonials: Block = {
  slug: 'featured-testimonials',
  interfaceName: 'FeaturedTestimonialsBlock',
  labels: { singular: 'Featured testimonials', plural: 'Featured testimonials blocks' },
  admin: blockAdmin('social-proof', 'featured-testimonials', 'Featured testimonials'),
  custom: outputContract({
    inert: {
      // Read by nothing: the block renders a static grid, not a carousel.
      fields: ['autoplay'],
      why: 'carousel was never shipped — ROADMAP INERT-2',
    },
  }),
  fields: [
    headingField(),
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      label: 'Quotes to show',
      hasMany: true,
      required: true,
      minRows: 2,
      maxRows: 6,
      admin: {
        description:
          'Two to six quotes, drawn together as a grid in the order you pick them. Add them under Testimonials first.',
      },
    },
    {
      name: 'autoplay',
      type: 'checkbox',
      label: 'Advance on its own',
      defaultValue: false,
      admin: {
        description:
          'Not wired up: the carousel has not shipped, so the quotes render as a static set whichever way this is left (ROADMAP INERT-2).',
      },
    },
  ],
}
