import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.5.
export const IndustryGrid: Block = {
  slug: 'industry-grid',
  interfaceName: 'IndustryGridBlock',
  labels: { singular: 'Industry grid', plural: 'Industry grids' },
  admin: blockAdmin('content-collection', 'industry-grid', 'Industry grid block preview'),
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'industries',
      type: 'relationship',
      relationTo: 'industries',
      hasMany: true,
      required: true,
      minRows: 2,
    },
  ],
}
