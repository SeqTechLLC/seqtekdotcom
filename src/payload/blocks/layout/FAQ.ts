import type { Block } from 'payload'

import { editorConfig } from '../../editor/editorConfig'

// Per BLOCK_LIBRARY.md §5.2. Emits FAQPage JSON-LD at render time.
export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 2,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true, editor: editorConfig },
      ],
    },
  ],
}
