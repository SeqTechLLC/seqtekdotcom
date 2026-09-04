import Link from 'next/link'

interface PillarDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
}

interface ServicePillarCardsProps {
  heading?: string | null
  pillars?: Array<PillarDoc | string | number> | null
  /** Card title level. Left unset it follows `heading`: a section that renders
   *  an `h2` puts its cards at `h3`, a section with no heading puts them at
   *  `h2`, so heading order never skips. An explicit value still wins. */
  headingLevel?: 'h2' | 'h3'
}

const isDoc = (v: unknown): v is PillarDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

export function ServicePillarCards({ heading, pillars, headingLevel }: ServicePillarCardsProps) {
  const docs = (pillars ?? []).filter(isDoc)
  if (docs.length === 0) return null
  // Same rule as `ServiceCards`: `headingField()` is optional, so a page whose
  // only h1 is a hero and whose block heading is blank would skip h1 -> h3.
  // With no section h2 above them, the cards ARE the section's top level.
  const CardHeading = headingLevel ?? (heading ? 'h3' : 'h2')
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-xl">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {docs.map((p) => {
            // ROADMAP INERT-2 — a second line used to read `p.tagline`, which
            // no group has ever carried. The branch never fired, so the card has
            // always been title-only. (Groups are `services` rows at
            // `tier: 'group'` since SVC-2; before that they were `servicePillars`,
            // whose one-liner was richText `description`.)
            const card = <CardHeading className="text-h3 font-semibold">{p.title}</CardHeading>
            return (
              <li
                key={p.id ?? p.slug}
                className="group rounded-md border border-border-subtle bg-surface shadow-xs transition hover:border-border-strong hover:shadow-sm"
              >
                {p.slug ? (
                  <Link href={`/services/${p.slug}`} className="block h-full p-6">
                    {card}
                  </Link>
                ) : (
                  <div className="p-6">{card}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default ServicePillarCards
