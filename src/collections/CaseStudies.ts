import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { editorConfig } from '../payload/editor/editorConfig'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'

export const CaseStudies: CollectionConfig = {
  slug: 'caseStudies',
  labels: { singular: 'Case study', plural: 'Case studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'industry', 'updatedAt'],
    livePreview: livePreviewFor('caseStudies'),
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
    afterChange: [revalidateOnChange('caseStudies')],
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
    { name: 'subtitle', type: 'text' },
    { name: 'industry', type: 'relationship', relationTo: 'industries', required: true },
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
    },
    {
      name: 'client',
      type: 'group',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'isAnonymized', type: 'checkbox', defaultValue: false },
      ],
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'problem', type: 'richText', editor: editorConfig },
    { name: 'solution', type: 'richText', editor: editorConfig },
    { name: 'impact', type: 'richText', editor: editorConfig },
    {
      name: 'metrics',
      type: 'array',
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'context', type: 'text' },
      ],
    },
    {
      name: 'technologies',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    { name: 'testimonial', type: 'relationship', relationTo: 'testimonials' },
    {
      name: 'relatedCaseStudies',
      type: 'relationship',
      relationTo: 'caseStudies',
      hasMany: true,
      maxRows: 3,
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
