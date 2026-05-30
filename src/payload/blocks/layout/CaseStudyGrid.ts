import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.5.
export const CaseStudyGrid: Block = {
  slug: 'case-study-grid',
  interfaceName: 'CaseStudyGridBlock',
  labels: { singular: 'Case study grid', plural: 'Case study grids' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Latest', value: 'latest' },
        { label: 'By industry', value: 'by-industry' },
        { label: 'By service', value: 'by-service' },
      ],
    },
    {
      name: 'manualItems',
      type: 'relationship',
      relationTo: 'caseStudies',
      hasMany: true,
      admin: { condition: (_, sd) => sd?.source === 'manual' },
    },
    {
      name: 'industry',
      type: 'relationship',
      relationTo: 'industries',
      admin: { condition: (_, sd) => sd?.source === 'by-industry' },
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      admin: { condition: (_, sd) => sd?.source === 'by-service' },
    },
    { name: 'limit', type: 'number', defaultValue: 3, min: 1, max: 9 },
  ],
}
