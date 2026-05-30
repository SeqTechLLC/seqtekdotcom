import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.2. Generic shape so it can model the canonical
// localshoring vs nearshore vs offshore comparison without hardcoding the
// columns (BLOCK_LIBRARY.md §10 open question B-4 — defer to schema-generic).
export const ComparisonTable: Block = {
  slug: 'comparison-table',
  interfaceName: 'ComparisonTableBlock',
  labels: { singular: 'Comparison table', plural: 'Comparison tables' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    {
      name: 'columns',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 4,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'tagline', type: 'text' },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'dimension', type: 'text', required: true },
        {
          name: 'cells',
          type: 'array',
          required: true,
          // Cells per row must match column count; validated at render time.
          fields: [{ name: 'value', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'bestForRow',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
  ],
}
