import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'
import { workshopSkeleton } from '../payload/seed/skeletons/workshop'

export const Workshops: CollectionConfig = {
  slug: 'workshops',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order'],
    livePreview: livePreviewFor('workshops'),
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
    afterChange: [revalidateOnChange('workshops')],
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
    {
      // spec 010 / ADR 0009: the universal block-composed body. New records get
      // the default skeleton; the detail route renders this via RenderBlocks.
      name: 'layout',
      type: 'blocks',
      blocks: [...layoutBlocks],
      defaultValue: workshopSkeleton,
    },
    { name: 'facilitator', type: 'relationship', relationTo: 'teamMembers' },
    { name: 'testimonial', type: 'relationship', relationTo: 'testimonials' },
    { name: 'order', type: 'number' },
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
