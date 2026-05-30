import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.5.
export const FeaturedCaseStudy: Block = {
  slug: 'featured-case-study',
  interfaceName: 'FeaturedCaseStudyBlock',
  labels: { singular: 'Featured case study', plural: 'Featured case studies' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'caseStudy',
      type: 'relationship',
      relationTo: 'caseStudies',
      required: true,
    },
  ],
}
