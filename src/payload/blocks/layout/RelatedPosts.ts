import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Specialty post-list variant for the bottom of post detail pages.
// Distinct from PostList because the source is always "related" — the
// renderer queries posts sharing a category/tag with the current doc.
export const RelatedPosts: Block = {
  slug: 'related-posts',
  interfaceName: 'RelatedPostsBlock',
  labels: { singular: 'Related posts', plural: 'Related posts blocks' },
  admin: blockAdmin('content-collection', 'related-posts', 'Related posts'),
  fields: [
    headingField({ fallback: 'Related posts' }),
    {
      name: 'manualItems',
      type: 'relationship',
      relationTo: 'posts',
      label: 'Posts to show',
      hasMany: true,
      admin: {
        // ROADMAP UI-2 leftover: unlike `post-list`, this block has no
        // resolver in `lib/resolveLayout.ts`, so an empty pick renders a
        // developer placeholder rather than a derived list. Say so plainly
        // rather than repeat the old description's claim that it fills itself.
        description:
          'Pick the posts to offer at the end of the page. This block does not fill itself in, and left empty it prints a developer note on the published page, so either pick posts or remove the block (ROADMAP UI-2 leftover).',
      },
    },
    {
      name: 'limit',
      type: 'number',
      label: 'How many to show',
      defaultValue: 3,
      min: 1,
      max: 6,
      admin: { description: 'Caps the list at this many posts.' },
    },
  ],
}
