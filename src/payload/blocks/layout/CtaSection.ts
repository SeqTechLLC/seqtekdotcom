import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { ctaField } from '../../fields/cta'
import { requiredWhen } from '../conditional'

type CtaSibling = { background?: string }

export const CtaSection: Block = {
  slug: 'cta-section',
  interfaceName: 'CtaSectionBlock',
  labels: { singular: 'CTA section', plural: 'CTA sections' },
  admin: blockAdmin('cta', 'cta-section', 'CTA section'),
  fields: [
    {
      name: 'variant',
      type: 'select',
      label: 'Section style',
      required: true,
      defaultValue: 'centered',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'Split', value: 'split' },
        { label: 'Inverse', value: 'inverse' },
      ],
      admin: {
        description:
          'Centered centers the text and buttons. Split and inverse both left-align them; inverse also reverses the colors to make the section the loudest thing on the page.',
      },
    },
    {
      name: 'headline',
      type: 'text',
      label: 'Headline',
      required: true,
      admin: { description: 'The ask, in a line. Address the reader directly.' },
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Supporting sentence',
      admin: { description: 'Optional line under the headline. One sentence is plenty here.' },
    },
    ctaField({
      name: 'primaryCta',
      label: 'Main button',
      description:
        'The action this section exists to get. Required, because the block is a call to action.',
      required: true,
    }),
    ctaField({
      name: 'secondaryCta',
      label: 'Second button',
      description: 'Optional. Leave both fields empty and only the main button is drawn.',
    }),
    {
      name: 'background',
      type: 'select',
      label: 'Background',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Accent', value: 'accent' },
        { label: 'Image', value: 'image' },
      ],
      admin: {
        description: 'What sits behind the section. Choosing "Image" asks for the picture below.',
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background image',
      ...requiredWhen<CtaSibling>((d) => d?.background === 'image', {
        description:
          'Shown only while the background above is set to "Image". The text sits on top, so pick something with quiet space, at least 2000px wide.',
      }),
    },
  ],
}
