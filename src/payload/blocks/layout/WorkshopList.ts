import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.6 workshop-progression.
export const WorkshopList: Block = {
  slug: 'workshop-list',
  interfaceName: 'WorkshopListBlock',
  labels: { singular: 'Workshop list', plural: 'Workshop lists' },
  admin: blockAdmin('content-collection', 'workshop-list', 'Workshop list block preview'),
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'workshops',
      type: 'relationship',
      relationTo: 'workshops',
      hasMany: true,
      required: true,
      minRows: 1,
    },
  ],
}
