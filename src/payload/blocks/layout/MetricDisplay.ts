import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.3.
export const MetricDisplay: Block = {
  slug: 'metric-display',
  interfaceName: 'MetricDisplayBlock',
  labels: { singular: 'Metric display', plural: 'Metric displays' },
  admin: blockAdmin('social-proof', 'metric-display', 'Metric display block preview'),
  fields: [
    { name: 'number', type: 'text', required: true },
    { name: 'label', type: 'text', required: true },
    { name: 'context', type: 'text' },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'accent',
      options: [
        { label: 'Accent', value: 'accent' },
        { label: 'Inverse', value: 'inverse' },
      ],
    },
  ],
}
