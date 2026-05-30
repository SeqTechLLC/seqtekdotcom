import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.3 testimonial-carousel. Renamed in tasks.md T052
// to `featured-testimonials` to match the homepage composition naming
// (BLOCK_LIBRARY.md §6 row 7). Behaviourally identical.
export const FeaturedTestimonials: Block = {
  slug: 'featured-testimonials',
  interfaceName: 'FeaturedTestimonialsBlock',
  labels: { singular: 'Featured testimonials', plural: 'Featured testimonials blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      required: true,
      minRows: 2,
      maxRows: 6,
    },
    { name: 'autoplay', type: 'checkbox', defaultValue: false },
  ],
}
