import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const TestimonialEmbed: Block = {
  slug: 'testimonial-embed',
  interfaceName: 'TestimonialEmbedBlock',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  admin: inlineBlockAdmin('testimonial-embed', 'Testimonial icon'),
  fields: [
    {
      name: 'testimonial',
      type: 'relationship',
      relationTo: 'testimonials',
      label: 'The quote',
      required: true,
      admin: {
        description:
          'Pick a testimonial already in the panel. Add it under Testimonials first if it is not there.',
      },
    },
  ],
}
