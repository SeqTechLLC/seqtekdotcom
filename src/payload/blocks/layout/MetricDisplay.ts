import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.3.
export const MetricDisplay: Block = {
  slug: 'metric-display',
  interfaceName: 'MetricDisplayBlock',
  labels: { singular: 'Metric display', plural: 'Metric displays' },
  admin: blockAdmin('social-proof', 'metric-display', 'Metric display'),
  fields: [
    {
      name: 'number',
      type: 'text',
      label: 'The number',
      required: true,
      admin: {
        description:
          'Written as it should read, e.g. "40%", "3x", "$1.2M". Set in very large type.',
      },
    },
    {
      name: 'label',
      type: 'text',
      label: 'What it measures',
      required: true,
      admin: { description: 'A few words under the number, e.g. "faster ticket turnaround".' },
    },
    {
      name: 'context',
      type: 'text',
      label: 'Qualifier',
      admin: { description: 'Optional smaller line, e.g. "measured over the first six months".' },
    },
    {
      name: 'background',
      type: 'select',
      label: 'Background',
      defaultValue: 'accent',
      options: [
        { label: 'Accent (warm)', value: 'accent' },
        { label: 'Inverse (dark)', value: 'inverse' },
      ],
      admin: {
        description:
          'The colour of the band this number sits in. Alternate it from the section above.',
      },
    },
  ],
}
