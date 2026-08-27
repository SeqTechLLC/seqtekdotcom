import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { mediaRowLabel } from '../../fields/mediaRowLabel'

// Per BLOCK_LIBRARY.md §5.2.
export const Timeline: Block = {
  slug: 'timeline',
  interfaceName: 'TimelineBlock',
  labels: { singular: 'Timeline', plural: 'Timelines' },
  admin: blockAdmin('content', 'timeline', 'Timeline block preview'),
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 2,
      admin: {
        components: {
          RowLabel: mediaRowLabel({
            singular: 'Entry',
            textFields: ['title', 'date'],
            uploadField: 'image',
          }),
        },
      },
      fields: [
        { name: 'date', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
