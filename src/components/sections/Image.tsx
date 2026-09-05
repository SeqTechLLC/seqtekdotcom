import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section } from '../ui/Section'
import { SHELL_RAIL } from '@/lib/layoutGeometry'
import { RAIL_CLASS } from '../ui/Section'
import { boxSizes } from '@/lib/layoutGeometry'

interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, { url?: string | null; width?: number | null } | null>> | null
}

interface ImageProps {
  image?: MediaLike | string | number | null
  caption?: string | null
  width?: 'narrow' | 'standard' | 'wide' | 'full' | null
  alignment?: 'center' | 'left' | 'right' | null
}

// Width variants mirror the Content block's reading-column measures so a
// figure shares the same vertical axis as the body copy around it
// (DESIGN_SYSTEM §11.4 — the rule lives in the block, not the template).
const WIDTH_CLASSES: Record<NonNullable<ImageProps['width']>, string> = {
  narrow: 'max-w-2xl',
  standard: 'max-w-3xl',
  wide: 'max-w-5xl',
  // The widest variant IS the shell rail, so it must move with it rather
  // than restate it — that restatement is what this refactor removes.
  full: RAIL_CLASS[SHELL_RAIL],
}

// `sizes` keyed off the SAME `width` as the classes above, derived from each
// variant's real cap. One string cannot serve four boxes that differ by ~2x:
// keyed to the widest, `standard` (the DEFAULT) requests a derivative two
// rungs beyond its 768px box.
const SIZES: Record<NonNullable<ImageProps['width']>, string> = {
  narrow: boxSizes({ cap: 672 }),
  standard: boxSizes({ cap: 768 }),
  wide: boxSizes({ cap: 1024 }),
  full: boxSizes(),
}

// Alignment positions the figure within the page rail. Center is the default
// and keeps it on the shared reading axis; left/right are for asymmetric layouts.
const ALIGN_CLASSES: Record<NonNullable<ImageProps['alignment']>, string> = {
  center: 'mx-auto',
  left: 'mr-auto',
  right: 'ml-auto',
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function Image({ image, caption, width = 'standard', alignment = 'center' }: ImageProps) {
  if (!isFullMedia(image) || !image.url) return null
  const widthCls = WIDTH_CLASSES[width ?? 'standard']
  const alignCls = ALIGN_CLASSES[alignment ?? 'center']

  return (
    <Section padding="default">
      <figure className={`${widthCls} ${alignCls}`}>
        <ResponsiveImage
          media={image}
          sizes={SIZES[width ?? 'standard']}
          className="w-full rounded-lg border border-border-subtle shadow-sm"
        />
        {caption ? (
          <figcaption className="mt-3 text-small text-text-secondary">{caption}</figcaption>
        ) : null}
      </figure>
    </Section>
  )
}

export default Image
