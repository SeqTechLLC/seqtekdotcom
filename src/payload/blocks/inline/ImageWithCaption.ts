import type { Block } from 'payload'

export const ImageWithCaption: Block = {
  slug: 'image-with-caption',
  interfaceName: 'ImageWithCaptionBlock',
  labels: { singular: 'Image with caption', plural: 'Images with captions' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}
