import Link from 'next/link'

interface ServiceDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  icon?: string | null
}

interface ServiceCardsProps {
  heading?: string | null
  source: 'by-pillar' | 'manual'
  manualItems?: Array<ServiceDoc | string | number> | null
}

const isDoc = (v: unknown): v is ServiceDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

export function ServiceCards({ heading, source, manualItems }: ServiceCardsProps) {
  const docs = source === 'manual' ? (manualItems ?? []).filter(isDoc) : []
  return (
    <section className="bg-surface-subtle px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        {source !== 'manual' ? (
          <p className="mt-2 text-caption text-text-muted">
            Source: {source} (resolves at template time)
          </p>
        ) : null}
        {docs.length > 0 ? (
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((s) => (
              <li
                key={s.id ?? s.slug}
                className="rounded-md border border-border-subtle bg-surface p-6 shadow-xs"
              >
                {s.icon ? <p className="text-h3 text-accent">{s.icon}</p> : null}
                <h3 className="mt-2 text-h4 font-semibold">
                  {s.slug ? <Link href={`/services/${s.slug}`}>{s.title}</Link> : s.title}
                </h3>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export default ServiceCards
