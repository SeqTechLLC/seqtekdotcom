import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthedGlobal } from '../payload/access/publishedOrAuthed'
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
      name: 'hero',
      type: 'group',
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
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'suffix', type: 'text' },
      ],
    },
    { name: 'featuredCaseStudy', type: 'relationship', relationTo: 'caseStudies' },
    {
      name: 'brandTeaser',
      type: 'group',
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
      fields: [{ name: 'logo', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'featuredTestimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      maxRows: 3,
    },
  ],
}
