import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { layoutBlocks } from '../payload/blocks/layout'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'
import { caseStudySkeleton } from '../payload/seed/skeletons/caseStudy'
import { seoField } from '../payload/fields/seo'
import { publishedAtField } from '../payload/fields/publishing'

export const CaseStudies: CollectionConfig = {
  slug: 'caseStudies',
  labels: { singular: 'Case study', plural: 'Case studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'slug', 'industry', 'updatedAt'],
    livePreview: livePreviewFor('caseStudies'),
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
    afterChange: [revalidateOnChange('caseStudies')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Case study title',
      required: true,
      admin: {
        description:
          'The result, in a line. Shown on the case study index card and at the top of the study.',
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
          'The last part of the web address for this case study, for example "taurex-eticketing". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Summary line',
      admin: {
        description:
          'One sentence under the title, on the index card and in search results when the SEO section below is left blank.',
      },
    },
    {
      name: 'industry',
      type: 'relationship',
      relationTo: 'industries',
      label: 'Client industry',
      required: true,
      admin: {
        description:
          'What sector the client is in. A "Case studies by industry" block filters on this.',
      },
    },
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      // SVC-2: `services` holds three tiers now. Only a leaf is a thing a
      // client buys, so the picker must not offer "What We Do" or a group.
      filterOptions: () => ({ tier: { equals: 'leaf' } }),
      label: 'Work we did',
      hasMany: true,
      admin: {
        description:
          'Which services this engagement used. A "Case studies by service" block filters on this.',
      },
    },
    {
      name: 'client',
      type: 'group',
      label: 'The client',
      admin: {
        description: 'Who the work was for. Fill in what the client has agreed to have published.',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Client name',
          admin: { description: 'The company name as they write it themselves.' },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Client logo',
          admin: {
            description:
              'Their mark, for the case study header and logo walls. Transparent background where possible.',
          },
        },
        {
          name: 'isAnonymized',
          type: 'checkbox',
          label: 'Keep the client anonymous',
          defaultValue: false,
          admin: {
            description:
              'Tick when the client has not approved being named. Write around the name in the body too.',
          },
        },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Header image',
      required: true,
      admin: {
        description:
          'Runs across the top of the case study and appears on the index card. Landscape.',
      },
    },
    {
      // spec 010 / ADR 0009: the block-composed body. New records get the
      // default skeleton; the detail route renders this via RenderBlocks.
      name: 'layout',
      type: 'blocks',
      label: 'Case study body',
      labels: { singular: 'Block', plural: 'Blocks' },
      blocks: [...layoutBlocks],
      defaultValue: caseStudySkeleton,
      admin: {
        description:
          'The study itself, built from blocks. A new case study starts from a standard outline; replace the placeholder text in each block.',
      },
    },
    {
      name: 'testimonial',
      type: 'relationship',
      relationTo: 'testimonials',
      label: 'Client quote',
      admin: {
        description:
          'Pick a testimonial already in the panel. Add it to Testimonials first if it is not there.',
      },
    },
    {
      name: 'relatedCaseStudies',
      type: 'relationship',
      relationTo: 'caseStudies',
      label: 'Read next',
      hasMany: true,
      maxRows: 3,
      admin: { description: 'Up to three other studies to offer at the end of this one.' },
    },
    seoField({ noun: 'case study', summaryFallback: 'summary line above' }),
    publishedAtField({
      effect:
        'Orders the case study index, newest first, though it is not shown on the study itself. Leave it blank and the study sorts to the TOP of that index, ahead of everything dated.',
    }),
  ],
}
