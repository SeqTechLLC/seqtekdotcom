import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { editorConfig } from '../../editor/editorConfig'
import { backgroundField } from '../../fields/blockCopy'
import { ctaField } from '../../fields/cta'

// A picture beside a column of prose (WordPress "Media & Text"). Replaces
// `two-column` and `brand-teaser`: the teaser's headline and paragraph are
// just the rich text, and its link is the button.
export const MediaText: Block = {
  slug: 'media-text',
  interfaceName: 'MediaTextBlock',
  labels: { singular: 'Media and text', plural: 'Media and text blocks' },
  admin: blockAdmin('content', 'media-text', 'Media and text'),
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      required: true,
      admin: { description: 'The picture beside the text. Landscape or square.' },
    },
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
          'On a phone the two stack in this order, so "Left" puts the image first and "Right" puts the text first. Alternate the side down a page of these so it does not read as a ladder.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Text',
      required: true,
      editor: editorConfig,
      admin: {
        description:
          'The words beside the image. Start with a short heading, then a paragraph or two.',
      },
    },
    ctaField({
      name: 'cta',
      label: 'Button',
      description:
        'Optional. Appears under the text, e.g. "Read our story". Leave both fields empty for no button.',
    }),
    backgroundField(),
  ],
}
