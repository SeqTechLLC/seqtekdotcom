import { Section } from '../ui/Section'
import type { ReactNode } from 'react'
import { ReadingColumn } from '../ui/ReadingColumn'

interface ValueItem {
  id?: string | null
  name: string
  description: string
}

interface MissionVisionValuesProps {
  mission: string
  vision: string
  values: ValueItem[]
  layout?: 'grid' | 'stacked' | null
}

/** The measure applies to `stacked` only, so the wrapper is conditional. */
function ValuesColumn({ stacked, children }: { stacked: boolean; children: ReactNode }) {
  return stacked ? <ReadingColumn>{children}</ReadingColumn> : <div>{children}</div>
}

export function MissionVisionValues({
  mission,
  vision,
  values,
  layout = 'grid',
}: MissionVisionValuesProps) {
  const valuesLayout = layout ?? 'grid'
  // 'grid' renders an editorial index (rule-separated, two columns) rather
  // than a card grid: seven values in a 3-col card grid strands an orphan on
  // the last row, and the rule treatment reads crafted instead of boxed.
  const valuesCls =
    valuesLayout === 'stacked' ? 'mt-8 space-y-4' : 'mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2'

  return (
    <Section padding="spacious" background="subtle" innerClassName="space-y-12">
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
      {/* Only `stacked` puts the descriptions on the undivided rail, so only it
          needs the measure; the default grid is already two columns. */}
      <ValuesColumn stacked={valuesLayout === 'stacked'}>
        <p className="text-caption uppercase tracking-wide text-accent-strong">Values</p>
        <ul className={valuesCls}>
          {values.map((v, i) => (
            <li key={v.id ?? i} className="border-t-2 border-accent pt-4">
              <h3 className="text-h4 font-semibold">{v.name}</h3>
              <p className="mt-2 text-body text-text-secondary">{v.description}</p>
            </li>
          ))}
        </ul>
      </ValuesColumn>
    </Section>
  )
}

export default MissionVisionValues
