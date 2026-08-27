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
      label: 'Kind of note',
      required: true,
      defaultValue: 'info',
      admin: {
        description:
          'Sets the colour and the icon. Warning is the loudest, so save it for something a reader would regret missing.',
      },
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Tip', value: 'tip' },
        { label: 'Warning', value: 'warning' },
        { label: 'Note', value: 'note' },
      ],
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Note text',
      required: true,
      admin: { description: 'A sentence or two set apart from the surrounding paragraphs.' },
    },
  ],
}
