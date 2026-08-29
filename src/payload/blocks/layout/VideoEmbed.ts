import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'
import { eyebrowField } from '../../fields/blockCopy'

// Per BLOCK_LIBRARY.md §5.6.
export const VideoEmbed: Block = {
  slug: 'video-embed',
  interfaceName: 'VideoEmbedBlock',
  labels: { singular: 'Video embed', plural: 'Video embeds' },
  admin: blockAdmin('specialty', 'video-embed', 'Video embed', 'svg'),
  fields: [
    {
      name: 'provider',
      type: 'select',
      label: 'Where the video is hosted',
      required: true,
      defaultValue: 'youtube',
      admin: {
        description: 'Which service to embed from. It decides how the ID below is read.',
      },
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
      ],
    },
    {
      name: 'videoId',
      type: 'text',
      label: 'Video ID',
      required: true,
      // YouTube IDs are 11 chars; Vimeo IDs are numeric up to ~10 digits.
      // The pattern blocks query-param injection (e.g. "abc?autoplay=1").
      validate: (value: unknown): true | string => {
        if (typeof value !== 'string') return 'videoId must be a string'
        return /^[\w-]{6,32}$/.test(value)
          ? true
          : 'videoId must be 6–32 alphanumerics, hyphens, or underscores'
      },
      admin: {
        description:
          'Just the ID, not the whole address. On YouTube it is the part after "v=" (dQw4w9WgXcQ); on Vimeo it is the digits at the end of the address.',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Video title',
      required: true,
      admin: {
        description:
          'Names the video for screen readers and search engines. Use the real title of the video.',
      },
    },
    eyebrowField({
      description:
        'The small line above the video, e.g. "From the SEQTEK Podcast". Marks it as a deliberate interlude rather than decoration.',
    }),
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      label: 'Poster image',
      admin: {
        description:
          'Optional. With one set, the page shows this still and a Play button, and loads the video only when a reader clicks it — which keeps YouTube or Vimeo from tracking people who never watch. Leave it blank to embed the player directly.',
      },
    },
  ],
}
