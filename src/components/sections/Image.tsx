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
  full: 'max-w-container-lg',
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
      <div className="mx-auto max-w-container-lg">
        <figure className={`${widthCls} ${alignCls}`}>
          <ResponsiveImage
            media={image}
            sizes="(min-width: 1024px) 60vw, 100vw"
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
