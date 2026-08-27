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
    {
      name: 'title',
      type: 'text',
      label: 'Topic name',
      required: true,
      admin: {
        description: 'What this topic is called on a post and in a "Posts by category" block.',
      },
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
          'The last part of the web address for this topic, for example "delivery". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
  ],
}
