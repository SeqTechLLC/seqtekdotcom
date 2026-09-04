import Link from 'next/link'

interface IndustryDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  _status?: ('draft' | 'published') | null
}

interface IndustryGridProps {
  heading?: string | null
  industries?: Array<IndustryDoc | string | number> | null
}

const isDoc = (v: unknown): v is IndustryDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

// A populated relation is NOT guaranteed to be published, so the card cannot
// link on `isDoc` alone. On the Pages path the read is `findPublishedBySlug`
// (overrideAccess: false), so a draft comes back as a bare id and `isDoc`
// rejects it. On the HOMEPAGE path it does not: `getHomepage` calls
// `findGlobal` without `overrideAccess`, Payload's local API defaults it to
// true, and the relationship populates a full draft doc — whose URL
// `/industries/[slug]` 404s, because that route reads published-only.
//
// So a draft loses its LINK, not its card. Dropping the card entirely would
// also work, but it makes the block's output depend on a field
// (`_status`) that a caller may not have selected — and a grid that renders
// nothing looks identical to an inert control.
const isLinkable = (d: IndustryDoc): boolean => Boolean(d.slug) && d._status !== 'draft'

export function IndustryGrid({ heading, industries }: IndustryGridProps) {
  const docs = (industries ?? []).filter(isDoc)
  if (docs.length === 0) return null
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* ROADMAP IND-1 — re-linked. These were unlinked in #126 because
              `/industries/<slug>` did not exist and every card was a 404; the
              route ships with this change. `isPublished` above is what keeps
              that true: a tag-only industry left as a draft never produces a
              card, so the link can never point at a URL the route 404s. */}
          {docs.map((d) => (
            <li key={d.id ?? d.slug}>
              {/* `<a>` is transparent content, so the heading belongs in flow
                  content inside the link, matching PartnerGrid. */}
              {isLinkable(d) ? (
                <Link
                  href={`/industries/${d.slug}`}
                  className="flex h-full flex-col rounded-md border border-border-subtle bg-surface p-5 text-center shadow-xs transition-colors hover:border-border"
                >
                  <h3 className="text-h4 font-semibold">{d.title}</h3>
                </Link>
              ) : (
                <div className="flex h-full flex-col rounded-md border border-border-subtle bg-surface p-5 text-center shadow-xs">
                  <h3 className="text-h4 font-semibold">{d.title}</h3>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default IndustryGrid
