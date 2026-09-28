import { type CardKind, type GridProps, hasKey } from './types'

export interface LocationCard {
  id?: string | number
  city?: string | null
  slug?: string | null
  /** The state lives under `address`; there is no top-level `state`. */
  address?: { state?: string | null } | null
}

export const isLocationDoc = hasKey<LocationCard>('city')

/**
 * Not links: no per-market route exists yet (ROADMAP SVC-2), so a card names
 * the place rather than sending anyone to a 404.
 */
export function LocationCards({ docs, headingLevel }: GridProps<LocationCard>) {
  const CardHeading = headingLevel
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {docs.map((d) => (
        <li
          key={d.id ?? d.slug}
          className="rounded-md border border-border-subtle bg-surface p-6 text-center text-text-primary shadow-xs"
        >
          <CardHeading className="text-h4 font-semibold">{d.city}</CardHeading>
          {d.address?.state ? (
            <p className="mt-1 text-small text-text-muted">{d.address.state}</p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export const locationKind: CardKind<LocationCard> = {
  isDoc: isLocationDoc,
  Grid: LocationCards,
  featured: (d) => ({ title: d.city ?? '', subtitle: d.address?.state }),
}
