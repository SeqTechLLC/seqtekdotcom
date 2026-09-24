import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { backgroundField, headingField, introField } from '../../fields/blockCopy'
import { mediaRowLabel } from '../../fields/mediaRowLabel'

// A set of pictures, or a strip of logos (WordPress "Gallery"). Replaces
// `logo-bar` and `client-logo-grid` as the `logos` layout. There is no column
// control: the renderer picks the column count from how many items there are
// (docs/planning/block-consolidation.md). One-off figures use `image`.
export const Gallery: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  admin: blockAdmin('content', 'gallery', 'Gallery'),
  fields: [
    headingField(),
    introField(),
    {
      name: 'items',
      type: 'array',
      label: 'Images',
      labels: { singular: 'Image', plural: 'Images' },
      required: true,
      minRows: 1,
      admin: {
        description:
          'The pictures or logos, in the order you arrange them. Add as many as you have; the layout fits the count.',
        components: {
          RowLabel: mediaRowLabel({
            singular: 'Image',
            textFields: ['caption'],
            uploadField: 'image',
          }),
        },
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
          required: true,
          admin: {
            description:
              'Pick from Media, or upload. Landscape photos sit best in a grid; a logo should be a transparent PNG or SVG so it sits on any background.',
          },
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption',
          admin: {
            description:
              'Optional line under the image, or a small name under a logo. It also names this row when the list is collapsed.',
          },
        },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      label: 'How to arrange them',
      defaultValue: 'grid',
      admin: {
        description:
          'A grid shows every picture at once and picks its columns from how many there are. A carousel puts them in one swipeable row, roughly one picture wide on a phone and three on a desktop, which suits a long set. Logos draws client or partner logos in gray, turning to full color when a visitor points at one.',
      },
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Carousel', value: 'carousel' },
        { label: 'Logos', value: 'logos' },
      ],
    },
    backgroundField(),
  ],
}
