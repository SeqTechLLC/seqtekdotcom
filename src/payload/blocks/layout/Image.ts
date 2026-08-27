import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

// Single-figure image block (spec 010 / ADR 0009 gap-fill, FR-005). The
// one-off counterpart to `gallery`: a plain captioned figure droppable into
// any page layout. Honors the reading-column rule (DESIGN_SYSTEM §11.4) in
// its render component, not here. Per BLOCK_LIBRARY.md §5.2.
export const Image: Block = {
  slug: 'image',
  interfaceName: 'ImageBlock',
  labels: { singular: 'Image', plural: 'Images' },
  admin: blockAdmin('content', 'image', 'Image'),
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
      admin: {
        description:
          'Optional line under the image, shown to everyone. It does not replace alt text, which is set on the image itself.',
      },
    },
    {
      name: 'width',
      type: 'select',
      label: 'Image width',
      defaultValue: 'standard',
      admin: {
        description:
          'How much of the page the image takes. "Full bleed" fills the whole content area, which is why alignment disappears when you choose it.',
      },
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
      label: 'Position on the page',
      defaultValue: 'center',
      options: [
        { label: 'Center', value: 'center' },
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      // A full-bleed figure already fills the content rail, so mx-auto /
      // mr-auto / ml-auto are no-ops there (see components/sections/Image.tsx).
      // Spec 011 T050: hide the control rather than let it look effective.
      admin: {
        condition: (_, siblingData) => siblingData?.width !== 'full',
        description:
          'Where a narrower image sits across the page. Center keeps it on the reading axis.',
      },
    },
  ],
}
