import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.6 workshop-progression.
export const WorkshopList: Block = {
  slug: 'workshop-list',
  interfaceName: 'WorkshopListBlock',
  labels: { singular: 'Workshop list', plural: 'Workshop lists' },
  admin: blockAdmin('content-collection', 'workshop-list', 'Workshop list'),
  fields: [
    headingField(),
    {
      name: 'workshops',
      type: 'relationship',
      relationTo: 'workshops',
      label: 'Workshops to show',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: {
        description: 'Drawn as cards in the order you pick them. Add them under Workshops first.',
      },
    },
  ],
}
