import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.5.
export const ServicePillarCards: Block = {
  slug: 'service-pillar-cards',
  interfaceName: 'ServicePillarCardsBlock',
  labels: { singular: 'Service pillar cards', plural: 'Service pillar cards blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'pillars',
      type: 'relationship',
      relationTo: 'servicePillars',
      hasMany: true,
      required: true,
      minRows: 1,
    },
  ],
}
