import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.6 markets-map.
export const LocationsList: Block = {
  slug: 'locations-list',
  interfaceName: 'LocationsListBlock',
  labels: { singular: 'Locations list', plural: 'Locations lists' },
  admin: blockAdmin('content-collection', 'locations-list', 'Locations list'),
  fields: [
    headingField({ fallback: 'Where we work' }),
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'locations',
      label: 'Markets to show',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: {
        description:
          'Drawn as cards in the order you pick them. The cards are not links: the per-location pages do not exist yet, so they name the places rather than sending anyone to a dead page (ROADMAP SVC-2).',
      },
    },
  ],
}
