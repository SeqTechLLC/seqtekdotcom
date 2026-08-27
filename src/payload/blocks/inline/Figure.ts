import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const Figure: Block = {
  slug: 'figure',
  interfaceName: 'FigureBlock',
  labels: { singular: 'Figure', plural: 'Figures' },
  admin: inlineBlockAdmin('figure', 'Figure icon'),
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      required: true,
      admin: {
        description: 'Pick from Media, or upload. Alt text is set on the image itself, not here.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      required: true,
      admin: {
        description:
          'Required here, because this block exists for images that need explaining. Use the plain image block instead when there is nothing to say.',
      },
    },
  ],
}
