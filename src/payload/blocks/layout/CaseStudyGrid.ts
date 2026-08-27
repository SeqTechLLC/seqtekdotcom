import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { requiredWhen } from '../conditional'

type CaseStudyGridSibling = { source?: string }

// Per BLOCK_LIBRARY.md §5.5.
export const CaseStudyGrid: Block = {
  slug: 'case-study-grid',
  interfaceName: 'CaseStudyGridBlock',
  labels: { singular: 'Case study grid', plural: 'Case study grids' },
  admin: blockAdmin('content-collection', 'case-study-grid', 'Case study grid'),
  fields: [
    headingField(),
    {
      name: 'source',
      type: 'select',
      label: 'How to choose the case studies',
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
      label: 'Case studies to show',
      hasMany: true,
      ...requiredWhen<CaseStudyGridSibling>((d) => d?.source === 'manual', {
        description:
          'The exact studies, in the order you pick them. Only used while the source above is "Manual".',
      }),
    },
    {
      name: 'industry',
      type: 'relationship',
      relationTo: 'industries',
      label: 'Which industry',
      ...requiredWhen<CaseStudyGridSibling>((d) => d?.source === 'by-industry', {
        description: 'Shows the newest studies whose client is in this sector.',
      }),
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      label: 'Which service',
      ...requiredWhen<CaseStudyGridSibling>((d) => d?.source === 'by-service', {
        description: 'Shows the newest studies where we delivered this service.',
      }),
    },
    {
      name: 'limit',
      type: 'number',
      label: 'How many to show',
      defaultValue: 3,
      min: 1,
      max: 9,
      admin: { description: 'Caps the grid at this many cards, whichever way it is filled.' },
    },
  ],
}
