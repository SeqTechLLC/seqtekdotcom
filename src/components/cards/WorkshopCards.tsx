import Link from 'next/link'

import { type CardKind, type GridProps, hasKey } from './types'

export interface WorkshopCard {
  id?: string | number
  title?: string | null
  slug?: string | null
}

export const isWorkshopDoc = hasKey<WorkshopCard>('title')

/**
 * Numbered cards: the workshops read as a progression. `offset` keeps the
 * count running when the first one is drawn featured above the grid.
 */
export function WorkshopCards({ docs, headingLevel, offset = 0 }: GridProps<WorkshopCard>) {
  const CardHeading = headingLevel
  return (
    <ol className="mt-8 grid gap-6 md:grid-cols-3">
      {docs.map((w, i) => {
        const card = (
          <>
            <p className="text-display font-bold text-accent-strong">{offset + i + 1}</p>
            <CardHeading className="mt-2 text-h4 font-semibold">{w.title}</CardHeading>
          </>
        )
        return (
          <li
            key={w.id ?? w.slug}
            className="group rounded-md border border-border-subtle bg-surface text-text-primary shadow-xs transition hover:border-border-strong hover:shadow-sm"
          >
            {w.slug ? (
              <Link href={`/workshops/${w.slug}`} className="block h-full p-6">
                {card}
              </Link>
            ) : (
              <div className="p-6">{card}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export const workshopKind: CardKind<WorkshopCard> = {
  isDoc: isWorkshopDoc,
  Grid: WorkshopCards,
  featured: (w) => ({
    title: w.title ?? '',
    href: w.slug ? `/workshops/${w.slug}` : null,
    ctaLabel: 'See the workshop',
  }),
}
