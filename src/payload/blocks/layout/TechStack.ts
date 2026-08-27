import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { headingField } from '../../fields/blockCopy'
import { safeUrlValidate } from '../../fields/url'

// Per BLOCK_LIBRARY.md §5.6. Technology tag display (case-study pattern).
export const TechStack: Block = {
  slug: 'tech-stack',
  interfaceName: 'TechStackBlock',
  labels: { singular: 'Tech stack', plural: 'Tech stack blocks' },
  admin: blockAdmin('specialty', 'tech-stack', 'Tech stack'),
  fields: [
    headingField({ fallback: 'Technologies' }),
    {
      name: 'items',
      type: 'array',
      label: 'Technologies',
      labels: { singular: 'Technology', plural: 'Technologies' },
      required: true,
      minRows: 1,
      admin: { description: 'The tools and platforms used, drawn as a row of tags.' },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Name',
          required: true,
          admin: {
            description: 'The technology as its makers spell it, e.g. "PostgreSQL", ".NET".',
          },
        },
        {
          name: 'linkUrl',
          type: 'text',
          label: 'Link',
          validate: safeUrlValidate,
          admin: {
            description:
              'Optional. Makes the tag clickable: a page on this site starts with a slash, an outside reference needs the full https:// address.',
          },
        },
      ],
    },
  ],
}
