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
    { name: 'videoId', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'thumbnail', type: 'upload', relationTo: 'media' },
  ],
}
