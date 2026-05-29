import type { Block } from 'payload'

export const CtaSection: Block = {
  slug: 'cta-section',
  interfaceName: 'CtaSectionBlock',
  labels: { singular: 'CTA section', plural: 'CTA sections' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'centered',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'Split', value: 'split' },
        { label: 'Inverse', value: 'inverse' },
      ],
    },
    { name: 'headline', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    {
      name: 'primaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Accent', value: 'accent' },
        { label: 'Image', value: 'image' },
      ],
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData?.background === 'image',
      },
    },
  ],
}
