import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { eyebrowField } from '../../fields/blockCopy'
import { ctaField } from '../../fields/cta'

// Per BLOCK_LIBRARY.md §6 (Homepage composition row 1): hero block above the
// fold with required primary + secondary CTAs. Modeled as a distinct block
// (rather than reusing `hero`) because the homepage requires both CTAs
// (acceptance-test-of-record) and uses a display-size headline.
export const HomepageHero: Block = {
  slug: 'homepage-hero',
  interfaceName: 'HomepageHeroBlock',
  labels: { singular: 'Homepage hero', plural: 'Homepage heroes' },
  admin: blockAdmin('hero', 'homepage-hero', 'Homepage hero'),
  fields: [
    eyebrowField(),
    {
      name: 'headline',
      type: 'text',
      label: 'Headline',
      required: true,
      admin: {
        description:
          'The largest line on the site. Say what we do for a client in their words. This is the one sentence most visitors read.',
      },
    },
    {
      name: 'subheadline',
      type: 'textarea',
      label: 'Supporting sentence',
      admin: { description: 'One or two sentences under the headline.' },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background image',
      admin: {
        description:
          'Sits behind the words, so pick something with quiet space where the text falls. Landscape, at least 2000px wide.',
      },
    },
    ctaField({
      name: 'primaryCta',
      label: 'Main button',
      description: 'The homepage asks for one thing above all. This is it.',
      required: true,
    }),
    ctaField({
      name: 'secondaryCta',
      label: 'Second button',
      description:
        'The softer path for a visitor who is not ready to talk yet, e.g. "See our work". Required here by design.',
      required: true,
    }),
  ],
}
