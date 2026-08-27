import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.6. Bulleted lessons (case-study pattern).
export const KeyTakeaways: Block = {
  slug: 'key-takeaways',
  interfaceName: 'KeyTakeawaysBlock',
  labels: { singular: 'Key takeaways', plural: 'Key takeaways blocks' },
  admin: blockAdmin('specialty', 'key-takeaways', 'Key takeaways'),
  fields: [
    headingField({ fallback: 'Key takeaways' }),
    {
      name: 'items',
      type: 'array',
      label: 'Takeaways',
      labels: { singular: 'Takeaway', plural: 'Takeaways' },
      required: true,
      minRows: 3,
      maxRows: 6,
      admin: {
        description:
          'Three to six points a reader should leave with. Put this near the top of a long piece so a skimmer gets the argument.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Takeaway',
          required: true,
          admin: { description: 'One point, in a full sentence.' },
        },
      ],
    },
  ],
}
