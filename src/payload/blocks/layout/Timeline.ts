import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { mediaRowLabel } from '../../fields/mediaRowLabel'

// Per BLOCK_LIBRARY.md §5.2.
export const Timeline: Block = {
  slug: 'timeline',
  interfaceName: 'TimelineBlock',
  labels: { singular: 'Timeline', plural: 'Timelines' },
  admin: blockAdmin('content', 'timeline', 'Timeline'),
  fields: [
    headingField(),
    {
      name: 'items',
      type: 'array',
      label: 'Entries',
      labels: { singular: 'Entry', plural: 'Entries' },
      required: true,
      minRows: 2,
      admin: {
        description: 'At least two, drawn top to bottom in the order you arrange them.',
        components: {
          RowLabel: mediaRowLabel({
            singular: 'Entry',
            textFields: ['title', 'date'],
            uploadField: 'image',
          }),
        },
      },
      fields: [
        {
          name: 'date',
          type: 'text',
          label: 'When',
          required: true,
          admin: { description: 'Free text, so "1999", "Spring 2018" and "Today" are all fine.' },
        },
        {
          name: 'title',
          type: 'text',
          label: 'What happened',
          required: true,
          admin: { description: 'A few words. It also names this row when the list is collapsed.' },
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Detail',
          required: true,
          admin: { description: 'One or two sentences on why it mattered.' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
          admin: { description: 'Optional picture for this entry.' },
        },
      ],
    },
  ],
}
