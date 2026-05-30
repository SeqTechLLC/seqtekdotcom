import type { Block } from 'payload'

import { requiredWhen } from '../conditional'

type PostListSibling = { source?: string }

// Per BLOCK_LIBRARY.md §5.5 latest-insights variant. Modeled distinctly to
// distinguish a generic post listing from the homepage "latest insights"
// composition affordance.
export const PostList: Block = {
  slug: 'post-list',
  interfaceName: 'PostListBlock',
  labels: { singular: 'Post list', plural: 'Post lists' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'source',
      type: 'select',
      required: true,
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
