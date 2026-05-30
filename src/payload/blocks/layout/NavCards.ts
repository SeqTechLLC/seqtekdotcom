import type { Block } from 'payload'

import { safeUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. 3-up navigation cards (about-landing pattern).
export const NavCards: Block = {
  slug: 'nav-cards',
  interfaceName: 'NavCardsBlock',
  labels: { singular: 'Nav cards', plural: 'Nav cards blocks' },
  fields: [
    {
      name: 'cards',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 4,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'linkUrl', type: 'text', required: true, validate: safeUrlValidate },
      ],
    },
  ],
}
