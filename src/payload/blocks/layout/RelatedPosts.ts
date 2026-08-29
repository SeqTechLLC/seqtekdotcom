import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Specialty post-list variant for the bottom of post detail pages.
// It does NOT query anything: unlike the four blocks `lib/resolveLayout.ts`
// fills in, this one has no resolver, so it renders whatever `manualItems`
// holds and prints a developer placeholder when that is empty. ROADMAP tracks
// it as the UI-2 leftover.
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
          'Pick the posts to offer at the end of the page. This block does not fill itself in from categories: with nothing picked the whole section is left off the page.',
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
