import Link from 'next/link'

import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section } from '../ui/Section'

interface PhotoDoc {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Record<string, { url?: string | null; width?: number | null } | null | undefined> | null
}

interface TeamMemberDoc {
  id?: string | number
  name?: string | null
  slug?: string | null
  /** The job title ("CTO"). Cards show this — see the `title` vs `role` note
   *  on the render below. */
  title?: string | null
  role?: string | null
  photo?: PhotoDoc | string | number | null
}

interface TeamGridProps {
  heading?: string | null
  /** Authoring-time input consumed by `resolveLayout`, not read here — the
   *  component renders whatever members it is handed (ROADMAP UI-2). */
  filter?: 'leadership-only' | 'all'
  layout?: 'cards' | 'compact' | null
  manualItems?: Array<TeamMemberDoc | string | number> | null
  /** Card title level. Defaults to `h3`; listing pages with a page-level `h1`
   *  and no section heading pass `h2` to keep heading order non-skipping. */
  headingLevel?: 'h2' | 'h3'
}

const isDoc = (v: unknown): v is TeamMemberDoc =>
  typeof v === 'object' && v !== null && 'name' in (v as object)

const isMedia = (v: unknown): v is PhotoDoc & { url: string } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function TeamGrid({
  heading,
  layout = 'cards',
  manualItems,
  headingLevel = 'h3',
}: TeamGridProps) {
  const docs = (manualItems ?? []).filter(isDoc)
  const CardHeading = headingLevel
  return (
    <Section padding="spacious">
      {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
      {docs.length === 0 ? null : (
        <ul
          className={`mt-8 grid gap-6 ${layout === 'compact' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}
        >
          {docs.map((m) => {
            const card = (
              <>
                {isMedia(m.photo) ? (
                  layout === 'compact' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photo.url}
                      alt={m.photo.alt ?? m.name ?? ''}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    // Cards: the photo IS the card — full-bleed 4:3 (the
                    // headshot sources are landscape, so 4:3 crops kindly).
                    // ResponsiveImage serves the per-breakpoint variants
                    // instead of the 2400px original.
                    <ResponsiveImage
                      media={{ ...m.photo, alt: m.photo.alt ?? m.name ?? '' }}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )
                ) : null}
                <div className={layout === 'compact' ? '' : 'p-5'}>
                  <CardHeading
                    className={`text-h4 font-semibold ${layout === 'compact' ? 'mt-4' : ''}`}
                  >
                    {m.name}
                  </CardHeading>
                  {/* ROADMAP UI-1: cards show `title` (the job title), NOT
                        `role`. `role` is a full descriptive sentence and reads
                        as prose in a card; it belongs to the `/team/[slug]`
                        detail header, which renders both. Deliberately no
                        `role` fallback — a card with no job title shows the
                        name alone rather than a paragraph. */}
                  {m.title ? (
                    <p className="mt-1 text-small text-text-secondary">{m.title}</p>
                  ) : null}
                </div>
              </>
            )
            // Card chrome lives on the <li>; the flex layout + padding move to
            // the wrapping <Link> so the whole card (photo included) is the
            // click target — the proven PostList/CaseStudyGrid idiom.
            const chrome =
              layout === 'compact'
                ? 'group rounded-md border border-border-subtle bg-surface-elevated text-center shadow-xs transition hover:border-border-strong hover:shadow-sm'
                : 'group overflow-hidden rounded-md border border-border-subtle bg-surface-elevated text-center shadow-xs transition hover:border-border-strong hover:shadow-sm'
            const inner =
              layout === 'compact'
                ? 'flex h-full flex-col items-center p-5'
                : 'flex h-full flex-col'
            return (
              <li key={m.id ?? m.slug} className={chrome}>
                {m.slug ? (
                  <Link href={`/team/${m.slug}`} className={inner}>
                    {card}
                  </Link>
                ) : (
                  <div className={inner}>{card}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

export default TeamGrid
