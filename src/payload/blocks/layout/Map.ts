import type { Block } from 'payload'

// Static map affordance for office locations or service-area visuals. The
// renderer uses a privacy-friendly iframe to OpenStreetMap by default; a
// Google Maps embed URL overrides when set.
export const Map: Block = {
  slug: 'map',
  interfaceName: 'MapBlock',
  labels: { singular: 'Map', plural: 'Maps' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'embedUrl', type: 'text', required: true },
    { name: 'caption', type: 'text' },
    { name: 'height', type: 'number', defaultValue: 400, min: 200, max: 800 },
  ],
}
