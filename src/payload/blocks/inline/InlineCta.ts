import type { Block } from 'payload'

export const InlineCta: Block = {
  slug: 'inline-cta',
  interfaceName: 'InlineCtaBlock',
  labels: { singular: 'Inline CTA', plural: 'Inline CTAs' },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'url', type: 'text', required: true },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Ghost', value: 'ghost' },
        { label: 'Link', value: 'link' },
      ],
    },
  ],
}
