import { ResponsiveImage } from '../../ui/ResponsiveImage'

interface MediaSize {
  url?: string | null
  width?: number | null
}

interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, MediaSize | null | undefined>> | null
}

interface FigureProps {
  image?: MediaLike | string | number | null
  caption?: string | null
}

const isFullDoc = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function Figure({ image, caption }: FigureProps) {
  if (!isFullDoc(image) || !image.url) return null
  // Caption-bearing figures are content images; fall back to caption when alt
  // is missing so the image isn't silently announced as decorative.
  const altMedia = { ...image, alt: image.alt ?? caption ?? '' }
  return (
    <figure className="my-6">
      <ResponsiveImage
        media={altMedia}
        sizes="(min-width: 1024px) 720px, 100vw"
        className="w-full rounded-md"
      />
      {caption ? (
        <figcaption className="mt-2 text-center text-sm font-medium text-text-secondary">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

export default Figure
