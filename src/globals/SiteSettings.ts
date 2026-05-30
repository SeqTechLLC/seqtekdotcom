import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthedGlobal } from '../payload/access/publishedOrAuthed'
import { httpsUrlValidate } from '../payload/fields/url'
import { revalidateGlobalOnChange } from '../payload/hooks/revalidateOnChange'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  access: {
    read: publishedOrAuthedGlobal,
    update: isAdminOrEditor,
  },
  versions: { drafts: true, max: 50 },
  hooks: {
    afterChange: [revalidateGlobalOnChange('siteSettings')],
  },
  fields: [
    { name: 'companyName', type: 'text' },
    { name: 'tagline', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'text' },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'zip', type: 'text' },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        { name: 'linkedinUrl', type: 'text', validate: httpsUrlValidate },
        { name: 'twitterUrl', type: 'text', validate: httpsUrlValidate },
        { name: 'facebookUrl', type: 'text', validate: httpsUrlValidate },
      ],
    },
    { name: 'footerText', type: 'text' },
    {
      name: 'stats',
      type: 'array',
      fields: [
        { name: 'number', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'suffix', type: 'text' },
      ],
    },
  ],
}
