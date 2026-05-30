import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.1: pillar landings reuse the hero shape with a
// required pillar-name eyebrow and required image. Modeled as a distinct
// block so the pillar landing template can rely on the structured fields
// without conditional fallbacks. (BLOCK_LIBRARY.md §9 rule 3.)
export const ServicePillarHero: Block = {
  slug: 'service-pillar-hero',
  interfaceName: 'ServicePillarHeroBlock',
  labels: { singular: 'Service pillar hero', plural: 'Service pillar heroes' },
  fields: [
    { name: 'pillarName', type: 'text', required: true },
    { name: 'headline', type: 'text', required: true },
    { name: 'subheadline', type: 'textarea' },
    { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'primaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
  ],
}
