import Link from 'next/link'

interface CaseStudyDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  subtitle?: string | null
  heroImage?: { url?: string | null; alt?: string | null } | string | number | null
}

interface CaseStudyGridProps {
  heading?: string | null
  source: 'manual' | 'latest' | 'by-industry' | 'by-service'
  manualItems?: Array<CaseStudyDoc | string | number> | null
  limit?: number | null
  /** Card title level. Defaults to `h3`; listing pages with a page-level `h1`
   *  and no section heading pass `h2` to keep heading order non-skipping. */
  headingLevel?: 'h2' | 'h3'
}

const isDoc = (v: unknown): v is CaseStudyDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

const isMedia = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function CaseStudyGrid({
  heading,
  source,
  manualItems,
  limit = 3,
  headingLevel = 'h3',
}: CaseStudyGridProps) {
  // Non-manual sources resolve at template time (Phase 3). Showcase renders
  // the manual path; other sources show the affordance only.
  const docs = source === 'manual' ? (manualItems ?? []).filter(isDoc).slice(0, limit ?? 9) : []
  const CardHeading = headingLevel
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        {source !== 'manual' ? (
          <p className="mt-2 text-caption text-text-muted">
            Source: {source} (resolves at template time)
          </p>
        ) : null}
        {docs.length > 0 ? (
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <li
                key={d.id ?? d.slug}
                className="overflow-hidden rounded-md border border-border-subtle bg-surface shadow-xs"
              >
                {isMedia(d.heroImage) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.heroImage.url}
                    alt={d.heroImage.alt ?? d.title ?? ''}
                    className="h-40 w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  <CardHeading className="text-h4 font-semibold">
                    {d.slug ? <Link href={`/case-studies/${d.slug}`}>{d.title}</Link> : d.title}
                  </CardHeading>
                  {d.subtitle ? (
                    <p className="mt-2 text-body text-text-secondary">{d.subtitle}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export default CaseStudyGrid
