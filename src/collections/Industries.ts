import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { mediaRowLabel } from '../payload/fields/mediaRowLabel'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { editorConfig } from '../payload/editor/editorConfig'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { seoField } from '../payload/fields/seo'
import { livePreviewFor } from '../payload/livePreview/url'
import { layoutBlocks } from '../payload/blocks/layout'
import { industrySkeleton } from '../payload/seed/skeletons/industry'

export const Industries: CollectionConfig = {
  slug: 'industries',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'slug'],
    livePreview: livePreviewFor('industries'),
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
    beforeChange: [slugFromTitle('title')],
    afterChange: [revalidateOnChange('industries')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Industry name',
      required: true,
      admin: { description: 'What this sector is called on case studies and in an industry grid.' },
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
          'The last part of the web address for this industry, for example "oil-and-gas". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: editorConfig,
      admin: {
        // Still INERT-1: `/industries/[slug]` renders `layout` blocks only, so
        // nothing reads this. Un-hide it in the change that ships a consumer.
        hidden: true,
      },
    },
    {
      name: 'relevantServices',
      type: 'relationship',
      relationTo: 'services',
      // SVC-2: `services` holds three tiers now. Only a leaf is a thing a
      // client buys, so the picker must not offer "What We Do" or a group.
      filterOptions: () => ({ tier: { equals: 'leaf' } }),
      hasMany: true,
      admin: {
        hidden: true, // Still INERT-1 — no consumer; see `description` above.
      },
    },
    {
      name: 'clientLogos',
      type: 'array',
      labels: { singular: 'Client logo', plural: 'Client logos' },
      admin: {
        hidden: true, // Still INERT-1 — no consumer; see `description` above.
        components: {
          RowLabel: mediaRowLabel({ singular: 'Client logo', uploadField: 'logo' }),
        },
      },
      fields: [{ name: 'logo', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Industry page',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      defaultValue: industrySkeleton,
      admin: {
        description:
          'The industry page, built from blocks. A new industry starts from a standard outline; replace the placeholder text in each block.',
      },
    },
    seoField({ noun: 'industry' }),
  ],
}
