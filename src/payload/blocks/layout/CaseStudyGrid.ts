import type { Block } from 'payload'

import { requiredWhen } from '../conditional'

type CaseStudyGridSibling = { source?: string }

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
      admin: {
        // ROADMAP UI-2 review: `source` decides, and manual picks are
        // silently ignored unless it says so. Stated here because
        // `manualItems` is hidden in precisely that case.
        description:
          'How this block picks its case studies. "Latest", "By industry" and "By service" fill themselves in and stay current as you publish; "Manual" uses exactly the studies you pick below. Anything you have picked below is IGNORED unless this is set to "Manual".',
      },
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
      ...requiredWhen<CaseStudyGridSibling>((d) => d?.source === 'manual'),
    },
    {
      name: 'industry',
      type: 'relationship',
      relationTo: 'industries',
      ...requiredWhen<CaseStudyGridSibling>((d) => d?.source === 'by-industry'),
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      ...requiredWhen<CaseStudyGridSibling>((d) => d?.source === 'by-service'),
    },
    { name: 'limit', type: 'number', defaultValue: 3, min: 1, max: 9 },
  ],
}
