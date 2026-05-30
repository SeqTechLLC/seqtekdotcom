import Link from 'next/link'

interface PillarDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  tagline?: string | null
}

interface ServicePillarCardsProps {
  heading?: string | null
  pillars?: Array<PillarDoc | string | number> | null
}

const isDoc = (v: unknown): v is PillarDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

export function ServicePillarCards({ heading, pillars }: ServicePillarCardsProps) {
  const docs = (pillars ?? []).filter(isDoc)
  if (docs.length === 0) return null
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {docs.map((p) => (
            <li
              key={p.id ?? p.slug}
              className="rounded-md border border-border-subtle bg-surface p-6 shadow-xs"
            >
              <h3 className="text-h3 font-semibold">
                {p.slug ? <Link href={`/services/${p.slug}`}>{p.title}</Link> : p.title}
              </h3>
              {p.tagline ? <p className="mt-3 text-body text-text-secondary">{p.tagline}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default ServicePillarCards
