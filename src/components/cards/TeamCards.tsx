import Link from 'next/link'

import { ResponsiveImage } from '../ui/ResponsiveImage'
import { gridSizes } from '@/lib/layoutGeometry'
import { type CardKind, type GridProps, type MediaLike, hasKey, isMedia } from './types'

// Derived from the grid below rather than typed, so it follows the rail
// (`tests/int/lib/layoutGeometry.int.spec.ts` binds the two).
export const CARD_SIZES = gridSizes({
  columns: [
    [1024, 3],
    [640, 2],
    [0, 1],
  ],
})

export interface TeamMemberCard {
  id?: string | number
  name?: string | null
  slug?: string | null
  /** The job title ("CTO"). Cards show this, never `role`. */
  title?: string | null
  role?: string | null
  photo?: MediaLike | string | number | null
}

export const isTeamMemberDoc = hasKey<TeamMemberCard>('name')

export function TeamCards({ docs, headingLevel }: GridProps<TeamMemberCard>) {
  const CardHeading = headingLevel
  return (
    <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((m) => {
        const card = (
          <>
            {isMedia(m.photo) ? (
              // The photo IS the card — full-bleed 4:3 (the headshot sources are
              // landscape, so 4:3 crops kindly). ResponsiveImage serves the
              // per-breakpoint variants instead of the 2400px original.
              <ResponsiveImage
                media={{ ...m.photo, alt: m.photo.alt ?? m.name ?? '' }}
                sizes={CARD_SIZES}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : null}
            <div className="p-5">
              <CardHeading className="text-h4 font-semibold">{m.name}</CardHeading>
              {/* ROADMAP UI-1: cards show `title` (the job title), NOT `role`.
                  `role` is a full sentence and belongs to the `/team/[slug]`
                  header. Deliberately no `role` fallback. */}
              {m.title ? <p className="mt-1 text-small text-text-secondary">{m.title}</p> : null}
            </div>
          </>
        )
        // Card chrome lives on the <li>; the flex layout moves to the wrapping
        // <Link> so the whole card, photo included, is the click target.
        return (
          <li
            key={m.id ?? m.slug}
            className="group overflow-hidden rounded-md border border-border-subtle bg-surface-elevated text-center text-text-primary shadow-xs transition hover:border-border-strong hover:shadow-sm"
          >
            {m.slug ? (
              <Link href={`/team/${m.slug}`} className="flex h-full flex-col">
                {card}
              </Link>
            ) : (
              <div className="flex h-full flex-col">{card}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export const teamMemberKind: CardKind<TeamMemberCard> = {
  isDoc: isTeamMemberDoc,
  Grid: TeamCards,
  featured: (m) => ({
    title: m.name ?? '',
    subtitle: m.title,
    href: m.slug ? `/team/${m.slug}` : null,
    ctaLabel: m.name ? `Meet ${m.name}` : 'Read the profile',
    image: isMedia(m.photo) ? { ...m.photo, alt: m.photo.alt ?? m.name ?? '' } : null,
  }),
}
