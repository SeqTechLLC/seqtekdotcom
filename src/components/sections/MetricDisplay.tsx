import { Section } from '../ui/Section'

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
    <Section padding="spacious" rail="md" className={bgCls} innerClassName="text-center">
      <p
        className={`text-display-xl font-bold ${
          background === 'inverse' ? 'text-accent' : 'text-accent-strong'
        }`}
      >
        {number}
      </p>
      <p className="mt-4 text-h3 font-semibold">{label}</p>
      {context ? <p className="mt-2 text-body">{context}</p> : null}
    </Section>
  )
}

export default MetricDisplay
