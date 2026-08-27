import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const Figure: Block = {
  slug: 'figure',
  interfaceName: 'FigureBlock',
  labels: { singular: 'Figure', plural: 'Figures' },
  admin: inlineBlockAdmin('figure', 'Figure icon'),
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text', required: true },
  ],
}
