interface MapProps {
  heading?: string | null
  embedUrl: string
  caption?: string | null
  height?: number | null
}

const OSM_HOSTS = new Set(['www.openstreetmap.org', 'openstreetmap.org'])
const GOOGLE_HOSTS = new Set(['www.google.com', 'google.com', 'maps.google.com'])

const isAllowed = (url: string): boolean => {
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
                referrerPolicy="strict-origin-when-cross-origin"
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
