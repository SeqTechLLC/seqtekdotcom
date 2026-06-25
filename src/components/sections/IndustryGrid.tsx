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
          {docs.map((d) => {
            const card = <h3 className="text-h4 font-semibold">{d.title}</h3>
            return (
              <li
                key={d.id ?? d.slug}
                className="group rounded-md border border-border-subtle bg-surface text-center shadow-xs transition hover:border-border-strong hover:shadow-sm"
              >
                {d.slug ? (
                  <Link href={`/industries/${d.slug}`} className="block h-full p-5">
                    {card}
                  </Link>
                ) : (
                  <div className="p-5">{card}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default IndustryGrid
