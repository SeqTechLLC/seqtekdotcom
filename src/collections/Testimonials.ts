import type { Access, CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'

// Editorial sessions see every testimonial (including inactive). Anon and
// any future non-editorial roles only see active ones. The previous
// `req.user?.roles?.length` check matched any authenticated user, which
// would leak inactive testimonials to roles introduced later (e.g. viewer).
const EDITORIAL_ROLES = new Set(['admin', 'editor'])
const readActiveOrAuthed: Access = ({ req }) => {
  if (req.user?.roles?.some((r) => EDITORIAL_ROLES.has(r))) return true
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
