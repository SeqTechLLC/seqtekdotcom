import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Named "tabs", but `components/sections/Tabs.tsx` draws jump links over a
// stack of always-visible sections — no panel is ever hidden. Tracked in
// ROADMAP INERT-2; the field descriptions below say what it actually does.
export const Tabs: Block = {
  slug: 'tabs',
  interfaceName: 'TabsBlock',
  labels: { singular: 'Tabs', plural: 'Tabs blocks' },
  admin: blockAdmin('specialty', 'tabs', 'Tabs'),
  fields: [
    headingField(),
    {
      name: 'tabs',
      type: 'array',
      label: 'Tabs',
      labels: { singular: 'Tab', plural: 'Tabs' },
      required: true,
      minRows: 2,
      maxRows: 6,
      admin: {
        description:
          'Two to six sections with jump links above them. They are NOT tabs today: every section renders stacked down the page and the links scroll to one (ROADMAP INERT-2).',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Section name',
          required: true,
          admin: { description: 'One or two words. It becomes the jump link and the heading.' },
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Section content',
          required: true,
          admin: { description: 'The prose under that heading. It is always visible.' },
        },
      ],
    },
  ],
}
