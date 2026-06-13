import Link from 'next/link'

interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface BrandTeaserProps {
  headline: string
  body: string
  linkLabel: string
  linkUrl: string
  image?: MediaLike | string | number | null
}

const isFullMedia = (v: unknown): v is MediaLike =>
  typeof v === 'object' && v !== null && 'url' in (v as object)

export function BrandTeaser({ headline, body, linkLabel, linkUrl, image }: BrandTeaserProps) {
  const hasImage = isFullMedia(image) && !!image.url
  return (
    <section className="bg-surface-accent px-4 py-16 md:px-6 lg:px-8">
      {/* Two-column only when there's an image; without one, a single centered
          column reads as intentional instead of leaving a dead half-row. */}
      <div
        className={
          hasImage
            ? 'mx-auto grid max-w-container-lg gap-10 lg:grid-cols-2 lg:items-center'
            : 'mx-auto max-w-container-md text-center'
        }
      >
        <div>
          <h2 className="text-h2 font-bold">{headline}</h2>
          <p className="mt-4 text-body-lg text-text-secondary">{body}</p>
          <Link
            href={linkUrl}
            className="mt-6 inline-block rounded-md border border-accent-strong px-5 py-3 font-medium text-accent-strong hover:bg-accent-strong hover:text-white"
          >
            {linkLabel}
          </Link>
        </div>
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(image as MediaLike).url!}
            alt={(image as MediaLike).alt ?? ''}
            className="w-full rounded-md"
          />
        ) : null}
      </div>
    </section>
  )
}

export default BrandTeaser
