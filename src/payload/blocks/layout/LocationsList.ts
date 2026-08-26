import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.6 markets-map.
export const LocationsList: Block = {
  slug: 'locations-list',
  interfaceName: 'LocationsListBlock',
  labels: { singular: 'Locations list', plural: 'Locations lists' },
  admin: blockAdmin('content-collection', 'locations-list', 'Locations list block preview'),
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      required: true,
      minRows: 1,
    },
  ],
}
