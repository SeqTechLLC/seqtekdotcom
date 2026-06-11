import Link from 'next/link'

import { ResponsiveImage } from '../ui/ResponsiveImage'

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
  role?: string | null
  photo?: PhotoDoc | string | number | null
}

interface TeamGridProps {
  heading?: string | null
  filter: 'leadership-only' | 'featured' | 'all'
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
  filter,
  layout = 'cards',
  manualItems,
  headingLevel = 'h3',
}: TeamGridProps) {
  const docs = (manualItems ?? []).filter(isDoc)
  const CardHeading = headingLevel
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        {docs.length === 0 ? (
          <p className="mt-2 text-caption text-text-muted">
            Filter: {filter} (resolves at template time)
          </p>
        ) : (
          <ul
            className={`mt-8 grid gap-6 ${layout === 'compact' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}
          >
            {docs.map((m) => (
              <li
                key={m.id ?? m.slug}
                className={
                  layout === 'compact'
                    ? 'flex flex-col items-center rounded-md border border-border-subtle bg-surface p-5 text-center shadow-xs'
                    : 'flex flex-col overflow-hidden rounded-md border border-border-subtle bg-surface text-center shadow-xs'
                }
              >
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
                    {m.slug ? <Link href={`/team/${m.slug}`}>{m.name}</Link> : m.name}
                  </CardHeading>
                  {m.role ? <p className="mt-1 text-small text-text-secondary">{m.role}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default TeamGrid
