import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { editorConfig } from '../payload/editor/editorConfig'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { seoField } from '../payload/fields/seo'
import { orderField } from '../payload/fields/publishing'

export const ServicePillars: CollectionConfig = {
  slug: 'servicePillars',
  labels: { singular: 'Service pillar', plural: 'Service pillars' },
  admin: {
    useAsTitle: 'title',
    // `order` is admin.hidden (nothing sorts pillars by it), so it cannot be a column.
    defaultColumns: ['title', '_status', 'slug'],
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
    beforeChange: [slugFromTitle('title')],
    afterChange: [revalidateOnChange('servicePillars')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Pillar name',
      required: true,
      admin: { description: 'One of the three top-level groupings services sit under.' },
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
          'The last part of the web address for this pillar, for example "strategy". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
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
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        hidden: true, // ROADMAP INERT-1 — no route reads this yet
      },
    },
    seoField({ noun: 'pillar', hidden: true }),
    // ROADMAP INERT-1/INERT-2: `listServicePillars` has no callers, and the
    // `service-pillar-cards` block renders its `hasMany` relationship in the
    // order an editor picked. Nothing sorts pillars by this.
    orderField({ what: 'a pillar list', hidden: true }),
  ],
}
