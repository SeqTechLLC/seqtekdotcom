import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.6. Technology tag display (case-study pattern).
export const TechStack: Block = {
  slug: 'tech-stack',
  interfaceName: 'TechStackBlock',
  labels: { singular: 'Tech stack', plural: 'Tech stack blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'linkUrl',
          type: 'text',
          admin: { description: 'Optional link to a service page or external reference.' },
        },
      ],
    },
  ],
}
