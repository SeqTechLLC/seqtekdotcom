import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.3.
export const MetricDisplay: Block = {
  slug: 'metric-display',
  interfaceName: 'MetricDisplayBlock',
  labels: { singular: 'Metric display', plural: 'Metric displays' },
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
