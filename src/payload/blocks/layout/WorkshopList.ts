import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.6 workshop-progression.
export const WorkshopList: Block = {
  slug: 'workshop-list',
  interfaceName: 'WorkshopListBlock',
  labels: { singular: 'Workshop list', plural: 'Workshop lists' },
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
