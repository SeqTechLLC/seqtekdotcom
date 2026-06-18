import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { editorConfig } from '../payload/editor/editorConfig'
import { httpsUrlValidate } from '../payload/fields/url'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'
import { teamMemberSkeleton } from '../payload/seed/skeletons/teamMember'

export const TeamMembers: CollectionConfig = {
  slug: 'teamMembers',
  labels: { singular: 'Team member', plural: 'Team members' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'isLeadership', 'order'],
    livePreview: livePreviewFor('teamMembers'),
  },
  // spec 010 US2 (Phase E, R6/R7): teamMembers gains drafts + a public
  // `/team/[slug]` detail route, moving it from the
  // `public-read-editorial-mutate` tier to `editorial-draftable`: anon reads
  // published only (no draft leak), editorial mutate, admin delete.
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
    afterChange: [revalidateOnChange('teamMembers')],
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
    { name: 'title', type: 'text' },
    { name: 'role', type: 'text' },
    { name: 'photo', type: 'upload', relationTo: 'media', required: true },
    {
      // spec 010 / ADR 0009: the block-composed body for the `/team/[slug]`
      // detail route. New records get the default skeleton.
      name: 'layout',
      type: 'blocks',
      blocks: [...layoutBlocks],
      defaultValue: teamMemberSkeleton,
    },
    { name: 'linkedinUrl', type: 'text', validate: httpsUrlValidate },
    { name: 'email', type: 'text' },
    { name: 'isLeadership', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number' },
    {
      // spec 010 US2: per-member metadata for the new detail route (AICO).
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
    // ---- Legacy body fields (expand/contract, R2) ----
    // Composed into `layout` by teamMemberToLayout.ts; hidden + read-only, kept
    // one release as an in-DB rollback net, then removed by drop_legacy_body_columns.
    // (`expertise` is still read by personLd for knowsAbout until the drop.)
    {
      name: 'bio',
      type: 'richText',
      editor: editorConfig,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'expertise',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'certifications',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'education',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [
        { name: 'degree', type: 'text', required: true },
        { name: 'institution', type: 'text', required: true },
      ],
    },
    {
      name: 'personalFacts',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    { name: 'quote', type: 'textarea', admin: { hidden: true, readOnly: true } },
  ],
}
