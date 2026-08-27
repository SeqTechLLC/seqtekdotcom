import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { mediaRowLabel } from '../../fields/mediaRowLabel'

// 1..N image gallery block (spec 010 / ADR 0009 gap-fill, FR-005) — the
// "add a one-to-many picture section to any page layout" block. Workshop
// `photos[]` migrates here; one-off figures use `image`. Captions + alt come
// from the Media collection. Per BLOCK_LIBRARY.md §5.2.
export const Gallery: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  admin: blockAdmin('content', 'gallery', 'Gallery'),
  fields: [
    headingField(),
    {
      name: 'items',
      type: 'array',
      label: 'Images',
      labels: { singular: 'Image', plural: 'Images' },
      required: true,
      minRows: 1,
      admin: {
        description: 'The pictures in this gallery, in the order you arrange them.',
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
            description: 'Pick from Media, or upload. Landscape images sit best in a grid.',
          },
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption',
          admin: {
            description:
              'Optional line under the image. It also names this row when the list is collapsed.',
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
          'A grid shows every image at once. A carousel puts them in one swipeable row, roughly one image wide on a phone and three on a desktop, which suits a long set.',
      },
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Carousel', value: 'carousel' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      label: 'Images per row',
      defaultValue: '3',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
      // Only meaningful for the grid layout; carousel ignores column count.
      admin: {
        condition: (_, siblingData) => siblingData?.layout !== 'carousel',
        description:
          'How many fit across on a wide screen. Phones always stack. Hidden while the carousel is selected, which ignores it.',
      },
    },
  ],
}
