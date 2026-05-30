import type { Block } from 'payload'

import { requiredWhen } from '../conditional'

type ServiceCardsSibling = { source?: string }

// Per BLOCK_LIBRARY.md §5.5.
export const ServiceCards: Block = {
  slug: 'service-cards',
  interfaceName: 'ServiceCardsBlock',
  labels: { singular: 'Service cards', plural: 'Service cards blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'By pillar', value: 'by-pillar' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      name: 'pillar',
      type: 'relationship',
      relationTo: 'servicePillars',
      ...requiredWhen<ServiceCardsSibling>((d) => d?.source === 'by-pillar'),
    },
    {
      name: 'manualItems',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      ...requiredWhen<ServiceCardsSibling>((d) => d?.source === 'manual'),
    },
  ],
}
