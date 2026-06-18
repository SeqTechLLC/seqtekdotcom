import type { Block } from 'payload'

// 1..N image gallery block (spec 010 / ADR 0009 gap-fill, FR-005) — the
// "add a one-to-many picture section to any page layout" block. Workshop
// `photos[]` migrates here; one-off figures use `image`. Captions + alt come
// from the Media collection. Per BLOCK_LIBRARY.md §5.2.
export const Gallery: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Carousel', value: 'carousel' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
      // Only meaningful for the grid layout; carousel ignores column count.
      admin: { condition: (_, siblingData) => siblingData?.layout !== 'carousel' },
    },
  ],
}
