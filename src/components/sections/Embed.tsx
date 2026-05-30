interface EmbedProps {
  title: string
  url: string
  caption?: string | null
  height?: number | null
}

// Phase 3 will add an allow-list of providers (HubSpot, Calendly, ScoreApp,
// etc.) per INTEGRATIONS.md §8 (CSP). Showcase renders the affordance with
// a sandboxed iframe regardless of host.
export function Embed({ title, url, caption, height = 600 }: EmbedProps) {
  let valid = false
  try {
    valid = new URL(url).protocol === 'https:'
  } catch {
    valid = false
  }

  return (
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        <figure>
          <div
            className="overflow-hidden rounded-md border border-border-subtle"
            style={{ height: `${height ?? 600}px` }}
          >
            {valid ? (
              <iframe
                src={url}
                title={title}
                className="h-full w-full"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms"
                referrerPolicy="no-referrer"
              />
            ) : (
              <p className="p-6 text-small text-text-muted">Embed URL must be https://.</p>
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

export default Embed
