import type { Block } from 'payload'

export const TestimonialEmbed: Block = {
  slug: 'testimonial-embed',
  interfaceName: 'TestimonialEmbedBlock',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  fields: [
    {
      name: 'testimonial',
      type: 'relationship',
      relationTo: 'testimonials',
      required: true,
    },
  ],
}
