import Link from 'next/link'

import { ResponsiveImage } from '../ui/ResponsiveImage'
import { SPLIT_MEDIA_SIZES } from '@/lib/layoutGeometry'
import type { CardHeadingLevel, FeaturedItem } from './types'

interface FeaturedCardProps {
  item: FeaturedItem
  headingLevel: CardHeadingLevel
  /** The section sits on the dark band, so text drawn straight on it inverts. */
  inverse?: boolean
}

/**
 * The first item of a `cards` block drawn large: picture on one side, title,
 * one line and a button on the other. The old featured-case-study look, made
 * collection-agnostic. An item with no picture keeps the same weight on a
 * panel of its own rather than leaving half the row empty.
 */
export function FeaturedCard({ item, headingLevel, inverse = false }: FeaturedCardProps) {
  const Title = headingLevel
  const onPanel = !item.image
  const muted = inverse && !onPanel ? 'text-text-inverse/80' : 'text-text-secondary'

  const copy = (
    <div>
      <Title className="text-h2 font-bold">{item.title}</Title>
      {item.subtitle ? <p className={`mt-3 text-body-lg ${muted}`}>{item.subtitle}</p> : null}
      {item.href ? (
        <Link
          href={item.href}
          className="mt-6 inline-block rounded-md bg-accent-strong px-5 py-3 font-medium text-white"
        >
          {item.ctaLabel ?? 'Read more'}
        </Link>
      ) : null}
    </div>
  )

  if (!item.image) {
    return (
      <div className="mt-8 rounded-lg border border-border-subtle bg-surface-elevated p-8 text-text-primary shadow-sm md:p-10">
        {copy}
      </div>
    )
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-center">
      {item.imageIsLogo ? (
        <div className="flex items-center justify-center rounded-md border border-border-subtle bg-surface px-6 py-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image.url}
            alt={item.image.alt ?? item.title}
            className="h-20 w-auto object-contain md:h-24"
          />
        </div>
      ) : (
        <ResponsiveImage
          media={{ ...item.image, alt: item.image.alt ?? item.title }}
          sizes={SPLIT_MEDIA_SIZES}
          className="w-full rounded-md"
        />
      )}
      {copy}
    </div>
  )
}
