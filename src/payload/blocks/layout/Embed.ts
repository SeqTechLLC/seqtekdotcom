import type { Block } from 'payload'

import { blockAdmin } from '../blockAdmin'

import { backgroundField, eyebrowField, headingField } from '../../fields/blockCopy'
import { httpsUrlValidate } from '../../fields/url'
import { requiredWhen } from '../conditional'

type EmbedSibling = { kind?: string }

const isVideo = (d: EmbedSibling | undefined) => d?.kind === 'video'
const isFrame = (d: EmbedSibling | undefined) => d?.kind === 'map' || d?.kind === 'page'

const videoOnly = (description: string) => ({
  condition: (_: unknown, siblingData: EmbedSibling) => isVideo(siblingData),
  description,
})

const frameOnly = (description: string) => ({
  condition: (_: unknown, siblingData: EmbedSibling) => isFrame(siblingData),
  description,
})

const eyebrow = eyebrowField({
  description:
    'Shown only for a video. The small line above it, e.g. "From the podcast". Marks the video as a deliberate interlude rather than decoration.',
})

// Something from another site, framed on the page (WordPress "Embed" and
// "Video"). Replaces `video-embed`, `map` and the old iframe-only `embed`.
export const Embed: Block = {
  slug: 'embed',
  interfaceName: 'EmbedBlock',
  labels: { singular: 'Embed (video, map or page)', plural: 'Embeds (video, map or page)' },
  admin: blockAdmin('specialty', 'embed', 'Embed (video, map or page)'),
  fields: [
    {
      name: 'kind',
      type: 'select',
      label: 'What to embed',
      required: true,
      defaultValue: 'video',
      admin: {
        description:
          'A YouTube or Vimeo video, a map from OpenStreetMap or Google Maps, or any other web page that allows being shown inside another site. The fields below change to match.',
      },
      options: [
        { label: 'Video', value: 'video' },
        { label: 'Map', value: 'map' },
        { label: 'Web page', value: 'page' },
      ],
    },
    headingField(),
    { ...eyebrow, admin: { ...eyebrow.admin, ...videoOnly(String(eyebrow.admin?.description)) } },
    {
      name: 'title',
      type: 'text',
      label: 'What this is',
      required: true,
      admin: {
        description:
          'Names the video, map or page for screen readers, e.g. "Workshop recap" or "Map of our Tulsa office". Not drawn on screen. For a video, use its real title.',
      },
    },
    {
      name: 'provider',
      type: 'select',
      label: 'Where the video is hosted',
      required: true,
      defaultValue: 'youtube',
      admin: videoOnly(
        'Shown only for a video. Which service to embed from; it decides how the ID below is read.',
      ),
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
      ],
    },
    (() => {
      const { admin, validate, custom } = requiredWhen<EmbedSibling>(isVideo, {
        description:
          'Shown only for a video. Just the ID, not the whole address. On YouTube it is the part after "v=" (dQw4w9WgXcQ); on Vimeo it is the digits at the end of the address.',
      })
      return {
        name: 'videoId' as const,
        type: 'text' as const,
        label: 'Video ID' as const,
        admin,
        custom,
        // YouTube IDs are 11 chars; Vimeo IDs are numeric up to ~10 digits.
        // The pattern blocks query-param injection (e.g. "abc?autoplay=1").
        validate: (value: unknown, args: { data?: unknown; siblingData?: unknown }) => {
          const requiredCheck = validate(value, args)
          if (requiredCheck !== true) return requiredCheck
          if (value === null || value === undefined || value === '') return true
          if (typeof value !== 'string') return 'The video ID must be text'
          return /^[\w-]{6,32}$/.test(value)
            ? true
            : 'The video ID is 6 to 32 letters, digits, hyphens or underscores'
        },
      }
    })(),
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      label: 'Poster image',
      admin: videoOnly(
        'Shown only for a video, and optional. With one set, the page shows this still and a Play button, and loads the video only when a reader clicks it, which keeps YouTube or Vimeo from tracking people who never watch. Leave it blank to embed the player directly.',
      ),
    },
    (() => {
      const { admin, validate, custom } = requiredWhen<EmbedSibling>(isFrame, {
        description:
          'Shown only for a map or a web page. The full https:// address to show in the frame. For a map, use the embed address from OpenStreetMap or Google Maps ("Share > Embed a map", then copy the src address); other map hosts are refused and the block shows a notice instead. A web page must allow embedding, and many sites refuse.',
      })
      return {
        name: 'url' as const,
        type: 'text' as const,
        label: 'Address to embed' as const,
        admin,
        custom,
        validate: (value: unknown, args: { data?: unknown; siblingData?: unknown }) => {
          const requiredCheck = validate(value, args)
          if (requiredCheck !== true) return requiredCheck
          return httpsUrlValidate(value)
        },
      }
    })(),
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: frameOnly(
        'Shown only for a map or a web page, and optional. A visible line under the frame, e.g. the street address.',
      ),
    },
    {
      name: 'height',
      type: 'select',
      label: 'Frame height',
      defaultValue: 'medium',
      admin: frameOnly(
        'Shown only for a map or a web page. How tall the frame is; a longer page scrolls inside it. Short suits a map, tall a form or a dashboard.',
      ),
      options: [
        { label: 'Short', value: 'short' },
        { label: 'Medium', value: 'medium' },
        { label: 'Tall', value: 'tall' },
      ],
    },
    backgroundField(),
  ],
}
