import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { eyebrowField } from '../../fields/blockCopy'
import { ctaField } from '../../fields/cta'
import { httpsUrlValidate } from '../../fields/url'
import { requiredWhen } from '../conditional'

type HeroSibling = { variant?: string }

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero (standard page)', plural: 'Heroes (standard page)' },
  admin: blockAdmin('hero', 'hero', 'Hero (standard page)'),
  fields: [
    {
      name: 'variant',
      type: 'select',
      label: 'Hero style',
      required: true,
      defaultValue: 'text-only',
      admin: {
        description:
          'What sits beside or under the words. "With image" puts the picture under the copy at full width, "Split" sets it alongside; both ask for an image. "With video" asks for a video address, "Text only" asks for neither.',
      },
      options: [
        { label: 'Text only', value: 'text-only' },
        { label: 'With image', value: 'with-image' },
        { label: 'With video', value: 'with-video' },
        { label: 'Split', value: 'split' },
      ],
    },
    eyebrowField(),
    {
      name: 'headline',
      type: 'text',
      label: 'Headline',
      required: true,
      admin: {
        description:
          'The first thing a visitor reads on this page. Say what we do for them, not who we are.',
      },
    },
    {
      name: 'subheadline',
      type: 'textarea',
      label: 'Supporting sentence',
      admin: { description: 'One or two sentences under the headline. Optional.' },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      ...requiredWhen<HeroSibling>((d) => d?.variant === 'with-image' || d?.variant === 'split', {
        description:
          'Shown only by the "With image" and "Split" styles. Landscape, at least 1600px wide.',
      }),
    },
    (() => {
      const { admin, validate } = requiredWhen<HeroSibling>((d) => d?.variant === 'with-video', {
        description:
          'Shown only by the "With video" style. Paste the player\'s EMBED address, not the page you watch on: https://www.youtube-nocookie.com/embed/ID or https://player.vimeo.com/video/ID. Anything else is dropped at render time and the hero shows no video at all.',
      })
      return {
        name: 'videoUrl' as const,
        type: 'text' as const,
        label: 'Video address' as const,
        admin,
        validate: (value: unknown, args: { data?: unknown; siblingData?: unknown }) => {
          const requiredCheck = validate(value, args)
          if (requiredCheck !== true) return requiredCheck
          return httpsUrlValidate(value)
        },
      }
    })(),
    ctaField({
      name: 'primaryCta',
      label: 'Main button',
      description: 'Optional. Leave both fields empty and the hero renders without buttons.',
      withStyle: true,
    }),
    ctaField({
      name: 'secondaryCta',
      label: 'Second button',
      description:
        'Optional, and independent of the main button: fill in only this one and it is the only button the hero draws.',
    }),
    {
      name: 'alignment',
      type: 'select',
      label: 'Text alignment',
      defaultValue: 'left',
      admin: {
        description:
          'Left is the default and easiest to read. Center suits a short headline with no image.',
      },
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
      ],
    },
  ],
}
