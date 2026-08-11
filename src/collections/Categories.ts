import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
  },
  access: {
    read: () => true,
    // Editors write categories like every other content collection; only admins
    // delete, which is the repo-wide rule. This was previously admin-only for
    // create/update on a "curated taxonomy" rationale, which was inconsistent
    // with every other collection and blocked an editor from running the
    // content seed (docs/content-drafts/categories.json writes categories).
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [slugFromTitle('title')],
    afterChange: [revalidateOnChange('categories')],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: validateSlug,
    },
  ],
}
