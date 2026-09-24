import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { backgroundField, headingField, introField } from '../../fields/blockCopy'

/**
 * Replaces `comparison-table`. Same data shape, no column cap: past the width
 * of the screen the table scrolls sideways inside its own frame, never the page.
 */
export const Table: Block = {
  slug: 'table',
  interfaceName: 'TableBlock',
  labels: { singular: 'Table', plural: 'Tables' },
  admin: blockAdmin('content', 'table', 'Table'),
  fields: [
    headingField(),
    introField(),
    {
      name: 'columns',
      type: 'array',
      label: 'Columns',
      labels: { singular: 'Column', plural: 'Columns' },
      required: true,
      minRows: 1,
      admin: {
        description:
          'One row here becomes one column of the table, left to right. Any number: on a narrow screen a wide table scrolls sideways within itself.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Column heading',
          required: true,
          admin: { description: 'e.g. "Localshoring".' },
        },
        {
          name: 'tagline',
          type: 'text',
          label: 'One-line description',
          admin: { description: 'Optional smaller line under the column heading.' },
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Rows',
      labels: { singular: 'Row', plural: 'Rows' },
      required: true,
      minRows: 1,
      admin: { description: 'One row per thing the columns are compared on.' },
      fields: [
        {
          name: 'dimension',
          type: 'text',
          label: 'Row label',
          required: true,
          admin: { description: 'The label at the start of the row, e.g. "Time zone overlap".' },
        },
        {
          name: 'cells',
          type: 'array',
          label: 'Cells',
          labels: { singular: 'Cell', plural: 'Cells' },
          required: true,
          admin: {
            description:
              'One per column, in the same order as the columns above. A row with fewer is padded with blanks; extra cells still show, under no heading.',
          },
          fields: [
            {
              name: 'value',
              type: 'text',
              label: 'Cell',
              required: true,
              admin: { description: 'A few words. Long sentences make the table hard to scan.' },
            },
          ],
        },
      ],
    },
    {
      name: 'bestForRow',
      type: 'array',
      label: 'Closing "best for" row',
      labels: { singular: 'Verdict', plural: 'Verdicts' },
      admin: {
        description:
          'Optional last row, labelled "Best for", saying who each column suits. Same order as the columns above.',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          label: 'Best for',
          required: true,
          admin: { description: 'A few words, e.g. "teams that need daylight overlap".' },
        },
      ],
    },
    backgroundField(),
  ],
}
