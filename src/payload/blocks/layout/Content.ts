import type { Block } from 'payload'

import { editorConfig } from '../../editor/editorConfig'

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  labels: { singular: 'Content', plural: 'Content blocks' },
  fields: [
    {
      name: 'width',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { label: 'Narrow', value: 'narrow' },
        { label: 'Standard', value: 'standard' },
        { label: 'Wide', value: 'wide' },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: editorConfig,
    },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Subtle', value: 'subtle' },
        { label: 'Accent', value: 'accent' },
      ],
    },
  ],
}
