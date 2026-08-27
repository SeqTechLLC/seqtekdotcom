import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.5.
export const IndustryGrid: Block = {
  slug: 'industry-grid',
  interfaceName: 'IndustryGridBlock',
  labels: { singular: 'Industry grid', plural: 'Industry grids' },
  admin: blockAdmin('content-collection', 'industry-grid', 'Industry grid'),
  fields: [
    headingField(),
    {
      name: 'industries',
      type: 'relationship',
      relationTo: 'industries',
      label: 'Industries to show',
      hasMany: true,
      required: true,
      minRows: 2,
      admin: {
        description:
          'At least two, drawn as cards in the order you pick them. Each card links to /industries/<name>, and that route does not exist yet, so the cards currently lead to a 404 (ROADMAP IND-1).',
      },
    },
  ],
}
