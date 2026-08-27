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
    {
      name: 'quote',
      type: 'textarea',
      label: 'What they said',
      required: true,
      admin: {
        description:
          'The quote itself, without surrounding quotation marks. Keep the words as they said them; trim with an ellipsis rather than rewriting.',
      },
    },
    {
      name: 'personName',
      type: 'text',
      label: 'Who said it',
      required: true,
      admin: { description: 'Their full name, as it should appear under the quote.' },
    },
    {
      name: 'personTitle',
      type: 'text',
      label: 'Their job title',
      admin: { description: 'For example "VP of Operations". Shown under their name.' },
    },
    {
      name: 'company',
      type: 'text',
      label: 'Their company',
      admin: {
        description: 'Where they work. Only publish it if the client has agreed to be named.',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Their photo',
      admin: {
        description:
          'Optional headshot. A testimonial block set to one of the "with photo" layouts falls back to text only when this is empty.',
      },
    },
    {
      name: 'caseStudy',
      type: 'relationship',
      relationTo: 'caseStudies',
      label: 'From this engagement',
      admin: { description: 'The case study this quote came out of, if there is one.' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Cleared for use',
      defaultValue: true,
      admin: {
        description:
          'Untick to retire a quote without deleting it. Blocks that pull testimonials automatically skip the ones not cleared.',
      },
    },
  ],
}
