import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { editorConfig } from '../payload/editor/editorConfig'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'
import { caseStudySkeleton } from '../payload/seed/skeletons/caseStudy'

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
    {
      // spec 010 / ADR 0009: the block-composed body. New records get the
      // default skeleton; the detail route renders this via RenderBlocks.
      name: 'layout',
      type: 'blocks',
      blocks: [...layoutBlocks],
      defaultValue: caseStudySkeleton,
    },
    // ---- Legacy body fields (expand/contract, R2) ----
    // Composed into `layout` by caseStudyToLayout.ts; hidden + read-only, kept
    // one release as an in-DB rollback net, then removed by drop_legacy_body_columns.
    {
      name: 'problem',
      type: 'richText',
      editor: editorConfig,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'solution',
      type: 'richText',
      editor: editorConfig,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'impact',
      type: 'richText',
      editor: editorConfig,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'metrics',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'context', type: 'text' },
      ],
    },
    {
      name: 'technologies',
      type: 'array',
      admin: { hidden: true, readOnly: true },
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
