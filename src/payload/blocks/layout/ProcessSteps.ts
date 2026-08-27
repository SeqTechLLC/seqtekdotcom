import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.2. `number` is auto-derived from array order at
// render time; not exposed as a field.
export const ProcessSteps: Block = {
  slug: 'process-steps',
  interfaceName: 'ProcessStepsBlock',
  labels: { singular: 'Process steps', plural: 'Process steps blocks' },
  admin: blockAdmin('content', 'process-steps', 'Process steps'),
  fields: [
    headingField(),
    {
      name: 'steps',
      type: 'array',
      label: 'Steps',
      labels: { singular: 'Step', plural: 'Steps' },
      required: true,
      minRows: 2,
      maxRows: 6,
      admin: {
        description: 'Two to six steps, numbered automatically in the order you arrange them.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Step name',
          required: true,
          admin: { description: 'A few words, e.g. "Discovery workshop".' },
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'What happens',
          required: true,
          admin: { description: 'One or two sentences on what we do and what the client gets.' },
        },
        {
          name: 'icon',
          type: 'text',
          label: 'Icon name',
          admin: {
            description:
              'Leave this blank. There is no icon set behind it yet, so whatever you type is printed on the page as small text (ROADMAP INERT-2).',
          },
        },
      ],
    },
  ],
}
