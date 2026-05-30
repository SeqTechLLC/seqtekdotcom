import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.2. `number` is auto-derived from array order at
// render time; not exposed as a field.
export const ProcessSteps: Block = {
  slug: 'process-steps',
  interfaceName: 'ProcessStepsBlock',
  labels: { singular: 'Process steps', plural: 'Process steps blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'icon', type: 'text' },
      ],
    },
  ],
}
