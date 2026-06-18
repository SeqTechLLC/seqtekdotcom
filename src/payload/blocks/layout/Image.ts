import type { Block } from 'payload'

// Single-figure image block (spec 010 / ADR 0009 gap-fill, FR-005). The
// one-off counterpart to `gallery`: a plain captioned figure droppable into
// any page layout. Honors the reading-column rule (DESIGN_SYSTEM §11.4) in
// its render component, not here. Per BLOCK_LIBRARY.md §5.2.
export const Image: Block = {
  slug: 'image',
  interfaceName: 'ImageBlock',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { label: 'Narrow', value: 'narrow' },
        { label: 'Standard', value: 'standard' },
        { label: 'Wide', value: 'wide' },
        { label: 'Full bleed', value: 'full' },
      ],
    },
    {
      name: 'alignment',
      type: 'select',
      defaultValue: 'center',
      options: [
        { label: 'Center', value: 'center' },
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
  ],
}
