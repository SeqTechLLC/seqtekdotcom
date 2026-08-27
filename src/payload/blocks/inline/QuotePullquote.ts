import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const QuotePullquote: Block = {
  slug: 'quote-pullquote',
  interfaceName: 'QuotePullquoteBlock',
  labels: { singular: 'Pull quote', plural: 'Pull quotes' },
  admin: inlineBlockAdmin('quote-pullquote', 'Pull quote icon'),
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'attribution', type: 'text' },
  ],
}
