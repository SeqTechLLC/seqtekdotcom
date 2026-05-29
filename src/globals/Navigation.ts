import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../payload/access/byRole'
import { revalidateGlobalOnChange } from '../payload/hooks/revalidateOnChange'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  versions: { drafts: true, max: 50 },
  hooks: {
    afterChange: [revalidateGlobalOnChange('navigation')],
  },
  fields: [
    {
      name: 'mainNav',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        {
          name: 'children',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'footerNav',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        {
          name: 'children',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'ctaButton',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
  ],
}
