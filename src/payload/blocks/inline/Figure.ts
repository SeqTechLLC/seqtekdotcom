import type { Block } from 'payload'

export const Figure: Block = {
  slug: 'figure',
  interfaceName: 'FigureBlock',
  labels: { singular: 'Figure', plural: 'Figures' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text', required: true },
  ],
}
