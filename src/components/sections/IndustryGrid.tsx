import Link from 'next/link'

interface IndustryDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
}

interface IndustryGridProps {
  heading?: string | null
  industries?: Array<IndustryDoc | string | number> | null
}

const isDoc = (v: unknown): v is IndustryDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

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
              route ships with this change. A card only renders for a PUBLISHED
              industry, so a tag-only industry left as a draft never produces
              one — same lever the route and the sitemap use. */}
          {docs.map((d) => (
            <li key={d.id ?? d.slug}>
              {/* `<a>` is transparent content, so the heading belongs in flow
                  content inside the link, matching PartnerGrid. */}
              <Link
                href={`/industries/${d.slug}`}
                className="flex h-full flex-col rounded-md border border-border-subtle bg-surface p-5 text-center shadow-xs transition-colors hover:border-border"
              >
                <h3 className="text-h4 font-semibold">{d.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default IndustryGrid
