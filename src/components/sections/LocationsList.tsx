import { Section } from '../ui/Section'

interface LocationDoc {
  id?: string | number
  city?: string | null
  slug?: string | null
  /** ROADMAP INERT-2 — the renderer used to read a top-level `state`, which
   *  the `locations` collection does not have: it lives under `address`. That
   *  made the second line of every card a silently dead branch. */
  address?: { state?: string | null } | null
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
    <Section padding="spacious" background="subtle">
      <h2 className="text-h2 font-bold">{heading ?? 'Where we work'}</h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* ROADMAP SVC-2 — these cards used to link to `/locations/<slug>`,
              a route that has never been built, so every card was a 404. */}
        {docs.map((d) => (
          <li
            key={d.id ?? d.slug}
            className="rounded-md border border-border-subtle bg-surface p-6 text-center shadow-xs"
          >
            <h3 className="text-h4 font-semibold">{d.city}</h3>
            {d.address?.state ? (
              <p className="mt-1 text-small text-text-muted">{d.address.state}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  )
}

export default LocationsList
