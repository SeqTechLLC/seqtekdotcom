import Link from 'next/link'

import { ResponsiveImage } from '../ui/ResponsiveImage'

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
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className={`mx-auto max-w-container-md ${alignmentCls}`}>
        {eyebrow ? (
          <p className="text-eyebrow uppercase tracking-wide text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-h1 font-bold">{headline}</h1>
        {subheadline ? (
          <p className="mt-4 text-body-lg text-text-secondary">{subheadline}</p>
        ) : null}
        {(variant === 'with-image' || variant === 'split') && isFullMedia(media) && media.url ? (
          <ResponsiveImage
            media={media}
            sizes="100vw"
            className="mt-8 w-full rounded-md"
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
            />
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {primaryCta?.label && primaryCta?.url ? (
            <Link
              href={primaryCta.url}
              className="rounded-md bg-accent px-5 py-3 font-medium text-white"
            >
              {primaryCta.label}
            </Link>
          ) : null}
          {secondaryCta?.label && secondaryCta?.url ? (
            <Link href={secondaryCta.url} className="font-medium underline">
              {secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default Hero
