import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const Callout: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: 'Callout', plural: 'Callouts' },
  admin: inlineBlockAdmin('callout', 'Callout icon'),
  fields: [
    {
      name: 'tone',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Tip', value: 'tip' },
        { label: 'Warning', value: 'warning' },
        { label: 'Note', value: 'note' },
      ],
    },
    { name: 'body', type: 'textarea', required: true },
  ],
}
