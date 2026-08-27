import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Generic disclosure pattern. Distinct from FAQ in that the heading/body
// shape is generic (not Q/A). Neither block emits FAQPage JSON-LD — an
// earlier comment on FAQ claimed it did, and `components/sections/FAQ.tsx`
// does not (spec 011 US4 review).
export const Accordion: Block = {
  slug: 'accordion',
  interfaceName: 'AccordionBlock',
  labels: { singular: 'Accordion', plural: 'Accordions' },
  admin: blockAdmin('specialty', 'accordion', 'Accordion'),
  fields: [
    headingField(),
    {
      name: 'items',
      type: 'array',
      label: 'Sections',
      labels: { singular: 'Section', plural: 'Sections' },
      required: true,
      minRows: 1,
      admin: {
        description:
          'Each row is a closed panel a reader clicks to open. Use it for detail most readers will skip.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Panel title',
          required: true,
          admin: { description: 'The line the reader clicks. Keep it short enough to scan.' },
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Panel content',
          required: true,
          admin: { description: 'What appears when the panel is opened.' },
        },
      ],
    },
  ],
}
