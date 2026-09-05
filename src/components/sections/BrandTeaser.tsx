import Link from 'next/link'
import { Section } from '../ui/Section'
import { SHELL_RAIL } from '@/lib/layoutGeometry'

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
  // Two-column only when there's an image; without one, a single centered
  // column reads as intentional instead of leaving a dead half-row.
  return (
    <Section
      padding="spacious"
      background="accent"
      rail={hasImage ? SHELL_RAIL : 'md'}
      innerClassName={hasImage ? 'grid gap-10 lg:grid-cols-2 lg:items-center' : 'text-center'}
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
    </Section>
  )
}

export default BrandTeaser
