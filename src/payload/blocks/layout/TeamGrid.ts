import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.5. Renderer queries the teamMembers collection by
// the chosen filter at template time (Phase 3).
export const TeamGrid: Block = {
  slug: 'team-grid',
  interfaceName: 'TeamGridBlock',
  labels: { singular: 'Team grid', plural: 'Team grids' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'filter',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'Leadership only', value: 'leadership-only' },
        { label: 'Featured', value: 'featured' },
        { label: 'All', value: 'all' },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'cards',
      options: [
        { label: 'Cards', value: 'cards' },
        { label: 'Compact', value: 'compact' },
      ],
    },
    {
      name: 'manualItems',
      type: 'relationship',
      relationTo: 'teamMembers',
      hasMany: true,
      admin: {
        description:
          'Optional manual override — when set, ignores filter and renders these team members in order.',
      },
    },
  ],
}
