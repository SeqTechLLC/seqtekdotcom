import type { Block } from 'payload'

import { outputContract } from '../outputContract'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { requiredWhen } from '../conditional'

type ServiceCardsSibling = { source?: string }

// Per BLOCK_LIBRARY.md §5.5.
export const ServiceCards: Block = {
  slug: 'service-cards',
  interfaceName: 'ServiceCardsBlock',
  labels: { singular: 'Service cards', plural: 'Service cards blocks' },
  admin: blockAdmin('content-collection', 'service-cards', 'Service cards'),
  custom: outputContract({
    // Resolved by `src/lib/resolveLayout.ts` into `manualItems` before render.
    resolvedUpstream: ['source', 'pillar'],
  }),
  fields: [
    headingField(),
    {
      name: 'source',
      type: 'select',
      label: 'How to choose the services',
      required: true,
      admin: {
        // ROADMAP UI-2 review: `source` decides, and manual picks are
        // silently ignored unless it says so. Stated here because
        // `manualItems` is hidden in precisely that case.
        description:
          'How this block picks its services. "By pillar" fills itself in and stays current as you publish; "Manual" uses exactly the services you pick below. Anything you have picked below is IGNORED unless this is set to "Manual".',
      },
      defaultValue: 'manual',
      options: [
        { label: 'By pillar', value: 'by-pillar' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      name: 'pillar',
      type: 'relationship',
      relationTo: 'servicePillars',
      label: 'Which pillar',
      ...requiredWhen<ServiceCardsSibling>((d) => d?.source === 'by-pillar', {
        description: 'Shows every service filed under this pillar, in their sort order.',
      }),
    },
    {
      name: 'manualItems',
      type: 'relationship',
      relationTo: 'services',
      label: 'Services to show',
      hasMany: true,
      ...requiredWhen<ServiceCardsSibling>((d) => d?.source === 'manual', {
        description:
          'The exact services, in the order you pick them. Only used while the source above is "Manual".',
      }),
    },
  ],
}
