import { ResponsiveImage } from '../ui/ResponsiveImage'

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
  full: 'max-w-container-xl',
}

// `sizes` per width variant, because one string cannot serve four boxes that
// differ by ~2x — a single value keyed to the widest variant makes `standard`
// (the DEFAULT) request the 1600w derivative for a 768px box.
//
// Padding lives on the OUTER <section> here (px-4 / md:px-6 / lg:px-8) and the
// max-width on an inner UNPADDED div, so the box is `min(cap, 100vw - padding)`
// — a different recipe from the case-study article, which puts both on one
// element. DESIGN_SYSTEM §11.4: "the two recipes do not commute."
// Ladder for reference (Media.ts): 640 / 1024 / 1600 / 2400.
const SIZES: Record<NonNullable<ImageProps['width']>, string> = {
  // 672px from md up (768 - 48 = 720 >= 672).
  narrow: '(min-width: 768px) 672px, calc(100vw - 32px)',
  // 768px from 816 up (816 - 48 = 768). Not 1024: the md padding is 48px, so
  // the cap is reached inside the md band, and declaring `100vw - 48px` across
  // all of 768-1023 asks for up to 975px for a 768px box — one rung too far
  // (2400w instead of 1600w) at DPR 2.
  standard: '(min-width: 816px) 768px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)',
  // 1024px once 100vw - 64 clears it.
  wide: '(min-width: 1088px) 1024px, (min-width: 1024px) calc(100vw - 64px), (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)',
  // Fills the rail: capped by container-xl at 1344+, viewport-bound below.
  full: '(min-width: 1344px) 1280px, (min-width: 1024px) calc(100vw - 64px), (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)',
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
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-xl">
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
      </div>
    </section>
  )
}

export default Image
