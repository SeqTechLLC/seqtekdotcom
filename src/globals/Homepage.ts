import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthedGlobal } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
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
      // spec 010 / ADR 0009: the homepage is block-composed. `/` renders this
      // via RenderBlocks; editors reorder/edit sections with no deploy.
      name: 'layout',
      type: 'blocks',
      blocks: [...layoutBlocks],
    },
  ],
}
