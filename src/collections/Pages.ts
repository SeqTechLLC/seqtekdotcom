import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'
import { seoField } from '../payload/fields/seo'
import { publishedAtField } from '../payload/fields/publishing'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'slug', 'updatedAt'],
    livePreview: livePreviewFor('pages'),
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
    afterChange: [revalidateOnChange('pages')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Page title',
      required: true,
      admin: {
        description:
          'The name of this page. It becomes the browser tab title and the default search result headline.',
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
          'The last part of the web address for this page, for example "about-us". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    publishedAtField(),
    {
      // spec 011 T018 (FR-002): the legacy `hero` group was deleted. It sat at
      // the top of every Page form, five editable inputs, consumed by nothing —
      // ADR 0009 moved page openers into the block layout below and the group
      // was never removed. Verified empty across all 57 rows before the drop
      // (specs/011-payload-admin-ux/inventory-before.md §3).
      name: 'layout',
      type: 'blocks',
      label: 'Page content',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      admin: {
        description:
          'The page itself, built from blocks. Add a block for each band of content down the page; drag the handles to reorder.',
      },
    },
    seoField(),
  ],
}
