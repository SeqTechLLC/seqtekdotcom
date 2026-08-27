import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { httpsUrlValidate } from '../../fields/url'

// Generic third-party iframe embed (calculators, dashboards, etc.). The
// renderer applies a CSP-friendly sandbox and an allow-list check against
// the configured providers (Phase 3 extension).
export const Embed: Block = {
  slug: 'embed',
  interfaceName: 'EmbedBlock',
  labels: { singular: 'Embed (iframe)', plural: 'Embeds (iframe)' },
  admin: blockAdmin('specialty', 'embed', 'Embed (iframe)'),
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'What this embed is',
      required: true,
      admin: {
        description:
          'Describes the embedded page for screen readers, e.g. "SEQTEK delivery survey". Not drawn on screen.',
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Address to embed',
      required: true,
      validate: httpsUrlValidate,
      admin: {
        description:
          'The full https:// address of the page to show in a frame. It must be a page that allows embedding; many sites refuse.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: { description: 'Optional visible line under the frame.' },
    },
    {
      name: 'height',
      type: 'number',
      label: 'Frame height',
      defaultValue: 600,
      min: 200,
      max: 1200,
      admin: {
        description:
          'How tall the frame is, in pixels, between 200 and 1200. The embedded page scrolls inside it if it is longer.',
      },
    },
  ],
}
