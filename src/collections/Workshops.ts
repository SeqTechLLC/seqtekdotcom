import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { editorConfig } from '../payload/editor/editorConfig'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'

export const Workshops: CollectionConfig = {
  slug: 'workshops',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order'],
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
    { name: 'description', type: 'richText', editor: editorConfig },
    { name: 'format', type: 'richText', editor: editorConfig },
    { name: 'audience', type: 'richText', editor: editorConfig },
    {
      name: 'deliverables',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      // Proof section: real photos from delivered workshops (spec ref:
      // touchstone-landing.md §5; CrossCo C-5 marketing release signed
      // 2026-06-11). Rendered as a captioned gallery on the detail page.
      name: 'photos',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      // Recap/promo video, rendered via the VideoEmbed section
      // (youtube-nocookie / vimeo player; CSP frame-src allows both).
      name: 'video',
      type: 'group',
      fields: [
        {
          name: 'provider',
          type: 'select',
          defaultValue: 'youtube',
          options: [
            { label: 'YouTube', value: 'youtube' },
            { label: 'Vimeo', value: 'vimeo' },
          ],
        },
        { name: 'videoId', type: 'text' },
        { name: 'title', type: 'text' },
      ],
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
