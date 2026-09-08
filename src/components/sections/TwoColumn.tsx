import Link from 'next/link'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RichText } from '../richText/RichText'
import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section } from '../ui/Section'
import { gridSizes } from '@/lib/layoutGeometry'

// A `lg:grid-cols-2` media column: half the box above lg, the WHOLE box below,
// because `lg:grid-cols-2` is the only thing making the parent two columns.
// `gridSizes` models that; a constant 0.5 fraction does not — it under-declares
// on every viewport below 1024 and makes the browser upscale a derivative that
// is one to two rungs too small, on the LCP image.
const HALF_RAIL_SIZES = gridSizes({
  columns: [
    [1024, 2],
    [0, 1],
  ],
  gap: 10,
})

interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, { url?: string | null; width?: number | null } | null>> | null
}

type Cta = { label?: string | null; url?: string | null } | null

interface TwoColumnProps {
  mediaPosition: 'left' | 'right'
  body: SerializedEditorState | null | undefined
  media?: MediaLike | string | number | null
  cta?: Cta
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function TwoColumn({ mediaPosition, body, media, cta }: TwoColumnProps) {
  const mediaEl =
    isFullMedia(media) && media.url ? (
      <ResponsiveImage
        media={media}
        sizes={HALF_RAIL_SIZES}
        className="w-full rounded-lg border border-border-subtle shadow-sm"
      />
    ) : null
  const bodyEl = (
    <div>
      <RichText data={body} />
      {cta?.label && cta?.url ? (
        <Link
          href={cta.url}
          className="mt-6 inline-block rounded-md bg-accent-strong px-5 py-3 font-medium text-white"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  )

  return (
    <Section padding="default" innerClassName="grid gap-10 lg:grid-cols-2 lg:items-center">
      {mediaPosition === 'left' ? (
        <>
          {mediaEl}
          {bodyEl}
        </>
      ) : (
        <>
          {bodyEl}
          {mediaEl}
        </>
      )}
    </Section>
  )
}

export default TwoColumn
