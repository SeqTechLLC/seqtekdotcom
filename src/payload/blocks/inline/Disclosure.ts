import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const Disclosure: Block = {
  slug: 'disclosure',
  interfaceName: 'DisclosureBlock',
  labels: { singular: 'Disclosure', plural: 'Disclosures' },
  admin: inlineBlockAdmin('disclosure', 'Disclosure icon'),
  fields: [
    {
      name: 'summary',
      type: 'text',
      label: 'Closed label',
      required: true,
      admin: {
        description: 'The line the reader sees and clicks to open, e.g. "How we price this".',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Hidden content',
      required: true,
      admin: {
        description:
          'What appears when it is opened. It starts closed, so nothing essential should live only in here.',
      },
    },
  ],
}
