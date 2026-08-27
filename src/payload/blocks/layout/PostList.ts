import type { Block } from 'payload'

import { outputContract } from '../outputContract'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { requiredWhen } from '../conditional'

type PostListSibling = { source?: string }

// Per BLOCK_LIBRARY.md §5.5 latest-insights variant. Modeled distinctly to
// distinguish a generic post listing from the homepage "latest insights"
// composition affordance.
export const PostList: Block = {
  slug: 'post-list',
  interfaceName: 'PostListBlock',
  labels: { singular: 'Post list', plural: 'Post lists' },
  admin: blockAdmin('content-collection', 'post-list', 'Post list'),
  custom: outputContract({
    // Resolved by `src/lib/resolveLayout.ts` into `manualItems` before render.
    resolvedUpstream: ['source', 'category'],
  }),
  fields: [
    headingField(),
    {
      name: 'source',
      type: 'select',
      label: 'How to choose the posts',
      required: true,
      admin: {
        // ROADMAP UI-2 review: `source` decides, and manual picks are
        // silently ignored unless it says so. Stated here because
        // `manualItems` is hidden in precisely that case.
        description:
          'How this block picks its posts. "Latest" and "By category" fill themselves in and stay current as you publish; "Manual" uses exactly the posts you pick below. Anything you have picked below is IGNORED unless this is set to "Manual".',
      },
      defaultValue: 'latest',
      options: [
        { label: 'Latest', value: 'latest' },
        { label: 'By category', value: 'by-category' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Which topic',
      ...requiredWhen<PostListSibling>((d) => d?.source === 'by-category', {
        description:
          'Shows the newest posts filed under this topic, and keeps up as you publish more.',
      }),
    },
    {
      name: 'manualItems',
      type: 'relationship',
      relationTo: 'posts',
      label: 'Posts to show',
      hasMany: true,
      ...requiredWhen<PostListSibling>((d) => d?.source === 'manual', {
        description:
          'The exact posts, in the order you pick them. Only used while the source above is "Manual".',
      }),
    },
    {
      name: 'limit',
      type: 'number',
      label: 'How many to show',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: { description: 'Caps the list at this many posts, whichever way it is filled.' },
    },
  ],
}
