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
      required: true,
    },
  ],
}
