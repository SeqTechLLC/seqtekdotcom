import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.3 testimonial-single. Renamed in tasks.md T052
// to `testimonial-block` for consistency with the BlockType naming in the
// admin menu. Behaviourally identical.
export const TestimonialBlock: Block = {
  slug: 'testimonial-block',
  interfaceName: 'TestimonialBlock',
  labels: { singular: 'Testimonial (single)', plural: 'Testimonials (single)' },
  admin: blockAdmin('social-proof', 'testimonial-block', 'Testimonial (single) block preview'),
  fields: [
    {
      name: 'testimonial',
      type: 'relationship',
      relationTo: 'testimonials',
      required: true,
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'centered',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'With photo left', value: 'with-photo-left' },
        { label: 'With photo right', value: 'with-photo-right' },
      ],
    },
  ],
}
