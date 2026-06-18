import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { editorConfig } from '../payload/editor/editorConfig'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'
import { serviceSkeleton } from '../payload/seed/skeletons/service'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'pillar', 'order'],
    livePreview: livePreviewFor('services'),
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
    {
      // spec 010 / ADR 0009: the block-composed body. New records get the
      // default skeleton; the nested detail route renders this via RenderBlocks.
      name: 'layout',
      type: 'blocks',
      blocks: [...layoutBlocks],
      defaultValue: serviceSkeleton,
    },
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
      name: 'description',
      type: 'richText',
      editor: editorConfig,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'approach',
      type: 'richText',
      editor: editorConfig,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'deliverables',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'faq',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', editor: editorConfig },
      ],
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
    { name: 'order', type: 'number' },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
