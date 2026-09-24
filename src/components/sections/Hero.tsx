import Link from 'next/link'

import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section } from '../ui/Section'
import { SPLIT_MEDIA_SIZES } from '@/lib/layoutGeometry'

// The cover photo runs edge to edge behind the whole band, outside the rail,
// so its rendered width is the viewport's. There is no shell geometry to
// derive it from.
const COVER_SIZES = '100vw'

type Cta = { label?: string | null; url?: string | null; variant?: string | null } | null

interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, { url?: string | null; width?: number | null } | null>> | null
}

interface HeroProps {
  variant?: 'text-only' | 'split' | 'cover' | 'with-video' | null
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

// On the cover the green-700 text and borders above fall to ~3:1 against the
// scrim, so the outlined and text-only styles turn white. The focus ring moves
// to green-400: the default green-600 can drop under 3:1 where the scrim sits
// over a pale patch of photo (DESIGN_SYSTEM §12.3).
const COVER_FOCUS = 'focus-visible:outline-brand-green-400'
const COVER_CTA_VARIANT_CLASS: Record<string, string> = {
  primary: `rounded-md bg-accent-strong px-5 py-3 font-medium text-white ${COVER_FOCUS}`,
  secondary: `rounded-md border border-white px-5 py-3 font-medium text-white hover:bg-white/10 ${COVER_FOCUS}`,
  ghost: `rounded-md px-5 py-3 font-medium text-white underline hover:no-underline ${COVER_FOCUS}`,
}

const ctaClass = (variant: string | null | undefined, cover: boolean): string => {
  const table = cover ? COVER_CTA_VARIANT_CLASS : CTA_VARIANT_CLASS
  return table[variant ?? 'primary'] ?? table.primary
}

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
  variant = 'split',
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
  const isCover = variant === 'cover'
  const isCentered = alignment === 'center'

  const copy = (
    <>
      {eyebrow ? (
        // green-200 on the cover: accent-strong is ~3:1 on the scrim, and
        // green-200 clears AA even where the scrim sits over white.
        <p
          className={`text-eyebrow uppercase tracking-wide ${isCover ? 'text-brand-green-200' : 'text-accent-strong'}`}
        >
          {eyebrow}
        </p>
      ) : null}
      {/* DESIGN_SYSTEM §11.4: these are capped measures, so a centred hero has
          to centre THEM, not just the text inside them. Without `mx-auto` here
          the headline box stayed flush left inside a centred rail — an offset
          the container-xl move doubled. */}
      <h1
        className={`mt-3 max-w-3xl text-display font-bold md:text-display-xl ${isCentered ? 'mx-auto' : ''}`}
      >
        {headline}
      </h1>
      {subheadline ? (
        <p
          className={`mt-5 max-w-2xl text-body-lg ${isCover ? 'text-white' : 'text-text-secondary'} ${isCentered ? 'mx-auto' : ''}`}
        >
          {subheadline}
        </p>
      ) : null}
    </>
  )

  const ctas = (
    <div className={`mt-8 flex flex-wrap items-center gap-4 ${isCentered ? 'justify-center' : ''}`}>
      {primaryCta?.label && primaryCta?.url ? (
        <Link href={primaryCta.url} className={ctaClass(primaryCta.variant, isCover)}>
          {primaryCta.label}
        </Link>
      ) : null}
      {secondaryCta?.label && secondaryCta?.url ? (
        <Link
          href={secondaryCta.url}
          className={
            isCover
              ? `rounded-md border border-white/40 px-5 py-3 font-medium text-white ${COVER_FOCUS}`
              : 'font-medium underline'
          }
        >
          {secondaryCta.label}
        </Link>
      ) : null}
    </div>
  )

  if (isCover) {
    return (
      // Ported from the retired homepage hero. The scrim is navy-900 at 80%:
      // white over it stays above 8:1 even where the photo underneath is pure
      // white, which keeps the headline and subheadline at AAA whatever image
      // an editor picks (DESIGN_SYSTEM §12.1). The inverse surface under the
      // photo keeps the words legible while it loads, or if it never does.
      <Section
        padding="none"
        background="inverse"
        className="relative overflow-hidden py-24"
        innerClassName={`relative ${alignmentCls}`}
        bleed={
          <>
            {image ? (
              <ResponsiveImage
                media={image}
                sizes={COVER_SIZES}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            ) : null}
            <div aria-hidden="true" className="absolute inset-0 bg-brand-navy-900/80" />
          </>
        }
      >
        {copy}
        {ctas}
      </Section>
    )
  }

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
            sizes={SPLIT_MEDIA_SIZES}
            className="w-full rounded-lg border border-border-subtle shadow-sm"
            loading="eager"
            fetchPriority="high"
          />
        </>
      ) : (
        <>
          {copy}
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
