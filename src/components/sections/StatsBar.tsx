interface StatItem {
  id?: string | null
  number: string
  label: string
  suffix?: string | null
}

interface StatsBarProps {
  heading?: string | null
  source: 'inline' | 'from-site-settings'
  items?: StatItem[] | null
}

export function StatsBar({ heading, source, items }: StatsBarProps) {
  // from-site-settings: Phase 3 will resolve via a server helper. For now,
  // render nothing rather than fabricate stats.
  const list = source === 'inline' ? (items ?? []) : []
  if (list.length === 0) return null
  return (
    <section className="bg-surface-inverse px-4 py-12 text-text-inverse md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h3 font-semibold">{heading}</h2> : null}
        <dl className="mt-6 grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
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
