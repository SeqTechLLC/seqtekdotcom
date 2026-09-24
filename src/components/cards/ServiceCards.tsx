import Link from 'next/link'

import { type CardKind, type GridProps, hasKey } from './types'

export interface ServiceCard {
  id?: string | number
  title?: string | null
  slug?: string | null
  /** `leaf` is a service; `group` gathers several (SVC-2). */
  tier?: 'leaf' | 'group' | 'axis' | null
  icon?: string | null
}

export const isServiceDoc = hasKey<ServiceCard>('title')

const isGroup = (s: ServiceCard): boolean => s.tier === 'group'

/**
 * Services and groups share a collection, and a list may hold either. A group
 * keeps the larger title-only card it had as a pillar card; a service keeps
 * its icon line and smaller title. Both link to `/services/<slug>`, the one
 * flat namespace the three tiers share.
 */
export function ServiceCards({ docs, headingLevel }: GridProps<ServiceCard>) {
  const CardHeading = headingLevel
  const allGroups = docs.every(isGroup)
  return (
    <ul
      className={`mt-8 grid gap-6 ${allGroups ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}
    >
      {docs.map((s) => {
        // ROADMAP INERT-2: a group's card used to read a `tagline` no group
        // has ever carried, so it has always been title-only.
        const card = isGroup(s) ? (
          <CardHeading className="text-h3 font-semibold">{s.title}</CardHeading>
        ) : (
          <>
            {s.icon ? <p className="text-h3 text-accent-strong">{s.icon}</p> : null}
            <CardHeading className="mt-2 text-h4 font-semibold">{s.title}</CardHeading>
          </>
        )
        return (
          <li
            key={s.id ?? s.slug}
            className="group rounded-md border border-border-subtle bg-surface text-text-primary shadow-xs transition hover:border-border-strong hover:shadow-sm"
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
  )
}

export const serviceKind: CardKind<ServiceCard> = {
  isDoc: isServiceDoc,
  Grid: ServiceCards,
  featured: (s) => ({
    title: s.title ?? '',
    href: s.slug ? `/services/${s.slug}` : null,
    ctaLabel: isGroup(s) ? 'See the services' : 'Explore the service',
  }),
}
