import Link from 'next/link'

interface LocationDoc {
  id?: string | number
  city?: string | null
  slug?: string | null
  state?: string | null
}

interface LocationsListProps {
  heading?: string | null
  locations?: Array<LocationDoc | string | number> | null
}

const isDoc = (v: unknown): v is LocationDoc =>
  typeof v === 'object' && v !== null && 'city' in (v as object)

export function LocationsList({ heading, locations }: LocationsListProps) {
  const docs = (locations ?? []).filter(isDoc)
  if (docs.length === 0) return null
  return (
    <section className="bg-surface-subtle px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        <h2 className="text-h2 font-bold">{heading ?? 'Where we work'}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {docs.map((d) => {
            const card = (
              <>
                <h3 className="text-h4 font-semibold">{d.city}</h3>
                {d.state ? <p className="mt-1 text-small text-text-muted">{d.state}</p> : null}
              </>
            )
            return (
              <li
                key={d.id ?? d.slug}
                className="group rounded-md border border-border-subtle bg-surface text-center shadow-xs transition hover:border-border-strong hover:shadow-sm"
              >
                {d.slug ? (
                  <Link href={`/locations/${d.slug}`} className="block h-full p-6">
                    {card}
                  </Link>
                ) : (
                  <div className="p-6">{card}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default LocationsList
