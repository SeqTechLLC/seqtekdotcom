import type { Block } from 'payload'

export const QuotePullquote: Block = {
  slug: 'quote-pullquote',
  interfaceName: 'QuotePullquoteBlock',
  labels: { singular: 'Pull quote', plural: 'Pull quotes' },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'attribution', type: 'text' },
  ],
}
