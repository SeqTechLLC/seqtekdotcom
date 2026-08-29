import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { mediaRowLabel } from '../../fields/mediaRowLabel'

// Per BLOCK_LIBRARY.md §5.3.
export const LogoBar: Block = {
  slug: 'logo-bar',
  interfaceName: 'LogoBarBlock',
  labels: { singular: 'Logo bar', plural: 'Logo bars' },
  admin: blockAdmin('social-proof', 'logo-bar', 'Logo bar'),
  fields: [
    headingField(),
    {
      name: 'logos',
      type: 'array',
      label: 'Logos',
      labels: { singular: 'Logo', plural: 'Logos' },
      admin: {
        components: { RowLabel: mediaRowLabel({ singular: 'Logo', uploadField: 'logo' }) },
        // Deliberately not `required`. The blocks that have zero logos are the
        // `from-homepage` ones this migration removes, and marking the array
        // required would make their containing page unsaveable — the error
        // landing on an editor doing something unrelated. An empty block
        // simply renders nothing, as `industry-grid` and `related-posts` do.
        description:
          'The logos to show, in the order they should read. With none picked the section is left off the page.',
      },
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo file',
          required: true,
          admin: {
            description: 'Transparent PNG or SVG where possible, so it sits on any background.',
          },
        },
      ],
    },
    {
      name: 'treatment',
      type: 'select',
      label: 'How the logos are drawn',
      defaultValue: 'grayscale-on-color-hover',
      options: [
        { label: 'Gray, color on hover', value: 'grayscale-on-color-hover' },
        { label: 'Always in color', value: 'color' },
      ],
      admin: {
        description:
          'Gray keeps a wall of mismatched brand colors calm and is the usual choice. Full color suits a short row of two or three.',
      },
    },
  ],
}
