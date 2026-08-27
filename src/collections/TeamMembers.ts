import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
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
    defaultColumns: ['name', '_status', 'title', 'isLeadership', 'order'],
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
    {
      // ROADMAP UI-1: `title` and `role` overlap enough that the grid was
      // rendering the wrong one and the showcase fixtures filled `role` with a
      // job title. Neither field had a label or help text, so there was nothing
      // in the panel to tell them apart. Same failure class as spec 011 US4.
      name: 'title',
      type: 'text',
      label: 'Job title',
      admin: {
        description:
          'The short job title, as it appears on the team cards — for example "CTO" or "Enterprise Architect". Leave it blank and the card shows only the name.',
      },
    },
    {
      name: 'role',
      type: 'text',
      label: 'What they do (one sentence)',
      admin: {
        description:
          'A full sentence describing what this person owns. It appears only on their own /team page, under the job title — never on the cards. Leave it blank if the job title says enough.',
      },
    },
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
      // spec 011 T011 (FR-001): NOT a legacy field. `expertise` is read by
      // `personLd` in src/lib/structured-data.ts and emitted as `knowsAbout`
      // in each member's Person JSON-LD, so it affects how search engines and
      // AI assistants describe this person. The spec-010 cleanup listed it
      // among the retained legacy body fields by mistake, which left it
      // hidden and read-only while still being load-bearing — precisely the
      // inert-control failure this feature exists to remove.
      name: 'expertise',
      type: 'array',
      label: 'Areas of expertise',
      admin: {
        description:
          'Short skill or subject labels, one per row (for example "Cloud architecture", "Team facilitation"). These do not appear on the page, but search engines and AI assistants read them to understand what this person is known for.',
      },
      fields: [{ name: 'label', type: 'text', required: true, label: 'Area' }],
    },
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
  ],
}
