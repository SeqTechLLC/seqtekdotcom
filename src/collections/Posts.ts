import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '../payload/access/byRole'
import { publishedOrAuthed } from '../payload/access/publishedOrAuthed'
import { editorConfig } from '../payload/editor/editorConfig'
import { enforceDraftWhenScheduled } from '../payload/hooks/enforceDraftWhenScheduled'
import { revalidateOnChange } from '../payload/hooks/revalidateOnChange'
import { slugFromTitle, validateSlug } from '../payload/hooks/slugFromTitle'
import { livePreviewFor } from '../payload/livePreview/url'
import { seoField } from '../payload/fields/seo'
import { publishedAtField } from '../payload/fields/publishing'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'slug', 'publishedAt', 'updatedAt'],
    livePreview: livePreviewFor('posts'),
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
    afterChange: [revalidateOnChange('posts')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Headline',
      required: true,
      admin: {
        description:
          'The title of the post, as it appears on the insights index and the post itself.',
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
          'The last part of the web address for this post, for example "why-localshoring-works". Lowercase words joined by hyphens, no spaces. Changing it on something already published breaks every existing link to it.',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Summary',
      admin: {
        description:
          'One or two sentences shown on the insights index card, and used as the search result summary when the SEO section below is left blank.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Post body',
      editor: editorConfig,
      admin: {
        description:
          'The article. Use the slash menu to drop in a callout, a pull quote or an image between paragraphs.',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Header image',
      required: true,
      admin: {
        description:
          'Runs across the top of the post and appears on the insights index card. Landscape.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'teamMembers',
      label: 'Written by',
      required: true,
      admin: {
        description: 'Shown as the byline. Pick from the team members already in the panel.',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Topics',
      hasMany: true,
      admin: {
        description:
          'What this post is about. Topics are how a "Posts by category" block finds it.',
      },
    },
    {
      name: 'relatedServices',
      type: 'relationship',
      relationTo: 'services',
      // SVC-2: `services` holds three tiers now. Only a leaf is a thing a
      // client buys, so the picker must not offer "What We Do" or a group.
      filterOptions: () => ({ tier: { equals: 'leaf' } }),
      label: 'Services this relates to',
      hasMany: true,
      admin: {
        description:
          'Used to connect the post to the work it describes. Not shown on the post itself.',
      },
    },
    seoField({ noun: 'post', summaryFallback: 'summary above' }),
    publishedAtField({
      effect:
        'Orders the insights index, newest first, and is the date shown on the post itself. Leave it blank and the post sorts to the TOP of that index, ahead of everything dated.',
    }),
  ],
}
