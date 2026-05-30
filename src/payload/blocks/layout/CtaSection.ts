import type { Block } from 'payload'

import { safeUrlValidate } from '../../fields/url'
import { requiredWhen } from '../conditional'

type CtaSibling = { background?: string }

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
        { name: 'url', type: 'text', required: true, validate: safeUrlValidate },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text', validate: safeUrlValidate },
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
      ...requiredWhen<CtaSibling>((d) => d?.background === 'image'),
    },
  ],
}
