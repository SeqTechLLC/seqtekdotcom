import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { eyebrowField } from '../../fields/blockCopy'
import { ctaField } from '../../fields/cta'
import { httpsUrlValidate } from '../../fields/url'
import { requiredWhen } from '../conditional'

type HeroSibling = { variant?: string }

// The one page opener (docs/planning/block-consolidation.md). `cover` is the
// old homepage hero; `split` absorbed the old `with-image`.
export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero section', plural: 'Hero sections' },
  admin: blockAdmin('hero', 'hero', 'Hero section'),
  fields: [
    {
      name: 'variant',
      type: 'select',
      label: 'Hero style',
      required: true,
      defaultValue: 'split',
      admin: {
        description:
          '"Split" sets the words beside a picture and suits most pages. "Cover" lays the words in white over a full-width photo, darkened so they stay readable; use it for the homepage or a campaign page. "With video" puts a video under the words. "Text only" is for a page with no picture at all.',
      },
      options: [
        { label: 'Text only', value: 'text-only' },
        { label: 'Split (words beside a picture)', value: 'split' },
        { label: 'Cover (words over a photo)', value: 'cover' },
        { label: 'With video', value: 'with-video' },
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
      ...requiredWhen<HeroSibling>((d) => d?.variant === 'split' || d?.variant === 'cover', {
        description:
          'Shown only by the "Split" and "Cover" styles. "Split" sets it beside the words; "Cover" stretches it behind them, so pick a photo with quiet space where the words fall. Landscape, at least 2000px wide.',
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
          'Left is the default and easiest to read. Center suits a short headline with no picture beside it.',
      },
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
      ],
    },
  ],
}
