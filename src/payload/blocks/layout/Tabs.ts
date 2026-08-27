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
          'Two to six sections behind a row of tabs. One is shown at a time and the reader switches between them, so this suits alternatives a reader compares rather than steps they read in order.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Section name',
          required: true,
          admin: { description: 'One or two words. It becomes the tab itself, so keep it short.' },
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Section content',
          required: true,
          admin: {
            description: 'The prose behind that tab. It is shown when the reader picks it.',
          },
        },
      ],
    },
  ],
}
