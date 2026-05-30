import Link from 'next/link'

interface WorkshopDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  subtitle?: string | null
}

interface WorkshopListProps {
  heading?: string | null
  workshops?: Array<WorkshopDoc | string | number> | null
}

const isDoc = (v: unknown): v is WorkshopDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

export function WorkshopList({ heading, workshops }: WorkshopListProps) {
  const docs = (workshops ?? []).filter(isDoc)
  if (docs.length === 0) return null
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {docs.map((w, i) => (
            <li
              key={w.id ?? w.slug}
              className="rounded-md border border-border-subtle bg-surface p-6 shadow-xs"
            >
              <p className="text-display font-bold text-accent">{i + 1}</p>
              <h3 className="mt-2 text-h4 font-semibold">
                {w.slug ? <Link href={`/workshops/${w.slug}`}>{w.title}</Link> : w.title}
              </h3>
              {w.subtitle ? (
                <p className="mt-2 text-body text-text-secondary">{w.subtitle}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default WorkshopList
