import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.1: client/industry eyebrow, outcome-focused
// headline, the headline metric (number + label + context), and a project-
// relevant hero image. All required.
export const CaseStudyHero: Block = {
  slug: 'case-study-hero',
  interfaceName: 'CaseStudyHeroBlock',
  labels: { singular: 'Case study hero', plural: 'Case study heroes' },
  fields: [
    { name: 'eyebrow', type: 'text', required: true },
    { name: 'headline', type: 'text', required: true },
    {
      name: 'metric',
      type: 'group',
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'context', type: 'text' },
      ],
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
  ],
}
