import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const QuotePullquote: Block = {
  slug: 'quote-pullquote',
  interfaceName: 'QuotePullquoteBlock',
  labels: { singular: 'Pull quote', plural: 'Pull quotes' },
  admin: inlineBlockAdmin('quote-pullquote', 'Pull quote icon'),
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      label: 'Quote',
      required: true,
      admin: {
        description:
          'The line to lift out of the surrounding text, without quotation marks. It is set large, so keep it to a sentence or two.',
      },
    },
    {
      name: 'attribution',
      type: 'text',
      label: 'Who said it',
      admin: {
        description:
          'Optional name and title under the quote. Leave blank when lifting a line from the article itself.',
      },
    },
  ],
}
