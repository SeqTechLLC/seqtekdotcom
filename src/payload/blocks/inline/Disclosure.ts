import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const Disclosure: Block = {
  slug: 'disclosure',
  interfaceName: 'DisclosureBlock',
  labels: { singular: 'Disclosure', plural: 'Disclosures' },
  admin: inlineBlockAdmin('disclosure', 'Disclosure icon'),
  fields: [
    { name: 'summary', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
  ],
}
