import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { editorConfig } from '../../editor/editorConfig'
import { backgroundField } from '../../fields/blockCopy'

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  labels: { singular: 'Content', plural: 'Content blocks' },
  admin: blockAdmin('content', 'content', 'Content'),
  fields: [
    {
      name: 'width',
      type: 'select',
      label: 'Column width',
      defaultValue: 'standard',
      admin: {
        description:
          'How wide the text runs. Standard is the comfortable reading width and is right nearly always; wide suits text with images or tables in it.',
      },
      options: [
        { label: 'Narrow', value: 'narrow' },
        { label: 'Standard', value: 'standard' },
        { label: 'Wide', value: 'wide' },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Text',
      required: true,
      editor: editorConfig,
      admin: {
        description:
          'The prose of this section. Use the slash menu to drop in a callout, a pull quote, an image or an FAQ between paragraphs.',
      },
    },
    backgroundField(),
  ],
}
