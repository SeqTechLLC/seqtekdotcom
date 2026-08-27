import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.3 testimonial-single. Renamed in tasks.md T052
// to `testimonial-block` for consistency with the BlockType naming in the
// admin menu. Behaviourally identical.
export const TestimonialBlock: Block = {
  slug: 'testimonial-block',
  interfaceName: 'TestimonialBlock',
  labels: { singular: 'Testimonial (single)', plural: 'Testimonials (single)' },
  admin: blockAdmin('social-proof', 'testimonial-block', 'Testimonial (single)'),
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
    {
      name: 'layout',
      type: 'select',
      label: 'How to draw it',
      defaultValue: 'centered',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'With photo left', value: 'with-photo-left' },
        { label: 'With photo right', value: 'with-photo-right' },
      ],
      admin: {
        description:
          'The photo comes from the testimonial itself, so the two photo layouts simply omit it when that person has no photo on file; the quote stays left-aligned.',
      },
    },
  ],
}
