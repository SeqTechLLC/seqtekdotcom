import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

import { safeUrlValidate } from '../../fields/url'

export const InlineCta: Block = {
  slug: 'inline-cta',
  interfaceName: 'InlineCtaBlock',
  labels: { singular: 'Inline CTA', plural: 'Inline CTAs' },
  admin: inlineBlockAdmin('inline-cta', 'Inline CTA icon'),
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'url', type: 'text', required: true, validate: safeUrlValidate },
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
