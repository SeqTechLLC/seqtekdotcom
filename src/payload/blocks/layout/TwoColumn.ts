import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { editorConfig } from '../../editor/editorConfig'
import { ctaField } from '../../fields/cta'

// Per BLOCK_LIBRARY.md §5.2.
export const TwoColumn: Block = {
  slug: 'two-column',
  interfaceName: 'TwoColumnBlock',
  labels: { singular: 'Two-column', plural: 'Two-column blocks' },
  admin: blockAdmin('content', 'two-column', 'Two-column'),
  fields: [
    {
      name: 'mediaPosition',
      type: 'select',
      label: 'Which side the image sits on',
      required: true,
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      admin: {
        description:
          'On a phone the image always comes first and the text follows, whichever side you pick. Alternate the side down a page of these so it does not read as a ladder.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Text',
      required: true,
      editor: editorConfig,
      admin: { description: 'The column of prose beside the image.' },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      required: true,
      admin: { description: 'The image beside the text. Landscape or square.' },
    },
    ctaField({
      name: 'cta',
      label: 'Button',
      description: 'Optional. Appears under the text column.',
    }),
  ],
}
