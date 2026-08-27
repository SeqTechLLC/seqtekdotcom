import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.5.
export const FeaturedCaseStudy: Block = {
  slug: 'featured-case-study',
  interfaceName: 'FeaturedCaseStudyBlock',
  labels: { singular: 'Featured case study', plural: 'Featured case studies' },
  admin: blockAdmin('content-collection', 'featured-case-study', 'Featured case study'),
  fields: [
    headingField({ fallback: 'Featured case study' }),
    {
      name: 'caseStudy',
      type: 'relationship',
      relationTo: 'caseStudies',
      label: 'The case study',
      required: true,
      admin: {
        description:
          'The one study to feature here, drawn large. It must already exist and be published for visitors to reach it.',
      },
    },
  ],
}
