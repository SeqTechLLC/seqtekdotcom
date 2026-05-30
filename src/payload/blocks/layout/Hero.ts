import type { Block } from 'payload'

import { httpsUrlValidate, safeUrlValidate } from '../../fields/url'
import { requiredWhen } from '../conditional'

type HeroSibling = { variant?: string }

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'text-only',
      options: [
        { label: 'Text only', value: 'text-only' },
        { label: 'With image', value: 'with-image' },
        { label: 'With video', value: 'with-video' },
        { label: 'Split', value: 'split' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'headline', type: 'text', required: true },
    { name: 'subheadline', type: 'textarea' },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      ...requiredWhen<HeroSibling>((d) => d?.variant === 'with-image' || d?.variant === 'split'),
    },
    (() => {
      const { admin, validate } = requiredWhen<HeroSibling>((d) => d?.variant === 'with-video')
      return {
        name: 'videoUrl' as const,
        type: 'text' as const,
        admin,
        validate: (value: unknown, args: { data?: unknown; siblingData?: unknown }) => {
          const requiredCheck = validate(value, args)
          if (requiredCheck !== true) return requiredCheck
          return httpsUrlValidate(value)
        },
      }
    })(),
    {
      name: 'primaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text', validate: safeUrlValidate },
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'primary',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Ghost', value: 'ghost' },
          ],
        },
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
      name: 'alignment',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
      ],
    },
  ],
}
