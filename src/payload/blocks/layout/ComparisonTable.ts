import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { headingField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.2. Generic shape so it can model the canonical
// localshoring vs nearshore vs offshore comparison without hardcoding the
// columns (BLOCK_LIBRARY.md §10 open question B-4 — defer to schema-generic).
export const ComparisonTable: Block = {
  slug: 'comparison-table',
  interfaceName: 'ComparisonTableBlock',
  labels: { singular: 'Comparison table', plural: 'Comparison tables' },
  admin: blockAdmin('content', 'comparison-table', 'Comparison table'),
  fields: [
    headingField({ required: true }),
    {
      name: 'columns',
      type: 'array',
      label: 'Options being compared',
      labels: { singular: 'Option', plural: 'Options' },
      required: true,
      minRows: 2,
      maxRows: 4,
      admin: {
        description:
          'One row here becomes one column of the table, left to right. Two to four of them.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Option name',
          required: true,
          admin: { description: 'The column heading, e.g. "Localshoring".' },
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
      label: 'Comparison rows',
      labels: { singular: 'Row', plural: 'Rows' },
      required: true,
      minRows: 1,
      admin: { description: 'One row per thing you are comparing the options on.' },
      fields: [
        {
          name: 'dimension',
          type: 'text',
          label: 'What is being compared',
          required: true,
          admin: { description: 'The label at the start of the row, e.g. "Time zone overlap".' },
        },
        {
          name: 'cells',
          type: 'array',
          label: 'Answers',
          labels: { singular: 'Answer', plural: 'Answers' },
          required: true,
          // Cells per row must match column count; validated at render time.
          admin: {
            description:
              'One answer per option, in the same order as the options above. Nothing checks the count, so a row with too few or too many answers renders a misaligned table.',
          },
          fields: [
            {
              name: 'value',
              type: 'text',
              label: 'Answer',
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
          'Optional last row saying who each option suits. Same order and count as the options above.',
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
  ],
}
