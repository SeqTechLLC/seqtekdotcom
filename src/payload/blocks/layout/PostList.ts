import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { requiredWhen } from '../conditional'

type PostListSibling = { source?: string }

// Per BLOCK_LIBRARY.md §5.5 latest-insights variant. Modeled distinctly to
// distinguish a generic post listing from the homepage "latest insights"
// composition affordance.
export const PostList: Block = {
  slug: 'post-list',
  interfaceName: 'PostListBlock',
  labels: { singular: 'Post list', plural: 'Post lists' },
  admin: blockAdmin('content-collection', 'post-list', 'Post list block preview'),
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'source',
      type: 'select',
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
      ...requiredWhen<PostListSibling>((d) => d?.source === 'by-category'),
    },
    {
      name: 'manualItems',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      ...requiredWhen<PostListSibling>((d) => d?.source === 'manual'),
    },
    { name: 'limit', type: 'number', defaultValue: 3, min: 1, max: 12 },
  ],
}
