import type { Block } from 'payload'

import { httpsUrlValidate } from '../../fields/url'

// Generic third-party iframe embed (calculators, dashboards, etc.). The
// renderer applies a CSP-friendly sandbox and an allow-list check against
// the configured providers (Phase 3 extension).
export const Embed: Block = {
  slug: 'embed',
  interfaceName: 'EmbedBlock',
  labels: { singular: 'Embed', plural: 'Embeds' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'url', type: 'text', required: true, validate: httpsUrlValidate },
    { name: 'caption', type: 'text' },
    { name: 'height', type: 'number', defaultValue: 600, min: 200, max: 1200 },
  ],
}
