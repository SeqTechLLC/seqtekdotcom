interface ValueItem {
  id?: string | null
  name: string
  description: string
}

interface MissionVisionValuesProps {
  mission: string
  vision: string
  values: ValueItem[]
  layout?: 'tabs' | 'grid' | 'stacked' | null
}

export function MissionVisionValues({
  mission,
  vision,
  values,
  layout = 'grid',
}: MissionVisionValuesProps) {
  const valuesLayout = layout ?? 'grid'
  const valuesCls =
    valuesLayout === 'stacked' ? 'mt-8 space-y-4' : 'mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="bg-surface-subtle px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg space-y-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-caption uppercase tracking-wide text-accent-strong">Mission</p>
            <p className="mt-2 text-body-lg">{mission}</p>
          </div>
          <div>
            <p className="text-caption uppercase tracking-wide text-accent-strong">Vision</p>
            <p className="mt-2 text-body-lg">{vision}</p>
          </div>
        </div>
        <div>
          <p className="text-caption uppercase tracking-wide text-accent-strong">Values</p>
          <ul className={valuesCls}>
            {values.map((v, i) => (
              <li
                key={v.id ?? i}
                className="rounded-md border border-border-subtle bg-surface p-5 shadow-xs"
              >
                <h3 className="text-h4 font-semibold">{v.name}</h3>
                <p className="mt-2 text-body text-text-secondary">{v.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default MissionVisionValues
