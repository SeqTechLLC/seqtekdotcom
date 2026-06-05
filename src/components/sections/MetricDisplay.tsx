interface MetricDisplayProps {
  number: string
  label: string
  context?: string | null
  background?: 'accent' | 'inverse' | null
}

export function MetricDisplay({
  number,
  label,
  context,
  background = 'accent',
}: MetricDisplayProps) {
  const bgCls =
    background === 'inverse'
      ? 'bg-surface-inverse text-text-inverse'
      : 'bg-surface-accent text-text-primary'
  return (
    <section className={`px-4 py-16 md:px-6 lg:px-8 ${bgCls}`}>
      <div className="mx-auto max-w-container-md text-center">
        <p
          className={`text-display-xl font-bold ${
            background === 'inverse' ? 'text-accent' : 'text-accent-strong'
          }`}
        >
          {number}
        </p>
        <p className="mt-4 text-h3 font-semibold">{label}</p>
        {context ? <p className="mt-2 text-body">{context}</p> : null}
      </div>
    </section>
  )
}

export default MetricDisplay
