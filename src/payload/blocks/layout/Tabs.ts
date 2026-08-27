import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Horizontal tab strip with a single visible panel. Useful for grouping
// alternative views of related content (e.g., engagement models).
export const Tabs: Block = {
  slug: 'tabs',
  interfaceName: 'TabsBlock',
  labels: { singular: 'Tabs', plural: 'Tabs blocks' },
  admin: blockAdmin('specialty', 'tabs', 'Tabs'),
  fields: [
    headingField(),
    {
      name: 'tabs',
      type: 'array',
      label: 'Tabs',
      labels: { singular: 'Tab', plural: 'Tabs' },
      required: true,
      minRows: 2,
      maxRows: 6,
      admin: {
        description:
          'Two to six tabs. Only one is visible at a time, so do not put anything essential in the ones after the first.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Tab name',
          required: true,
          admin: { description: 'One or two words on the tab itself.' },
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Tab content',
          required: true,
          admin: { description: 'What appears when this tab is selected.' },
        },
      ],
    },
  ],
}
