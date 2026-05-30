import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.2.
export const Deliverables: Block = {
  slug: 'deliverables',
  interfaceName: 'DeliverablesBlock',
  labels: { singular: 'Deliverables', plural: 'Deliverables blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 8,
      fields: [{ name: 'label', type: 'text', required: true }],
    },
  ],
}
