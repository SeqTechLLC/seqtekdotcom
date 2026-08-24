import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'pillar', 'order'],
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
    beforeChange: [slugFromTitle('title'), enforceDraftWhenScheduled],
    afterChange: [revalidateOnChange('services')],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: validateSlug,
    },
    { name: 'pillar', type: 'relationship', relationTo: 'servicePillars', required: true },
    { name: 'icon', type: 'text' },
    {
      name: 'relatedCaseStudies',
      type: 'relationship',
      relationTo: 'caseStudies',
      hasMany: true,
    },
    // ---- Legacy body fields (expand/contract, R2) ----
    // Composed into `layout` by serviceToLayout.ts; hidden + read-only, kept one
    // release as an in-DB rollback net, then removed by drop_legacy_body_columns.
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'order', type: 'number' },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
