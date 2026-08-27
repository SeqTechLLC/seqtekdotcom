import type { Block } from 'payload'

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
  fields: [
    headingField(),
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      label: 'Quotes to rotate',
      hasMany: true,
      required: true,
      minRows: 2,
      maxRows: 6,
      admin: {
        description:
          'Two to six quotes, shown one at a time in the order you pick them. Add them under Testimonials first.',
      },
    },
    {
      name: 'autoplay',
      type: 'checkbox',
      label: 'Advance on its own',
      defaultValue: false,
      admin: {
        description:
          'Rotates the quotes without the reader clicking. Leave it off unless the section is purely decorative, since moving text is hard to read.',
      },
    },
  ],
}
