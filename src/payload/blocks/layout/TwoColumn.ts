import type { Block } from 'payload'

import { editorConfig } from '../../editor/editorConfig'

// Per BLOCK_LIBRARY.md §5.2.
export const TwoColumn: Block = {
  slug: 'two-column',
  interfaceName: 'TwoColumnBlock',
  labels: { singular: 'Two-column', plural: 'Two-column blocks' },
  fields: [
    {
      name: 'mediaPosition',
      type: 'select',
      required: true,
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
    { name: 'body', type: 'richText', required: true, editor: editorConfig },
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
  ],
}
