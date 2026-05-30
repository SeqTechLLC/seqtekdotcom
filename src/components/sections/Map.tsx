interface MapProps {
  heading?: string | null
  embedUrl: string
  caption?: string | null
  height?: number | null
}

const ALLOWED_MAP_HOSTS = [
  'www.openstreetmap.org',
  'openstreetmap.org',
  'www.google.com',
  'google.com',
  'maps.google.com',
]

const isAllowed = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return ALLOWED_MAP_HOSTS.includes(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export function Map({ heading, embedUrl, caption, height = 400 }: MapProps) {
  return (
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h3 font-semibold">{heading}</h2> : null}
        <figure className="mt-6">
          <div
            className="overflow-hidden rounded-md border border-border-subtle"
            style={{ height: `${height ?? 400}px` }}
          >
            {isAllowed(embedUrl) ? (
              <iframe
                src={embedUrl}
                title={caption ?? heading ?? 'Map'}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <p className="p-6 text-small text-text-muted">
                Map embed URL is not on the allow-list (openstreetmap.org or google.com).
              </p>
            )}
          </div>
          {caption ? (
            <figcaption className="mt-3 text-small text-text-secondary">{caption}</figcaption>
          ) : null}
        </figure>
      </div>
    </section>
  )
}

export default Map
