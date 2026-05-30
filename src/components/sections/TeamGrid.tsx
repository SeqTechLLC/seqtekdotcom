import Link from 'next/link'

interface TeamMemberDoc {
  id?: string | number
  name?: string | null
  slug?: string | null
  role?: string | null
  photo?: { url?: string | null; alt?: string | null } | string | number | null
}

interface TeamGridProps {
  heading?: string | null
  filter: 'leadership-only' | 'featured' | 'all'
  layout?: 'cards' | 'compact' | null
  manualItems?: Array<TeamMemberDoc | string | number> | null
}

const isDoc = (v: unknown): v is TeamMemberDoc =>
  typeof v === 'object' && v !== null && 'name' in (v as object)

const isMedia = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function TeamGrid({ heading, filter, layout = 'cards', manualItems }: TeamGridProps) {
  const docs = (manualItems ?? []).filter(isDoc)
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
                className="flex flex-col items-center rounded-md border border-border-subtle bg-surface p-5 text-center shadow-xs"
              >
                {isMedia(m.photo) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.photo.url}
                    alt={m.photo.alt ?? m.name ?? ''}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : null}
                <h3 className="mt-4 text-h4 font-semibold">
                  {m.slug ? <Link href={`/team/${m.slug}`}>{m.name}</Link> : m.name}
                </h3>
                {m.role ? <p className="mt-1 text-small text-text-secondary">{m.role}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default TeamGrid
