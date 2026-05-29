import type { Access, CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'

const readActiveOrAuthed: Access = ({ req }) => {
  if (req.user?.roles?.length) return true
  return { isActive: { equals: true } }
}

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'personName',
    defaultColumns: ['personName', 'company', 'isActive'],
  },
  access: {
    read: readActiveOrAuthed,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
    admin: isAdminOrEditor,
  },
  hooks: {
    afterChange: [revalidateOnChange('testimonials')],
  },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'personName', type: 'text', required: true },
    { name: 'personTitle', type: 'text' },
    { name: 'company', type: 'text' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'caseStudy', type: 'relationship', relationTo: 'caseStudies' },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
  ],
}
