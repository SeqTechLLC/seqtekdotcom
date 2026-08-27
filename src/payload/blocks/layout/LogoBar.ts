import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { mediaRowLabel } from '../../fields/mediaRowLabel'
import { requiredWhen } from '../conditional'

type LogoBarSibling = { source?: string }

// Per BLOCK_LIBRARY.md §5.3.
export const LogoBar: Block = {
  slug: 'logo-bar',
  interfaceName: 'LogoBarBlock',
  labels: { singular: 'Logo bar', plural: 'Logo bars' },
  admin: blockAdmin('social-proof', 'logo-bar', 'Logo bar block preview'),
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'inline',
      options: [
        { label: 'Inline', value: 'inline' },
        { label: 'From homepage', value: 'from-homepage' },
      ],
    },
    {
      name: 'logos',
      type: 'array',
      ...requiredWhen<LogoBarSibling>((d) => d?.source === 'inline'),
      admin: {
        components: { RowLabel: mediaRowLabel({ singular: 'Logo', uploadField: 'logo' }) },
      },
      fields: [{ name: 'logo', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'treatment',
      type: 'select',
      defaultValue: 'grayscale-on-color-hover',
      options: [
        { label: 'Grayscale on color hover', value: 'grayscale-on-color-hover' },
        { label: 'Color', value: 'color' },
      ],
    },
  ],
}
