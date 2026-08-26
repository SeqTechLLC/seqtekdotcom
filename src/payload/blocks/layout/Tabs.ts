import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Horizontal tab strip with a single visible panel. Useful for grouping
// alternative views of related content (e.g., engagement models).
export const Tabs: Block = {
  slug: 'tabs',
  interfaceName: 'TabsBlock',
  labels: { singular: 'Tabs', plural: 'Tabs blocks' },
  admin: blockAdmin('specialty', 'tabs', 'Tabs block preview'),
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'tabs',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
      ],
    },
  ],
}
