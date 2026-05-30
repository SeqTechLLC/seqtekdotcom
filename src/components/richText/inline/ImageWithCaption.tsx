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

interface ImageWithCaptionProps {
  image?: MediaLike | string | number | null
  caption?: string | null
}

const isFullDoc = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function ImageWithCaption({ image, caption }: ImageWithCaptionProps) {
  if (!isFullDoc(image) || !image.url) return null
  const altMedia = { ...image, alt: image.alt ?? caption ?? '' }
  return (
    <figure className="my-6">
      <ResponsiveImage
        media={altMedia}
        sizes="(min-width: 1024px) 720px, 100vw"
        className="w-full rounded-md"
      />
      {caption ? (
        <figcaption className="mt-2 text-sm text-text-secondary">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

export default ImageWithCaption
