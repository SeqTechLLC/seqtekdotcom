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
import { seoField } from '../payload/fields/seo'

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
    defaultColumns: ['name', '_status', 'url', 'order', 'updatedAt'],
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
    {
      name: 'name',
      type: 'text',
      label: 'Partner name',
      required: true,
      admin: { description: 'The partner company name, as they write it themselves.' },
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
          'The last part of the web address for this partner, for example "microsoft". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      label: 'Summary',
      admin: {
        description:
          'One or two sentences on what we do together. Shown on the partners index card and used as the search result summary when the SEO section below is left blank.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Partner logo',
      required: true,
      admin: {
        description:
          "The partner's own mark, for the index card. Transparent PNG or SVG where possible.",
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Website',
      validate: httpsUrlValidate,
      admin: {
        description:
          "The partner's own website, as a full https:// address. Rendered as a link that opens off this site.",
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Partner page',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      defaultValue: partnerSkeleton,
      admin: {
        description:
          'The partner page, built from blocks. A new partner starts from a standard outline; replace the placeholder text in each block.',
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
      name: 'publishedAt',
      type: 'date',
      label: 'Publish date',
      admin: {
        position: 'sidebar',
        description:
          'The date shown on the page and used to order listings. A date in the future forces this record back to draft, so it will not go live until that date passes and someone publishes it.',
      },
    },
    seoField({ noun: 'partner' }),
  ],
}
