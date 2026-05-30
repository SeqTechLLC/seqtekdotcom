interface TimelineItem {
  id?: string | null
  date: string
  title: string
  body: string
  image?: { url?: string | null; alt?: string | null } | string | number | null
}

interface TimelineProps {
  heading?: string | null
  items: TimelineItem[]
}

const hasUrl = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function Timeline({ heading, items }: TimelineProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ol className="mt-8 space-y-8 border-l-2 border-border-strong pl-6">
          {items.map((item, i) => (
            <li key={item.id ?? i} className="relative">
              <span className="absolute -left-[1.875rem] top-1.5 h-3 w-3 rounded-full bg-accent" />
              <p className="text-caption uppercase tracking-wide text-text-muted">{item.date}</p>
              <h3 className="mt-1 text-h4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-body text-text-secondary">{item.body}</p>
              {hasUrl(item.image) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image.url}
                  alt={item.image.alt ?? ''}
                  className="mt-3 w-full max-w-md rounded-md"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default Timeline
