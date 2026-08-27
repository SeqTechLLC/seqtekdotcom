import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { safeUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Sequoyah story teaser (homepage row 5 of §6).
export const BrandTeaser: Block = {
  slug: 'brand-teaser',
  interfaceName: 'BrandTeaserBlock',
  labels: { singular: 'Brand teaser', plural: 'Brand teasers' },
  admin: blockAdmin('specialty', 'brand-teaser', 'Brand teaser block preview'),
  fields: [
    { name: 'headline', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'linkLabel', type: 'text', required: true },
    {
      name: 'linkUrl',
      type: 'text',
      required: true,
      // The story page is the flat `/our-story` Page (renamed from /about).
      defaultValue: '/our-story',
      validate: safeUrlValidate,
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}
