import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { editorConfig } from '../payload/editor/editorConfig'
import { httpsUrlValidate } from '../payload/fields/url'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'

export const TeamMembers: CollectionConfig = {
  slug: 'teamMembers',
  labels: { singular: 'Team member', plural: 'Team members' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'isLeadership', 'order'],
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
    admin: isAdminOrEditor,
  },
  hooks: {
    beforeChange: [slugFromTitle('name')],
    afterChange: [revalidateOnChange('teamMembers')],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: validateSlug,
    },
    { name: 'title', type: 'text' },
    { name: 'role', type: 'text' },
    { name: 'photo', type: 'upload', relationTo: 'media', required: true },
    { name: 'bio', type: 'richText', editor: editorConfig },
    {
      name: 'expertise',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'certifications',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'education',
      type: 'array',
      fields: [
        { name: 'degree', type: 'text', required: true },
        { name: 'institution', type: 'text', required: true },
      ],
    },
    { name: 'linkedinUrl', type: 'text', validate: httpsUrlValidate },
    { name: 'email', type: 'text' },
    {
      name: 'personalFacts',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    { name: 'quote', type: 'textarea' },
    { name: 'isLeadership', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number' },
  ],
}
