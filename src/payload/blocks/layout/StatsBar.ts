import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.3. `items` is conditionally required when
// source = 'inline'; the from-site-settings path renders the canonical set
// at template time and ignores the inline array.
export const StatsBar: Block = {
  slug: 'stats-bar',
  interfaceName: 'StatsBarBlock',
  labels: { singular: 'Stats bar', plural: 'Stats bars' },
  fields: [
    { name: 'heading', type: 'text' },
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
      minRows: 3,
      maxRows: 5,
      required: true,
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'suffix', type: 'text' },
      ],
    },
  ],
}
