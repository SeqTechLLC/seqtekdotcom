import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { editorConfig } from '../payload/editor/editorConfig'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { seoField } from '../payload/fields/seo'
import { orderField, publishedAtField } from '../payload/fields/publishing'
import { layoutBlocks } from '../payload/blocks/layout'

export const ServicePillars: CollectionConfig = {
  slug: 'servicePillars',
  labels: { singular: 'Service pillar', plural: 'Service pillars' },
  admin: {
    useAsTitle: 'title',
    // `order` is admin.hidden (nothing sorts pillars by it), so it cannot be a column.
    defaultColumns: ['title', '_status', 'slug'],
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
    afterChange: [revalidateOnChange('servicePillars')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Pillar name',
      required: true,
      admin: { description: 'One of the three top-level groupings services sit under.' },
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
          'The last part of the web address for this pillar, for example "strategy". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: editorConfig,
      admin: {
        hidden: true, // ROADMAP INERT-1 — no route reads this yet
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        hidden: true, // ROADMAP INERT-1 — no route reads this yet
      },
    },
    // ROADMAP NAV-1/SVC-2: the GROUP holds an ordered list of its services,
    // rather than each service naming one parent. A leaf can be cross-listed
    // under more than one group — "what we do" is capability, "how we work" is
    // delivery model, and the strategy work is genuinely both — which a single
    // `pillar` field on the service could not express. It also makes a group
    // page an editorial object that chooses what it shows, in the order it
    // wants, instead of a query result.
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'services',
      label: 'Services in this group',
      hasMany: true,
      admin: {
        description:
          'The services shown under this group, in the order you arrange them. A service may appear under more than one group.',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Group page',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      admin: {
        description:
          'The group page, built from blocks. Start with a hero so the page has a headline. A group page needs a reason to exist beyond listing its own services.',
      },
    },
    // Un-hidden with the route that reads it (ROADMAP INERT-1).
    seoField({ noun: 'pillar' }),
    // ROADMAP INERT-1/INERT-2: `listServicePillars` has no callers, and the
    // `service-pillar-cards` block renders its `hasMany` relationship in the
    // order an editor picked. Nothing sorts pillars by this.
    orderField({ what: 'a pillar list', hidden: true }),
    publishedAtField(),
  ],
}
