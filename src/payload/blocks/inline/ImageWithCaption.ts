import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const ImageWithCaption: Block = {
  slug: 'image-with-caption',
  interfaceName: 'ImageWithCaptionBlock',
  labels: { singular: 'Image with caption', plural: 'Images with captions' },
  admin: inlineBlockAdmin('image-with-caption', 'Image with caption icon'),
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
      admin: { description: 'Optional line under the image, shown to everyone.' },
    },
  ],
}
