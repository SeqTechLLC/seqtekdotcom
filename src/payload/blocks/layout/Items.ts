import type { Block, Condition } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { backgroundField, headingField, introField } from '../../fields/blockCopy'
import { mediaRowLabel } from '../../fields/mediaRowLabel'
import { safeUrlValidate } from '../../fields/url'

/** The block-level settings the row fields below take their visibility from. */
interface ItemsSettings {
  layout?: string | null
  markers?: string | null
}

const layoutOf = (settings: ItemsSettings | undefined): string => settings?.layout ?? 'grid'

/** A block-level field reads its siblings; a field on an item reads the block. */
const whenBlock =
  (test: (settings: ItemsSettings) => boolean): Condition =>
  (_data, siblingData) =>
    test((siblingData ?? {}) as ItemsSettings)

const whenItemsBlock =
  (test: (settings: ItemsSettings) => boolean): Condition =>
  (_data, _siblingData, { blockData }) =>
    test((blockData ?? {}) as ItemsSettings)

/**
 * One block for every "several short things" section: steps, stats, a single
 * big figure, a timeline, cards that send the reader on, a list of
 * deliverables, a row of technologies. The count is never capped; the layout
 * adjusts to it.
 */
export const Items: Block = {
  slug: 'items',
  interfaceName: 'ItemsBlock',
  labels: { singular: 'Items', plural: 'Items blocks' },
  admin: blockAdmin('content', 'items', 'Items'),
  fields: [
    headingField(),
    introField(),
    {
      name: 'layout',
      type: 'select',
      label: 'Layout',
      defaultValue: 'grid',
      options: [
        { label: 'Grid of columns', value: 'grid' },
        { label: 'A line down the page', value: 'line' },
        { label: 'Compact list', value: 'list' },
        { label: 'Tags', value: 'tags' },
      ],
      admin: {
        description:
          'Grid sets the items side by side, with as many columns as the count suits. A line runs them top to bottom joined by a rule, for steps or dates. A compact list is bullets, two columns on a wide screen. Tags are small chips, like a list of technologies.',
      },
    },
    {
      name: 'markers',
      type: 'select',
      label: 'Markers',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Numbers (1, 2, 3)', value: 'numbers' },
        { label: 'Your own, typed on each item', value: 'custom' },
      ],
      admin: {
        condition: whenBlock((s) => layoutOf(s) !== 'tags'),
        description:
          'A large marker with each title. Numbers count in the order you arrange the items. "Your own" shows what you type on each item: a figure like "25+", a letter that spells a word down a line, or a year. Hidden for tags.',
      },
    },
    {
      name: 'style',
      type: 'select',
      label: 'Grid style',
      defaultValue: 'plain',
      options: [
        { label: 'Plain, with a heavy rule above each item', value: 'plain' },
        { label: 'Cards with a border', value: 'card' },
      ],
      admin: {
        condition: whenBlock((s) => layoutOf(s) === 'grid'),
        description:
          'Only for the grid. Plain reads like an index: a rule, a bold title, a few lines. Cards box each item, which suits items with a picture or a link.',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Items',
      labels: { singular: 'Item', plural: 'Items' },
      required: true,
      admin: {
        description: 'Add as many as the section needs. The layout adjusts to the count.',
        components: {
          RowLabel: mediaRowLabel({
            singular: 'Item',
            textFields: ['title'],
            uploadField: 'image',
          }),
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
          admin: {
            description:
              'A few words. In a row of figures, this is what the figure counts, e.g. "years in Tulsa".',
          },
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Text',
          admin: {
            condition: whenItemsBlock((s) => layoutOf(s) !== 'tags'),
            description: 'Optional. One to three sentences under the title.',
          },
        },
        {
          name: 'marker',
          type: 'text',
          label: 'Marker',
          admin: {
            condition: whenItemsBlock((s) => s.markers === 'custom' && layoutOf(s) !== 'tags'),
            description:
              'Shown large with the title: a figure like "25+", a letter, or a year. Shown while markers are set to "Your own".',
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
          admin: {
            condition: whenItemsBlock((s) => layoutOf(s) === 'grid'),
            description: 'Optional picture above the title, landscape. Only the grid shows it.',
          },
        },
        {
          name: 'link',
          type: 'group',
          label: 'Link',
          admin: {
            description:
              'Optional. With an address, the title (or the tag) becomes a link. Add link text to also show a "link text →" line under the item.',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Link text',
              admin: {
                condition: whenItemsBlock((s) => layoutOf(s) !== 'tags'),
                description: 'E.g. "Read the case study". Leave it blank to link the title only.',
              },
            },
            {
              name: 'url',
              type: 'text',
              label: 'Link address',
              validate: safeUrlValidate,
              admin: {
                description:
                  'Where it goes. A page on this site starts with a slash ("/services"); an outside link needs the full https:// address.',
              },
            },
          ],
        },
      ],
    },
    backgroundField(),
  ],
}
