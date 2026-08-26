import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

export const ImageWithCaption: Block = {
  slug: 'image-with-caption',
  interfaceName: 'ImageWithCaptionBlock',
  labels: { singular: 'Image with caption', plural: 'Images with captions' },
  admin: inlineBlockAdmin('image-with-caption', 'Image with caption icon'),
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}
