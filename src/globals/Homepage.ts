import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthedGlobal } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { revalidateGlobalOnChange } from '../payload/hooks/revalidateOnChange'
import { ADMIN_GROUPS } from '../collections/groups'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: {
    // Content, not `site`, and that was a measurement. `groupNavItems` merges
    // collections and globals by group LABEL, but appends every global after
    // every collection — so a `Site` heading holding nothing but Homepage
    // drew BELOW `Admin`, at the bottom of the panel. The most-edited
    // document on the site is not something to go hunting for under the
    // sign-in settings. Under `Content` it merges into the group and lands
    // beside the pages it sits next to in the IA.
    group: ADMIN_GROUPS.content,
    description:
      'The homepage at /, built from blocks. There is only one of it, so it is edited here instead of in a list.',
  },
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
      label: 'Homepage content',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      admin: {
        description:
          'The homepage, built from blocks, top to bottom. Add a block for each band of the page; drag the handles to reorder.',
      },
    },
  ],
}
