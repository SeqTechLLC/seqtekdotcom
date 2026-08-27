import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { safeUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Sequoyah story teaser (homepage row 5 of §6).
export const BrandTeaser: Block = {
  slug: 'brand-teaser',
  interfaceName: 'BrandTeaserBlock',
  labels: { singular: 'Brand teaser', plural: 'Brand teasers' },
  admin: blockAdmin('specialty', 'brand-teaser', 'Brand teaser'),
  fields: [
    {
      name: 'headline',
      type: 'text',
      label: 'Headline',
      required: true,
      admin: { description: 'The big line of this section.' },
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Paragraph',
      required: true,
      admin: { description: 'Two or three sentences under the headline.' },
    },
    {
      name: 'linkLabel',
      type: 'text',
      label: 'Link text',
      required: true,
      admin: { description: 'The words of the link, e.g. "Read our story".' },
    },
    {
      name: 'linkUrl',
      type: 'text',
      label: 'Link destination',
      required: true,
      // The story page is the flat `/our-story` Page (renamed from /about).
      defaultValue: '/our-story',
      validate: safeUrlValidate,
      admin: {
        description:
          'Where the link goes. A page on this site starts with a slash; the default is our story page.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      admin: { description: 'Optional picture beside the text. Landscape reads best here.' },
    },
  ],
}
