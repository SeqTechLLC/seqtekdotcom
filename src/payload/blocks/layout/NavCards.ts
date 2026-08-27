import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { mediaRowLabel } from '../../fields/mediaRowLabel'
import { safeUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. 3-up navigation cards (about-landing pattern).
export const NavCards: Block = {
  slug: 'nav-cards',
  interfaceName: 'NavCardsBlock',
  labels: { singular: 'Nav cards', plural: 'Nav cards blocks' },
  admin: blockAdmin('specialty', 'nav-cards', 'Nav cards'),
  fields: [
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      labels: { singular: 'Card', plural: 'Cards' },
      required: true,
      minRows: 2,
      maxRows: 4,
      admin: {
        description: 'Two to four cards sending the reader on to another page.',
        components: {
          RowLabel: mediaRowLabel({
            singular: 'Card',
            textFields: ['title'],
            uploadField: 'image',
          }),
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Card title',
          required: true,
          admin: {
            description:
              'Where this card goes, e.g. "Case studies". It also names the row when collapsed.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Card text',
          required: true,
          admin: { description: 'One sentence on what the reader finds there.' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Card image',
          admin: { description: 'Optional picture at the top of the card. Landscape.' },
        },
        {
          name: 'linkUrl',
          type: 'text',
          label: 'Card link',
          required: true,
          validate: safeUrlValidate,
          admin: {
            description:
              'Where the card goes. A page on this site starts with a slash, e.g. "/case-studies".',
          },
        },
      ],
    },
  ],
}
