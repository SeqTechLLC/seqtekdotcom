import type { Block } from 'payload'

// Specialty post-list variant for the bottom of post detail pages.
// Distinct from PostList because the source is always "related" — the
// renderer queries posts sharing a category/tag with the current doc.
export const RelatedPosts: Block = {
  slug: 'related-posts',
  interfaceName: 'RelatedPostsBlock',
  labels: { singular: 'Related posts', plural: 'Related posts blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'manualItems',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        description:
          'Optional manual override; falls back to category-derived list at render time.',
      },
    },
    { name: 'limit', type: 'number', defaultValue: 3, min: 1, max: 6 },
  ],
}
