import Link from 'next/link'

interface ServiceDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  icon?: string | null
}

interface ServiceCardsProps {
  heading?: string | null
  /** Authoring-time input consumed by `resolveLayout`, not read here — the
   *  component renders whatever items it is handed (ROADMAP UI-2). */
  source?: 'by-pillar' | 'manual'
  manualItems?: Array<ServiceDoc | string | number> | null
  /** Card title level. Left unset it follows `heading`: a section that renders
   *  an `h2` puts its cards at `h3`, a section with no heading puts them at
   *  `h2` — otherwise a group page (page-level `h1`, block heading left blank)
   *  jumps h1 -> h3 and fails the T016 heading-order check. An explicit value
   *  still wins, for a caller that knows what sits above it. */
  headingLevel?: 'h2' | 'h3'
}

const isDoc = (v: unknown): v is ServiceDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

export function ServiceCards({ heading, manualItems, headingLevel }: ServiceCardsProps) {
  const docs = (manualItems ?? []).filter(isDoc)
  // No section heading means no `h2` above the cards, so the cards ARE the
  // section's top level. Deriving this rather than defaulting to `h3` keeps the
  // block accessible whatever an editor leaves blank.
  const CardHeading = headingLevel ?? (heading ? 'h3' : 'h2')
  return (
    <section className="bg-surface-subtle px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        {docs.length > 0 ? (
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((s) => {
              const card = (
                <>
                  {s.icon ? <p className="text-h3 text-accent-strong">{s.icon}</p> : null}
                  <CardHeading className="mt-2 text-h4 font-semibold">{s.title}</CardHeading>
                </>
              )
              return (
                <li
                  key={s.id ?? s.slug}
                  className="group rounded-md border border-border-subtle bg-surface shadow-xs transition hover:border-border-strong hover:shadow-sm"
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
        ) : null}
      </div>
    </section>
  )
}

export default ServiceCards
