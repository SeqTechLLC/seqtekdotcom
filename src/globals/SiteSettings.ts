import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../payload/access/byRole'
import { revalidateGlobalOnChange } from '../payload/hooks/revalidateOnChange'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  access: {
    read: () => true,
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
        { name: 'linkedinUrl', type: 'text' },
        { name: 'twitterUrl', type: 'text' },
        { name: 'facebookUrl', type: 'text' },
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
