import type { Block } from 'payload'

// Generic disclosure pattern. Distinct from FAQ in that the items don't
// emit FAQPage JSON-LD and the heading/body shape is generic (not Q/A).
export const Accordion: Block = {
  slug: 'accordion',
  interfaceName: 'AccordionBlock',
  labels: { singular: 'Accordion', plural: 'Accordions' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
      ],
    },
  ],
}
