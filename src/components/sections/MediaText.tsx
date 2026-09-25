import Link from 'next/link'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RichText } from '../richText/RichText'
import { ReadingColumn } from '../ui/ReadingColumn'
import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section, type SectionBackground } from '../ui/Section'
import { SPLIT_MEDIA_SIZES } from '@/lib/layoutGeometry'

interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, { url?: string | null; width?: number | null } | null>> | null
}

type Cta = { label?: string | null; url?: string | null } | null

interface MediaTextProps {
  media?: MediaLike | string | number | null
  mediaPosition?: 'left' | 'right' | null
  body: SerializedEditorState | null | undefined
  cta?: Cta
  background?: SectionBackground | null
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function MediaText({
  media,
  mediaPosition = 'left',
  body,
  cta,
  background = 'none',
}: MediaTextProps) {
  const image = isFullMedia(media) && media.url ? media : null

  const bodyEl = (
    <div>
      {/* The typography plugin's colours are for a light page; the dark band
          needs its inverted set. */}
      <RichText data={body} className={background === 'inverse' ? 'prose-invert' : undefined} />
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

  // The image is required, so this is only a relation that did not populate.
  // A lone text column in half a grid reads as a hole; centre it instead.
  if (!image) {
    return (
      <Section padding="default" background={background ?? 'none'}>
        <ReadingColumn>{bodyEl}</ReadingColumn>
      </Section>
    )
  }

  const mediaEl = (
    <ResponsiveImage
      media={image}
      sizes={SPLIT_MEDIA_SIZES}
      className="w-full rounded-lg border border-border-subtle shadow-sm"
    />
  )

  return (
    <Section
      padding="default"
      background={background ?? 'none'}
      innerClassName="grid gap-10 lg:grid-cols-2 lg:items-center"
    >
      {mediaPosition === 'right' ? (
        <>
          {bodyEl}
          {mediaEl}
        </>
      ) : (
        <>
          {mediaEl}
          {bodyEl}
        </>
      )}
    </Section>
  )
}

export default MediaText
