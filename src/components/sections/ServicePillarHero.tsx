import Link from 'next/link'

import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section } from '../ui/Section'
import { gridSizes } from '@/lib/layoutGeometry'

// A `lg:grid-cols-2` media column: half the box above lg, the WHOLE box below,
// because `lg:grid-cols-2` is the only thing making the parent two columns.
// `gridSizes` models that; a constant 0.5 fraction does not — it under-declares
// on every viewport below 1024 and makes the browser upscale a derivative that
// is one to two rungs too small, on the LCP image.
const HALF_RAIL_SIZES = gridSizes({
  columns: [
    [1024, 2],
    [0, 1],
  ],
  gap: 10,
})

interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, { url?: string | null; width?: number | null } | null>> | null
}

type Cta = { label?: string | null; url?: string | null } | null

interface ServicePillarHeroProps {
  pillarName: string
  headline: string
  subheadline?: string | null
  heroImage?: MediaLike | string | number | null
  primaryCta?: Cta
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function ServicePillarHero({
  pillarName,
  headline,
  subheadline,
  heroImage,
  primaryCta,
}: ServicePillarHeroProps) {
  return (
    <Section padding="spacious" innerClassName="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="text-caption uppercase tracking-wide text-accent-strong">{pillarName}</p>
        <h1 className="mt-2 text-h1 font-bold">{headline}</h1>
        {subheadline ? (
          <p className="mt-4 text-body-lg text-text-secondary">{subheadline}</p>
        ) : null}
        {primaryCta?.label && primaryCta?.url ? (
          <Link
            href={primaryCta.url}
            className="mt-8 inline-block rounded-md bg-accent-strong px-5 py-3 font-medium text-white"
          >
            {primaryCta.label}
          </Link>
        ) : null}
      </div>
      {isFullMedia(heroImage) && heroImage.url ? (
        <ResponsiveImage
          media={heroImage}
          sizes={HALF_RAIL_SIZES}
          className="w-full rounded-md"
          loading="eager"
          fetchPriority="high"
        />
      ) : null}
    </Section>
  )
}

export default ServicePillarHero
