interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

interface ImageWithCaptionProps {
  image?: MediaLike | string | number | null
  caption?: string | null
}

const isFullDoc = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function ImageWithCaption({ image, caption }: ImageWithCaptionProps) {
  if (!isFullDoc(image) || !image.url) return null
  return (
    <figure className="my-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.alt ?? ''}
        width={image.width ?? undefined}
        height={image.height ?? undefined}
        className="w-full rounded-md"
      />
      {caption ? (
        <figcaption className="mt-2 text-sm text-text-secondary">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

export default ImageWithCaption
