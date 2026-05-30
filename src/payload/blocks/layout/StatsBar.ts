import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.3. `items` is conditionally required when
// source = 'inline'; the from-site-settings path renders the canonical set
// at template time and ignores the inline array.
export const StatsBar: Block = {
  slug: 'stats-bar',
  interfaceName: 'StatsBarBlock',
  labels: { singular: 'Stats bar', plural: 'Stats bars' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'inline',
      options: [
        { label: 'Inline', value: 'inline' },
        { label: 'From site settings', value: 'from-site-settings' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 3,
      maxRows: 5,
      admin: { condition: (_, siblingData) => siblingData?.source === 'inline' },
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'suffix', type: 'text' },
      ],
    },
  ],
}
