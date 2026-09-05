interface StatItem {
  id?: string | null
  number: string
  label: string
  suffix?: string | null
}

interface StatsBarProps {
  heading?: string | null
  items?: StatItem[] | null
}

export function StatsBar({ heading, items }: StatsBarProps) {
  // spec 011: the `source` discriminator is gone with the siteSettings global
  // it pointed at (ADR 0010). Stats are always inline.
  const list = items ?? []
  if (list.length === 0) return null
  // Column count follows the item count: a fixed 5-column grid with three
  // stats clusters them left and leaves dead columns on the right.
  // Literal class strings — Tailwind JIT can't see computed names.
  const colsCls =
    {
      1: 'sm:grid-cols-1',
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-4',
      5: 'sm:grid-cols-3 lg:grid-cols-5',
    }[Math.min(list.length, 5)] ?? 'sm:grid-cols-3 lg:grid-cols-5'
  return (
    <section className="bg-surface-inverse px-4 py-12 text-text-inverse md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-xl">
        {heading ? <h2 className="text-h3 font-semibold">{heading}</h2> : null}
        <dl className={`mt-6 grid gap-8 ${colsCls}`}>
          {list.map((item, i) => (
            <div key={item.id ?? i}>
              <dt className="text-display font-bold text-accent">
                {item.number}
                {item.suffix ? <span className="text-h2">{item.suffix}</span> : null}
              </dt>
              <dd className="mt-1 text-small uppercase tracking-wide text-text-inverse/80">
                {item.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default StatsBar
