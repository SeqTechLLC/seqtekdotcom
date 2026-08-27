import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { httpsUrlValidate } from '../../fields/url'

// Static map affordance for office locations or service-area visuals. The
// renderer uses a privacy-friendly iframe to OpenStreetMap by default; a
// Google Maps embed URL overrides when set.
export const Map: Block = {
  slug: 'map',
  interfaceName: 'MapBlock',
  labels: { singular: 'Map', plural: 'Maps' },
  admin: blockAdmin('specialty', 'map', 'Map'),
  fields: [
    headingField(),
    {
      name: 'embedUrl',
      type: 'text',
      label: 'Map address',
      required: true,
      validate: httpsUrlValidate,
      admin: {
        description:
          'The embed address from OpenStreetMap or Google Maps ("Share > Embed a map", then copy the src address). Other hosts are refused and the block shows a notice instead.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: { description: 'Optional line under the map, e.g. the street address.' },
    },
    {
      name: 'height',
      type: 'number',
      label: 'Map height',
      defaultValue: 400,
      min: 200,
      max: 800,
      admin: { description: 'How tall the map is, in pixels, between 200 and 800.' },
    },
  ],
}
