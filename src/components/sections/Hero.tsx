import Link from 'next/link'

import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section } from '../ui/Section'
import { boxSizes } from '@/lib/layoutGeometry'

// A `lg:grid-cols-2` media column: half the box above lg, the whole box below.
// Derived so it tracks the shell rail instead of restating a vw fraction that
// only happened to be right at the old width.
const HALF_RAIL_SIZES = boxSizes({ fraction: 0.5 })

// The non-split variants put the image across the whole rail.
const FULL_RAIL_SIZES = boxSizes()

type Cta = { label?: string | null; url?: string | null; variant?: string | null } | null

interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, { url?: string | null; width?: number | null } | null>> | null
}

interface HeroProps {
  variant?: 'text-only' | 'with-image' | 'with-video' | 'split' | null
  eyebrow?: string | null
  headline: string
  subheadline?: string | null
  media?: MediaLike | string | number | null
  videoUrl?: string | null
  primaryCta?: Cta
  secondaryCta?: Cta
  alignment?: 'left' | 'center' | null
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

const ALLOWED_VIDEO_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'fast.wistia.net',
]

/**
 * ROADMAP INERT-2 — `primaryCta.variant` was declared on the `Cta` type and
 * never destructured; the button was hardcoded `bg-accent-strong text-white`,
 * so all three options in the picker drew the same thing.
 */
const CTA_VARIANT_CLASS: Record<string, string> = {
  primary: 'rounded-md bg-accent-strong px-5 py-3 font-medium text-white',
  secondary:
    'rounded-md border border-accent-strong px-5 py-3 font-medium text-accent-strong hover:bg-surface-accent',
  ghost: 'rounded-md px-5 py-3 font-medium text-accent-strong underline hover:no-underline',
}

const ctaClass = (variant: string | null | undefined): string =>
  CTA_VARIANT_CLASS[variant ?? 'primary'] ?? CTA_VARIANT_CLASS.primary

const isAllowedVideoUrl = (value: string | null | undefined): value is string => {
  if (!value) return false
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:') return false
    return ALLOWED_VIDEO_HOSTS.includes(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export function Hero({
  variant = 'text-only',
  eyebrow,
  headline,
  subheadline,
  media,
  videoUrl,
  primaryCta,
  secondaryCta,
  alignment = 'left',
}: HeroProps) {
  const alignmentCls = alignment === 'center' ? 'text-center mx-auto' : 'text-left'
  const image = isFullMedia(media) && media.url ? media : null
  // ROADMAP INERT-2 — `split` used to share one branch with `with-image`, so
  // it drew the identical stacked hero and the picker offered the same layout
  // twice under two names. It now does what it says: copy beside the image.
  const isSplit = variant === 'split' && image !== null

  const copy = (
    <>
      {eyebrow ? (
        <p className="text-eyebrow uppercase tracking-wide text-accent-strong">{eyebrow}</p>
      ) : null}
      <h1 className="mt-3 max-w-3xl text-display font-bold md:text-display-xl">{headline}</h1>
      {subheadline ? (
        <p className="mt-5 max-w-2xl text-body-lg text-text-secondary">{subheadline}</p>
      ) : null}
    </>
  )

  const ctas = (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      {primaryCta?.label && primaryCta?.url ? (
        <Link href={primaryCta.url} className={ctaClass(primaryCta.variant)}>
          {primaryCta.label}
        </Link>
      ) : null}
      {secondaryCta?.label && secondaryCta?.url ? (
        <Link href={secondaryCta.url} className="font-medium underline">
          {secondaryCta.label}
        </Link>
      ) : null}
    </div>
  )

  return (
    // The hero shares the page grid edge with every section below it (two-column,
    // video bands), so it takes the shell rail like everything else. Headline at
    // display scale keeps its own measure cap so it wraps editorially rather than
    // spanning the rail; subheadline likewise.
    <Section
      padding="spacious"
      innerClassName={isSplit ? 'grid gap-10 lg:grid-cols-2 lg:items-center' : alignmentCls}
    >
      {isSplit ? (
        <>
          <div className={alignmentCls}>
            {copy}
            {ctas}
          </div>
          <ResponsiveImage
            media={image}
            sizes={HALF_RAIL_SIZES}
            className="w-full rounded-lg border border-border-subtle shadow-sm"
            loading="eager"
            fetchPriority="high"
          />
        </>
      ) : (
        <>
          {copy}
          {variant === 'with-image' && image ? (
            <ResponsiveImage
              media={image}
              sizes={FULL_RAIL_SIZES}
              className="mt-8 w-full rounded-lg border border-border-subtle shadow-sm"
              loading="eager"
              fetchPriority="high"
            />
          ) : null}
          {variant === 'with-video' && isAllowedVideoUrl(videoUrl) ? (
            <div className="mt-8 aspect-video">
              <iframe
                src={videoUrl}
                title={headline}
                className="h-full w-full rounded-md"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : null}
          {ctas}
        </>
      )}
    </Section>
  )
}

export default Hero
