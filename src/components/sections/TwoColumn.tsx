import Link from 'next/link'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RichText } from '../richText/RichText'
import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section } from '../ui/Section'
import { boxSizes } from '@/lib/layoutGeometry'

// A `lg:grid-cols-2` media column: half the box above lg, the whole box below.
// Derived so it tracks the shell rail instead of restating a vw fraction that
// only happened to be right at the old width.
const HALF_RAIL_SIZES = boxSizes({ fraction: 0.5 })

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
