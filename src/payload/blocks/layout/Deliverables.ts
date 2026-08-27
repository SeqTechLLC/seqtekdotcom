import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.2.
export const Deliverables: Block = {
  slug: 'deliverables',
  interfaceName: 'DeliverablesBlock',
  labels: { singular: 'Deliverables', plural: 'Deliverables blocks' },
  admin: blockAdmin('content', 'deliverables', 'Deliverables'),
  fields: [
    headingField(),
    {
      name: 'items',
      type: 'array',
      label: 'What they walk away with',
      labels: { singular: 'Deliverable', plural: 'Deliverables' },
      required: true,
      minRows: 3,
      maxRows: 8,
      admin: { description: 'Three to eight concrete things. Nouns, not promises.' },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Deliverable',
          required: true,
          admin: { description: 'One item, e.g. "A prioritised backlog".' },
        },
      ],
    },
  ],
}
