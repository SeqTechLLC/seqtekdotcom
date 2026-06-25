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
  /** Card title level. Defaults to `h3`; the pillar page (page-level `h1`, no
   *  section heading) passes `h2` to keep heading order non-skipping. */
  headingLevel?: 'h2' | 'h3'
}

const isDoc = (v: unknown): v is ServiceDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

export function ServiceCards({
  heading,
  source,
  manualItems,
  headingLevel = 'h3',
}: ServiceCardsProps) {
  const docs = source === 'manual' ? (manualItems ?? []).filter(isDoc) : []
  const CardHeading = headingLevel
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
            {docs.map((s) => {
              const card = (
                <>
                  {s.icon ? <p className="text-h3 text-accent-strong">{s.icon}</p> : null}
                  <CardHeading className="mt-2 text-h4 font-semibold">{s.title}</CardHeading>
                </>
              )
              return (
                <li
                  key={s.id ?? s.slug}
                  className="group rounded-md border border-border-subtle bg-surface shadow-xs transition hover:border-border-strong hover:shadow-sm"
                >
                  {s.slug ? (
                    <Link href={`/services/${s.slug}`} className="block h-full p-6">
                      {card}
                    </Link>
                  ) : (
                    <div className="p-6">{card}</div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export default ServiceCards
