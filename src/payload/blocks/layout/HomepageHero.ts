import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §6 (Homepage composition row 1): hero block above the
// fold with required primary + secondary CTAs. Modeled as a distinct block
// (rather than reusing `hero`) because the homepage requires both CTAs
// (acceptance-test-of-record) and uses a display-size headline.
export const HomepageHero: Block = {
  slug: 'homepage-hero',
  interfaceName: 'HomepageHeroBlock',
  labels: { singular: 'Homepage hero', plural: 'Homepage heroes' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'headline', type: 'text', required: true },
    { name: 'subheadline', type: 'textarea' },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
    {
      name: 'primaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}
