import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { editorConfig } from '../payload/editor/editorConfig'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { seoField } from '../payload/fields/seo'

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'city',
    // `hasOffice` is admin.hidden (ROADMAP INERT-1), so it cannot be a column.
    defaultColumns: ['city', '_status', 'slug'],
  },
  access: {
    read: publishedOrAuthed,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
    admin: isAdminOrEditor,
  },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: {
    beforeChange: [slugFromTitle('city')],
    afterChange: [revalidateOnChange('locations')],
  },
  fields: [
    {
      name: 'city',
      type: 'text',
      label: 'City',
      required: true,
      admin: { description: 'The market name, as it appears on a "Where we work" block.' },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL path',
      required: true,
      unique: true,
      index: true,
      validate: validateSlug,
      admin: {
        description:
          'The last part of the web address for this market, for example "tulsa". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: editorConfig,
      admin: {
        hidden: true, // ROADMAP INERT-1 — no route reads this yet
      },
    },
    {
      name: 'address',
      type: 'group',
      admin: {
        hidden: true, // ROADMAP INERT-1 — no route reads this yet
      },
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'zip', type: 'text' },
      ],
    },
    {
      name: 'hasOffice',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true, // ROADMAP INERT-1 — no route reads this yet
      },
    },
    seoField({ noun: 'location', hidden: true }),
  ],
}
