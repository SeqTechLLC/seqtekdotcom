import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { mediaRowLabel } from '../../fields/mediaRowLabel'
import { requiredWhen } from '../conditional'

type LogoBarSibling = { source?: string }

// Per BLOCK_LIBRARY.md §5.3.
export const LogoBar: Block = {
  slug: 'logo-bar',
  interfaceName: 'LogoBarBlock',
  labels: { singular: 'Logo bar', plural: 'Logo bars' },
  admin: blockAdmin('social-proof', 'logo-bar', 'Logo bar'),
  fields: [
    headingField(),
    {
      name: 'source',
      type: 'select',
      label: 'Where the logos come from',
      required: true,
      defaultValue: 'inline',
      options: [
        { label: 'Pick them here', value: 'inline' },
        // Spec 011 T050: nothing reads this value. `LogoBar.tsx:27` maps it to
        // an empty list, so the block renders no logos at all — the same
        // inert-option defect US1 removed from `stats-bar`, which it missed
        // because that audit was over fields, not over option values.
        // Withdrawing it is a migration (the value is in eight Postgres enums),
        // so US4 names it instead of smuggling a schema change into an
        // admin-only change. Tracked in ROADMAP.
        { label: 'Reuse the homepage set (not built yet)', value: 'from-homepage' },
      ],
      admin: {
        description:
          '"Pick them here" is the only working choice. The homepage-set option is unfinished: nothing reads it, so the section renders empty.',
      },
    },
    {
      name: 'logos',
      type: 'array',
      label: 'Logos',
      labels: { singular: 'Logo', plural: 'Logos' },
      // The `admin` object MUST be passed to `requiredWhen`, not written as a
      // sibling key: as a sibling it replaced the returned `condition` outright
      // and this array showed for both sources. Spec 011 T050.
      ...requiredWhen<LogoBarSibling>((d) => d?.source === 'inline', {
        components: { RowLabel: mediaRowLabel({ singular: 'Logo', uploadField: 'logo' }) },
        description: 'Only used while the source above is set to "Pick them here".',
      }),
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo file',
          required: true,
          admin: {
            description: 'Transparent PNG or SVG where possible, so it sits on any background.',
          },
        },
      ],
    },
    {
      name: 'treatment',
      type: 'select',
      label: 'How the logos are drawn',
      defaultValue: 'grayscale-on-color-hover',
      options: [
        { label: 'Grey, colour on hover', value: 'grayscale-on-color-hover' },
        { label: 'Always in colour', value: 'color' },
      ],
      admin: {
        description:
          'Grey keeps a wall of mismatched brand colours calm and is the usual choice. Full colour suits a short row of two or three.',
      },
    },
  ],
}
