import type { Block } from 'payload'

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
      defaultValue: '/about/our-story',
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}
