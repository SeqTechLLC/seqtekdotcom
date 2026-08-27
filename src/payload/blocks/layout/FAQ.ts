import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { editorConfig } from '../../editor/editorConfig'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.2. (An earlier comment here claimed this emits
// FAQPage JSON-LD; `components/sections/FAQ.tsx` emits none. Removed rather
// than left to mislead the next reader — spec 011 US4 review.)
export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: blockAdmin('content', 'faq', 'FAQ'),
  fields: [
    headingField({ fallback: 'Frequently asked questions' }),
    {
      name: 'items',
      type: 'array',
      label: 'Questions',
      labels: { singular: 'Question', plural: 'Questions' },
      required: true,
      minRows: 2,
      admin: {
        description:
          'At least two. Write the question the way a prospect would actually ask it, so the answer reads as an answer on the page.',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          label: 'Question',
          required: true,
          admin: {
            description: 'In the visitor\'s words, e.g. "How long does a discovery take?".',
          },
        },
        {
          name: 'answer',
          type: 'richText',
          label: 'Answer',
          required: true,
          editor: editorConfig,
          admin: { description: 'Answer it in the first sentence, then add detail.' },
        },
      ],
    },
  ],
}
