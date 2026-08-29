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
          'At least two, drawn as cards in the order you pick them. The cards are not links: the per-industry pages do not exist yet, so they name the industries rather than sending anyone to a dead page (ROADMAP IND-1).',
      },
    },
  ],
}
