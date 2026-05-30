import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.6. Inline content (per-page authoring) is the
// default; sourcing from siteSettings is BLOCK_LIBRARY.md §10 open question
// B-3 and is deferred until a real page composition forces it.
export const MissionVisionValues: Block = {
  slug: 'mission-vision-values',
  interfaceName: 'MissionVisionValuesBlock',
  labels: { singular: 'Mission/Vision/Values', plural: 'Mission/Vision/Values blocks' },
  fields: [
    { name: 'mission', type: 'textarea', required: true },
    { name: 'vision', type: 'textarea', required: true },
    {
      name: 'values',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 8,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Tabs', value: 'tabs' },
        { label: 'Grid', value: 'grid' },
        { label: 'Stacked', value: 'stacked' },
      ],
    },
  ],
}
