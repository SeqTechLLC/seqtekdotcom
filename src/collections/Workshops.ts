import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'
import { workshopSkeleton } from '../payload/seed/skeletons/workshop'
import { seoField } from '../payload/fields/seo'
import { orderField, publishedAtField } from '../payload/fields/publishing'

export const Workshops: CollectionConfig = {
  slug: 'workshops',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'slug', 'order'],
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
    {
      name: 'title',
      type: 'text',
      label: 'Workshop name',
      required: true,
      admin: {
        description: 'What this workshop is called, on the workshops index and its own page.',
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
          'The last part of the web address for this workshop, for example "ai-readiness". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    {
      // spec 010 / ADR 0009: the universal block-composed body. New records get
      // the default skeleton; the detail route renders this via RenderBlocks.
      name: 'layout',
      type: 'blocks',
      label: 'Workshop page',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      defaultValue: workshopSkeleton,
      admin: {
        description:
          'The workshop page, built from blocks. A new workshop starts from a standard outline; replace the placeholder text in each block.',
      },
    },
    {
      name: 'facilitator',
      type: 'relationship',
      relationTo: 'teamMembers',
      label: 'Who runs it',
      admin: { description: 'The team member who leads this workshop.' },
    },
    {
      name: 'testimonial',
      type: 'relationship',
      relationTo: 'testimonials',
      label: 'Participant quote',
      admin: {
        description:
          'Pick a testimonial already in the panel. Add it to Testimonials first if it is not there.',
      },
    },
    orderField({ what: 'the workshop list' }),
    seoField({ noun: 'workshop' }),
    publishedAtField(),
  ],
}
