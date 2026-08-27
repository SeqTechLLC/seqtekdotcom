import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.6. Inline content (per-page authoring) is the
// default; sourcing from siteSettings is BLOCK_LIBRARY.md §10 open question
// B-3 and is deferred until a real page composition forces it.
export const MissionVisionValues: Block = {
  slug: 'mission-vision-values',
  interfaceName: 'MissionVisionValuesBlock',
  labels: { singular: 'Mission/Vision/Values', plural: 'Mission/Vision/Values blocks' },
  admin: blockAdmin('specialty', 'mission-vision-values', 'Mission/Vision/Values'),
  fields: [
    {
      name: 'mission',
      type: 'textarea',
      label: 'Mission',
      required: true,
      admin: { description: 'What we do and who for, in the words signed off in the brand kit.' },
    },
    {
      name: 'vision',
      type: 'textarea',
      label: 'Vision',
      required: true,
      admin: { description: 'Where we are going, in the words signed off in the brand kit.' },
    },
    {
      name: 'values',
      type: 'array',
      label: 'Values',
      labels: { singular: 'Value', plural: 'Values' },
      required: true,
      minRows: 3,
      maxRows: 8,
      admin: { description: 'Three to eight. Keep them to the set signed off in the brand kit.' },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Value',
          required: true,
          admin: { description: 'One or two words, e.g. "Ownership".' },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'What it means here',
          required: true,
          admin: {
            description: 'A sentence on how it shows up in the work, not a dictionary definition.',
          },
        },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      label: 'How to arrange it',
      defaultValue: 'grid',
      options: [
        { label: 'Tabs', value: 'tabs' },
        { label: 'Grid', value: 'grid' },
        { label: 'Stacked', value: 'stacked' },
      ],
      admin: {
        description:
          'A grid shows everything at once and is the safe choice. Tabs hide all but one at a time. Stacked runs them full width down the page.',
      },
    },
  ],
}
