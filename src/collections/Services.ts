import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { seoField } from '../payload/fields/seo'
import { orderField, publishedAtField } from '../payload/fields/publishing'
import { layoutBlocks } from '../payload/blocks/layout'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'slug', 'order'],
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
      name: 'icon',
      type: 'text',
      label: 'Icon name',
      admin: {
        description:
          'Leave this blank. There is no icon set behind it yet, so whatever you type is printed on the card as text (ROADMAP INERT-2).',
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
    {
      name: 'layout',
      type: 'blocks',
      label: 'Service page',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      admin: {
        description:
          'The service page, built from blocks. Start with a hero so the page has a headline.',
      },
    },
    // Un-hidden with the route that reads it (ROADMAP INERT-1): `/services/[slug]`
    // now calls `buildMetadata` with this group.
    seoField({ noun: 'service' }),
    orderField({ what: 'a service list' }),
    publishedAtField(),
  ],
}
