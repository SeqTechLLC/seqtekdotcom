import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { eyebrowField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.1: client/industry eyebrow, outcome-focused
// headline, the headline metric (number + label + context), and a project-
// relevant hero image. All required.
export const CaseStudyHero: Block = {
  slug: 'case-study-hero',
  interfaceName: 'CaseStudyHeroBlock',
  labels: { singular: 'Case study hero', plural: 'Case study heroes' },
  admin: blockAdmin('hero', 'case-study-hero', 'Case study hero'),
  fields: [
    eyebrowField({ required: true }),
    {
      name: 'headline',
      type: 'text',
      label: 'Headline',
      required: true,
      admin: { description: 'The result this engagement produced, in one line.' },
    },
    {
      name: 'metric',
      type: 'group',
      label: 'Headline number',
      admin: {
        description:
          'The one number this study is remembered for. It is set in large type under the headline, against a rule.',
      },
      fields: [
        {
          name: 'number',
          type: 'text',
          label: 'The number',
          required: true,
          admin: { description: 'Written as it should read, e.g. "40%", "3x", "$1.2M".' },
        },
        {
          name: 'label',
          type: 'text',
          label: 'What it measures',
          required: true,
          admin: { description: 'A few words under the number, e.g. "faster ticket turnaround".' },
        },
        {
          name: 'context',
          type: 'text',
          label: 'Qualifier',
          admin: { description: 'Optional smaller line, e.g. "in the first six months".' },
        },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Header image',
      required: true,
      admin: {
        description: 'The image behind the top of the case study. Landscape, at least 1600px wide.',
      },
    },
  ],
}
