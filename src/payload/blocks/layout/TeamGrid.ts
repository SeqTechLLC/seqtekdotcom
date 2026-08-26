import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Per BLOCK_LIBRARY.md §5.5. `filter` is resolved by `src/lib/resolveLayout.ts`
// before the layout reaches RenderBlocks (ROADMAP UI-2) — the render component
// only ever draws the items it is handed.
export const TeamGrid: Block = {
  slug: 'team-grid',
  interfaceName: 'TeamGridBlock',
  labels: { singular: 'Team grid', plural: 'Team grids' },
  admin: blockAdmin('content-collection', 'team-grid', 'Team grid block preview'),
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'filter',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'Leadership only', value: 'leadership-only' },
        { label: 'All', value: 'all' },
      ],
      admin: {
        description:
          'Which team members to show. "Leadership only" shows everyone marked as leadership; "All" shows the whole team, leadership first.',
      },
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
          'Optional. Leave this empty and the filter above chooses the members. Pick people here only when you want an exact set in an exact order — your picks win over the filter.',
      },
    },
  ],
}
