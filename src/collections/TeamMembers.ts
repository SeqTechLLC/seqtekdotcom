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
import { seoField } from '../payload/fields/seo'

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
    {
      name: 'name',
      type: 'text',
      label: 'Full name',
      required: true,
      admin: {
        description: 'The name as this person writes it. Heads their card and their own page.',
      },
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
          'The last part of the web address for this profile, for example "dana-dudley". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
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
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Headshot',
      required: true,
      admin: { description: 'Square or close to it. Cropped to a circle on the team cards.' },
    },
    {
      // spec 010 / ADR 0009: the block-composed body for the `/team/[slug]`
      // detail route. New records get the default skeleton.
      name: 'layout',
      type: 'blocks',
      label: 'Profile page',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      defaultValue: teamMemberSkeleton,
      admin: {
        description:
          "This person's own page, built from blocks. A new profile starts from a standard outline; replace the placeholder text in each block.",
      },
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      label: 'LinkedIn profile',
      validate: httpsUrlValidate,
      admin: {
        description:
          'The full https:// address of their LinkedIn page. Becomes the LinkedIn icon on their profile; leave blank and no icon is drawn.',
      },
    },
    {
      name: 'email',
      type: 'text',
      label: 'Work email',
      admin: {
        description:
          'Published on their profile as a contact link, so use the address they are happy to have public.',
      },
    },
    {
      name: 'isLeadership',
      type: 'checkbox',
      label: 'Part of leadership',
      defaultValue: false,
      admin: {
        description:
          'Tick to include this person when a team block is set to show leadership only.',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Sort position',
      admin: {
        description:
          'Lowest number first wherever these are listed together. Leave blank and the list falls back to alphabetical.',
      },
    },
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
      labels: { singular: 'Area', plural: 'Areas' },
      admin: {
        description:
          'Short skill or subject labels, one per row (for example "Cloud architecture", "Team facilitation"). These do not appear on the page, but search engines and AI assistants read them to understand what this person is known for.',
      },
      fields: [{ name: 'label', type: 'text', required: true, label: 'Area' }],
    },
    // spec 010 US2: per-member metadata for the new detail route (AICO).
    seoField({ noun: 'profile' }),
  ],
}
