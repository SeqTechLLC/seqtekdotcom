import type { Block } from 'payload'

import { inlineBlockAdmin } from '../blockAdmin'

import { safeUrlValidate } from '../../fields/url'

export const InlineCta: Block = {
  slug: 'inline-cta',
  interfaceName: 'InlineCtaBlock',
  labels: { singular: 'Inline CTA', plural: 'Inline CTAs' },
  admin: inlineBlockAdmin('inline-cta', 'Inline CTA icon'),
  fields: [
    {
      name: 'label',
      type: 'text',
      label: 'Button text',
      required: true,
      admin: { description: 'The words on the button. Two to four words reads best.' },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Button link',
      required: true,
      validate: safeUrlValidate,
      admin: {
        description:
          'Where the button goes. A page on this site starts with a slash ("/contact"); an outside link needs the full https:// address.',
      },
    },
    {
      name: 'variant',
      type: 'select',
      label: 'Button style',
      defaultValue: 'primary',
      admin: {
        description:
          'How the link is drawn. All four are underlined: primary is bold and accent-colored, secondary is muted, and ghost and link are plain body text.',
      },
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Ghost', value: 'ghost' },
        { label: 'Link', value: 'link' },
      ],
    },
  ],
}
