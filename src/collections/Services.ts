import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { seoField } from '../payload/fields/seo'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'slug', 'pillar', 'order'],
  },
  access: {
    read: publishedOrAuthed,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
    admin: isAdminOrEditor,
  },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: {
    beforeChange: [slugFromTitle('title'), enforceDraftWhenScheduled],
    afterChange: [revalidateOnChange('services')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Service name',
      required: true,
      admin: { description: 'What this service is called on service cards and case studies.' },
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
          'The last part of the web address for this service, for example "software-delivery". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    {
      name: 'pillar',
      type: 'relationship',
      relationTo: 'servicePillars',
      label: 'Belongs to pillar',
      required: true,
      admin: {
        description:
          'Which of the three pillars this service sits under. A "Services by pillar" block filters on this.',
      },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icon name',
      admin: {
        description:
          'Optional short icon keyword used by service cards. Leave blank unless a developer has given you one.',
      },
    },
    {
      name: 'relatedCaseStudies',
      type: 'relationship',
      relationTo: 'caseStudies',
      label: 'Proof of this work',
      hasMany: true,
      admin: { description: 'Case studies that show this service delivered.' },
    },
    seoField({ noun: 'service', hidden: true }),
    {
      name: 'order',
      type: 'number',
      label: 'Sort position',
      admin: {
        description:
          'Lowest number first wherever these are listed together. Leave blank and the list falls back to alphabetical.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Publish date',
      admin: {
        position: 'sidebar',
        description:
          'The date shown on the page and used to order listings. A date in the future forces this record back to draft, so it will not go live until that date passes and someone publishes it.',
      },
    },
  ],
}
