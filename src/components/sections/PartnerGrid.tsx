import Link from 'next/link'

interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface PartnerDoc {
  id?: string | number
  name?: string | null
  slug?: string | null
  summary?: string | null
  logo?: MediaLike | string | number | null
}

interface PartnerGridProps {
  heading?: string | null
  items: PartnerDoc[]
  /** Card title level. Defaults to `h3`; a listing page with a page-level `h1`
   *  and no section heading passes `h2` to keep heading order non-skipping. */
  headingLevel?: 'h2' | 'h3'
}

const isFullMedia = (v: unknown): v is MediaLike & { url: string } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function PartnerGrid({ heading, items, headingLevel = 'h3' }: PartnerGridProps) {
  const CardHeading = headingLevel
  const docs = items.filter((p) => Boolean(p.slug))
  if (docs.length === 0) return null
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((p, i) => (
            <li key={p.id ?? p.slug ?? i}>
              {/* `<a>` is transparent content, so flow content (the card's
                  heading) belongs in a <div>, not a <span> (phrasing-only).
                  Focus ring comes from the global `:focus-visible` rule in
                  styles.css — no per-component outline utilities needed. */}
              <Link
                href={`/partners/${p.slug}`}
                className="flex h-full flex-col rounded-lg border border-border-subtle bg-surface transition-colors hover:border-border"
              >
                <div className="flex items-center justify-center border-b border-border-subtle px-6 py-10">
                  {isFullMedia(p.logo) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logo.url}
                      alt={p.logo.alt ?? p.name ?? ''}
                      className="h-14 w-auto object-contain md:h-16"
                    />
                  ) : (
                    <span className="text-h3 font-bold text-text-secondary">{p.name}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 px-6 py-6">
                  <CardHeading className="text-h4 font-bold">{p.name}</CardHeading>
                  {p.summary ? <p className="text-body text-text-secondary">{p.summary}</p> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default PartnerGrid
