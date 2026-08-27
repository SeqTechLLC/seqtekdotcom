import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.5.
export const ServicePillarCards: Block = {
  slug: 'service-pillar-cards',
  interfaceName: 'ServicePillarCardsBlock',
  labels: { singular: 'Service pillar cards', plural: 'Service pillar cards blocks' },
  admin: blockAdmin('content-collection', 'service-pillar-cards', 'Service pillar cards'),
  fields: [
    headingField(),
    {
      name: 'pillars',
      type: 'relationship',
      relationTo: 'servicePillars',
      label: 'Pillars to show',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: {
        description: 'Drawn as cards in the order you pick them. Usually all three.',
      },
    },
  ],
}
