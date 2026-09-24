import { Section, type SectionBackground } from '../ui/Section'
import { VideoFacade, type VideoProvider } from '../ui/VideoFacade'

type Kind = 'video' | 'map' | 'page'
type Height = 'short' | 'medium' | 'tall'

interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface EmbedProps {
  kind?: Kind | null
  heading?: string | null
  eyebrow?: string | null
  title: string
  provider?: VideoProvider | null
  videoId?: string | null
  thumbnail?: MediaLike | string | number | null
  url?: string | null
  caption?: string | null
  height?: Height | null
  background?: SectionBackground | null
}

// A named step rather than a pixel count, so there is no number to cap. The
// old map and embed blocks defaulted to 400px and 600px.
const HEIGHT_CLASSES: Record<Height, string> = {
  short: 'h-80',
  medium: 'h-[30rem]',
  tall: 'h-[45rem]',
}

const OSM_HOSTS = new Set(['www.openstreetmap.org', 'openstreetmap.org'])
const GOOGLE_HOSTS = new Set(['www.google.com', 'google.com', 'maps.google.com'])

/** Maps: OpenStreetMap, or Google's embed endpoint only. */
const isAllowedMap = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    if (OSM_HOSTS.has(host)) return true
    // For google.com, only allow the embed endpoint. Bare `google.com/...`
    // would otherwise put arbitrary Google pages in the iframe.
    if (GOOGLE_HOSTS.has(host) && parsed.pathname.startsWith('/maps/embed')) return true
    return false
  } catch {
    return false
  }
}

/** Pages: any https address, framed in a sandbox. */
const isHttps = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

const isPoster = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function Embed({
  kind = 'video',
  heading,
  eyebrow,
  title,
  provider,
  videoId,
  thumbnail,
  url,
  caption,
  height = 'medium',
  background = 'none',
}: EmbedProps) {
  const inverse = background === 'inverse'
  const isVideo = kind !== 'map' && kind !== 'page'

  // Nothing to frame: a video with no ID, or a map or page with no address.
  if (isVideo ? !videoId : !url) return null

  const showEyebrow = isVideo && !!eyebrow
  const header =
    showEyebrow || heading ? (
      <div className="mb-6">
        {showEyebrow ? (
          // Green-700 is ~3:1 on the dark band; green-300 is the accent there.
          <p
            className={`text-eyebrow uppercase tracking-wide ${inverse ? 'text-brand-green-300' : 'text-accent-strong'}`}
          >
            {eyebrow}
          </p>
        ) : null}
        {heading ? (
          <h2 className={`${showEyebrow ? 'mt-2' : ''} text-h3 font-semibold`}>{heading}</h2>
        ) : null}
      </div>
    ) : null

  return (
    <Section padding="default" background={background ?? 'none'}>
      {header}
      {isVideo ? (
        <figure className="overflow-hidden rounded-md border border-border-subtle bg-surface-elevated shadow-sm">
          <VideoFacade
            provider={provider ?? 'youtube'}
            videoId={videoId as string}
            title={title}
            poster={isPoster(thumbnail) ? thumbnail : null}
          />
        </figure>
      ) : (
        <FramedPage
          kind={kind}
          url={url as string}
          title={title}
          caption={caption}
          heightCls={HEIGHT_CLASSES[height ?? 'medium']}
          captionCls={inverse ? 'text-neutral-200' : 'text-text-secondary'}
        />
      )}
    </Section>
  )
}

function FramedPage({
  kind,
  url,
  title,
  caption,
  heightCls,
  captionCls,
}: {
  kind: 'map' | 'page'
  url: string
  title: string
  caption?: string | null
  heightCls: string
  captionCls: string
}) {
  const allowed = kind === 'map' ? isAllowedMap(url) : isHttps(url)
  return (
    <figure>
      {/* A light surface behind the frame: the refusal notice below, and the
          frame while it loads, stay legible on any band. */}
      <div
        className={`overflow-hidden rounded-md border border-border-subtle bg-surface-elevated ${heightCls}`}
      >
        {!allowed ? (
          <p className="p-6 text-small text-text-muted">
            {kind === 'map'
              ? 'Map embed URL is not on the allow-list (openstreetmap.org or google.com).'
              : 'Embed URL must be https://.'}
          </p>
        ) : kind === 'map' ? (
          <iframe
            src={url}
            title={title}
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          // `allow-same-origin` is deliberately omitted: combined with
          // `allow-scripts` it would let the iframe reach window.parent.
          // Widgets that require same-origin must be moved into a per-host
          // allowlist with tightened CSP.
          <iframe
            src={url}
            title={title}
            className="h-full w-full"
            loading="lazy"
            sandbox="allow-scripts allow-forms allow-popups"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
      {caption ? (
        <figcaption className={`mt-3 text-small ${captionCls}`}>{caption}</figcaption>
      ) : null}
    </figure>
  )
}

export default Embed
