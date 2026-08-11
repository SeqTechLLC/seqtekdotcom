import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { httpsUrlValidate } from '../payload/fields/url'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'
import { partnerSkeleton } from '../payload/seed/skeletons/partner'

// ADR 0009 Option C ("two primitives + metadata collections"): a partner is a
// Page + typed metadata. The metadata below is what the `/partners` index card
// (logo, summary, ordering), the breadcrumb schema (name), and the detail-page
// outbound link (logo, url) need; the BODY is the `layout` blocks array
// rendered by `RenderBlocks`. Routing and indexing derive from the collection,
// so adding a partner is a content operation — no slug whitelist, no sitemap
// edit, no deploy.
export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Partner', plural: 'Partners' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'url', 'order', 'updatedAt'],
    livePreview: livePreviewFor('partners'),
  },
  // Same `editorial-draftable` tier as teamMembers/pages: anon reads published
  // only (no draft leak), editorial mutate, admin delete.
  access: {
    read: publishedOrAuthed,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
    admin: isAdminOrEditor,
  },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: {
    beforeChange: [slugFromTitle('name'), enforceDraftWhenScheduled],
    afterChange: [revalidateOnChange('partners')],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: validateSlug,
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: { description: 'One or two sentences. Used on the /partners index card.' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: "The partner's own mark, for the index card." },
    },
    {
      name: 'url',
      type: 'text',
      validate: httpsUrlValidate,
      admin: { description: "The partner's website. Rendered as an outbound link." },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [...layoutBlocks],
      defaultValue: partnerSkeleton,
    },
    { name: 'order', type: 'number' },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar' },
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
  ],
}
