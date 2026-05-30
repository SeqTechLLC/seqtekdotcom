/* eslint-disable @next/next/no-img-element */
// Renders a <picture> with WebP + JPEG srcsets generated from Payload's
// per-size derivatives (see Media.ts). Bypasses next/image deliberately:
// Payload + CloudFront already serves optimized variants, so routing through
// the Next optimizer would double-optimize and miss the S3 cache.

interface MediaSize {
  url?: string | null
  width?: number | null
}

interface ResponsiveImageMedia {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, MediaSize | null | undefined>> | null
}

interface ResponsiveImageProps {
  media: ResponsiveImageMedia
  /** HTML sizes attribute, e.g. "(min-width: 1024px) 50vw, 100vw" */
  sizes: string
  className?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
}

const BREAKPOINT_NAMES = ['mobile', 'tablet', 'desktop', 'wide'] as const

function buildSrcSet(sizes: ResponsiveImageMedia['sizes'], format: 'webp' | 'jpeg'): string {
  if (!sizes) return ''
  // Dedupe by URL: when a source image is smaller than a breakpoint and
  // withoutEnlargement is on, Payload returns the same file for that size,
  // which would otherwise show up as duplicate entries in the srcset.
  const seen = new Set<string>()
  const parts: string[] = []
  for (const name of BREAKPOINT_NAMES) {
    const size = sizes[`${name}_${format}`]
    if (size?.url && size.width && !seen.has(size.url)) {
      parts.push(`${size.url} ${size.width}w`)
      seen.add(size.url)
    }
  }
  return parts.join(', ')
}

function pickFallback(sizes: ResponsiveImageMedia['sizes']): string | null {
  if (!sizes) return null
  for (const name of [...BREAKPOINT_NAMES].reverse()) {
    const url = sizes[`${name}_jpeg`]?.url
    if (url) return url
  }
  return null
}

export function ResponsiveImage({
  media,
  sizes,
  className,
  loading = 'lazy',
  fetchPriority,
}: ResponsiveImageProps) {
  const alt = media.alt ?? ''
  const width = media.width ?? undefined
  const height = media.height ?? undefined

  const fallbackSrc = pickFallback(media.sizes) ?? media.url
  if (!fallbackSrc) return null

  const webpSrcSet = buildSrcSet(media.sizes, 'webp')
  const jpegSrcSet = buildSrcSet(media.sizes, 'jpeg')

  // Legacy uploads (pre-imageSizes) carry no derivatives. Render the original
  // so older media keeps working until it's re-uploaded.
  if (!webpSrcSet && !jpegSrcSet) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
      />
    )
  }

  return (
    <picture>
      {webpSrcSet ? <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} /> : null}
      <img
        src={fallbackSrc}
        srcSet={jpegSrcSet || undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
      />
    </picture>
  )
}

export default ResponsiveImage
