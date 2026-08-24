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
  ],
}
