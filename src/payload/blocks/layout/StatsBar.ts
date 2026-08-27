import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.3. `items` is conditionally required when
// source = 'inline'; the from-site-settings path renders the canonical set
// at template time and ignores the inline array.
export const StatsBar: Block = {
  slug: 'stats-bar',
  interfaceName: 'StatsBarBlock',
  labels: { singular: 'Stats bar', plural: 'Stats bars' },
  admin: blockAdmin('social-proof', 'stats-bar', 'Stats bar'),
  fields: [
    headingField(),
    // spec 011: the `source` select is gone. Its only alternative to 'inline'
    // was 'from-site-settings', which read `siteSettings.stats` — a global
    // withdrawn by this spec (ADR 0010). The renderer already rendered nothing
    // for that value ("Phase 3 will resolve via a server helper"), a Phase 3
    // that can no longer happen, so the option was an editable control that
    // silently produced an empty section. Stats are always inline now, which
    // is what every stored row already used.
    {
      name: 'items',
      type: 'array',
      label: 'Numbers',
      labels: { singular: 'Number', plural: 'Numbers' },
      minRows: 3,
      maxRows: 5,
      required: true,
      admin: {
        description: 'Three to five figures, side by side. Only numbers we can stand behind.',
      },
      fields: [
        {
          name: 'number',
          type: 'text',
          label: 'The figure',
          required: true,
          admin: { description: 'Just the digits and symbol, e.g. "500" or "$1.2M".' },
        },
        {
          name: 'label',
          type: 'text',
          label: 'What it counts',
          required: true,
          admin: { description: 'A few words under the figure, e.g. "projects delivered".' },
        },
        {
          name: 'suffix',
          type: 'text',
          label: 'Suffix',
          admin: { description: 'Optional short tail set beside the figure, e.g. "+" or "yrs".' },
        },
      ],
    },
  ],
}
