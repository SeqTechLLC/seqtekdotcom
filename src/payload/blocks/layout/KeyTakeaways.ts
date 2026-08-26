import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.6. Bulleted lessons (case-study pattern).
export const KeyTakeaways: Block = {
  slug: 'key-takeaways',
  interfaceName: 'KeyTakeawaysBlock',
  labels: { singular: 'Key takeaways', plural: 'Key takeaways blocks' },
  admin: blockAdmin('specialty', 'key-takeaways', 'Key takeaways block preview'),
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 6,
      fields: [{ name: 'label', type: 'text', required: true }],
    },
  ],
}
