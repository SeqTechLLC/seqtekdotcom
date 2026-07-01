import type { Block } from 'payload'

import { safeUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Sequoyah story teaser (homepage row 5 of §6).
export const BrandTeaser: Block = {
  slug: 'brand-teaser',
  interfaceName: 'BrandTeaserBlock',
  labels: { singular: 'Brand teaser', plural: 'Brand teasers' },
  fields: [
    { name: 'headline', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'linkLabel', type: 'text', required: true },
    {
      name: 'linkUrl',
      type: 'text',
      required: true,
      // /about/our-story is not a built route; the story lives at /about.
      defaultValue: '/about',
      validate: safeUrlValidate,
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}
