import type { Block } from 'payload'

// Variant of LogoBar that renders client logos in a denser grid (per
// BLOCK_LIBRARY.md §5.3 — modeled as a separate block per tasks.md T052
// since the layout intent differs from the linear bar treatment).
export const ClientLogoGrid: Block = {
  slug: 'client-logo-grid',
  interfaceName: 'ClientLogoGridBlock',
  labels: { singular: 'Client logo grid', plural: 'Client logo grids' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'logos',
      type: 'array',
      required: true,
      minRows: 4,
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '4',
      options: [
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
        { label: '6 columns', value: '6' },
      ],
    },
  ],
}
