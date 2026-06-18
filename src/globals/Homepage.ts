import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthedGlobal } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { safeUrlValidate } from '../payload/fields/url'
import { revalidateGlobalOnChange } from '../payload/hooks/revalidateOnChange'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  access: {
    read: publishedOrAuthedGlobal,
    update: isAdminOrEditor,
  },
  versions: { drafts: true, max: 50 },
  hooks: {
    afterChange: [revalidateGlobalOnChange('homepage')],
  },
  fields: [
    {
      // spec 010 / ADR 0009 (Phase F): the homepage is block-composed. `/`
      // renders this via RenderBlocks; editors reorder/edit sections with no
      // deploy. Composed from the legacy fields below by homepageToLayout.ts.
      name: 'layout',
      type: 'blocks',
      blocks: [...layoutBlocks],
    },
    // ---- Legacy structured fields (expand/contract, R2) ----
    // Composed into `layout` by homepageToLayout.ts; hidden + read-only and kept
    // one release as an in-DB rollback net, then removed by drop_legacy_body_columns.
    {
      name: 'hero',
      type: 'group',
      admin: { hidden: true, readOnly: true },
      fields: [
        { name: 'headline', type: 'text' },
        { name: 'subheadline', type: 'textarea' },
        { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
        {
          name: 'cta',
          type: 'group',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'url', type: 'text', validate: safeUrlValidate },
          ],
        },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'suffix', type: 'text' },
      ],
    },
    {
      name: 'featuredCaseStudy',
      type: 'relationship',
      relationTo: 'caseStudies',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'brandTeaser',
      type: 'group',
      admin: { hidden: true, readOnly: true },
      fields: [
        { name: 'headline', type: 'text' },
        { name: 'body', type: 'textarea' },
        { name: 'linkLabel', type: 'text' },
        { name: 'linkUrl', type: 'text', validate: safeUrlValidate },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'clientLogos',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [{ name: 'logo', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'featuredTestimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      maxRows: 3,
      admin: { hidden: true, readOnly: true },
    },
  ],
}
