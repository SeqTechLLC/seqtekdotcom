import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { mediaRowLabel } from '../../fields/mediaRowLabel'

// Variant of LogoBar that renders client logos in a denser grid (per
// BLOCK_LIBRARY.md §5.3 — modeled as a separate block per tasks.md T052
// since the layout intent differs from the linear bar treatment).
export const ClientLogoGrid: Block = {
  slug: 'client-logo-grid',
  interfaceName: 'ClientLogoGridBlock',
  labels: { singular: 'Client logo grid', plural: 'Client logo grids' },
  admin: blockAdmin('social-proof', 'client-logo-grid', 'Client logo grid'),
  fields: [
    headingField(),
    {
      name: 'logos',
      type: 'array',
      label: 'Logos',
      labels: { singular: 'Logo', plural: 'Logos' },
      required: true,
      minRows: 4,
      admin: {
        description: 'At least four. Only logos we have written permission to display.',
        components: {
          RowLabel: mediaRowLabel({
            singular: 'Logo',
            textFields: ['caption'],
            uploadField: 'logo',
          }),
        },
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
        {
          name: 'caption',
          type: 'text',
          label: 'Caption',
          admin: {
            description:
              'Optional line under the logo. It also names this row when the list is collapsed.',
          },
        },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      label: 'Logos per row',
      defaultValue: '4',
      admin: {
        description:
          'How many fit across on a wide screen. Fewer columns means bigger logos. Phones show two or three across, never one.',
      },
      options: [
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
        { label: '6 columns', value: '6' },
      ],
    },
  ],
}
