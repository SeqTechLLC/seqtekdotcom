import type { Block } from 'payload'

// Per BLOCK_LIBRARY.md §5.6.
export const VideoEmbed: Block = {
  slug: 'video-embed',
  interfaceName: 'VideoEmbedBlock',
  labels: { singular: 'Video embed', plural: 'Video embeds' },
  fields: [
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'youtube',
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
      ],
    },
    {
      name: 'videoId',
      type: 'text',
      required: true,
      // YouTube IDs are 11 chars; Vimeo IDs are numeric up to ~10 digits.
      // The pattern blocks query-param injection (e.g. "abc?autoplay=1").
      validate: (value: unknown): true | string => {
        if (typeof value !== 'string') return 'videoId must be a string'
        return /^[\w-]{6,32}$/.test(value)
          ? true
          : 'videoId must be 6–32 alphanumerics, hyphens, or underscores'
      },
    },
    { name: 'title', type: 'text', required: true },
    {
      // Optional kicker above the card (e.g. "From the SEQTEK Podcast") —
      // marks the video as an intentional interlude on narrative pages.
      name: 'eyebrow',
      type: 'text',
    },
    { name: 'thumbnail', type: 'upload', relationTo: 'media' },
  ],
}
