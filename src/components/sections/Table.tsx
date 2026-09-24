import { cn } from '@/lib/cn'
import { ReadingColumn } from '../ui/ReadingColumn'
import { Section, type SectionBackground } from '../ui/Section'
import { toneFor } from '../ui/tone'

interface Column {
  id?: string | null
  label: string
  tagline?: string | null
}

interface Cell {
  id?: string | null
  value: string
}

interface Row {
  id?: string | null
  dimension: string
  cells?: Cell[] | null
}

interface TableProps {
  heading?: string | null
  intro?: string | null
  columns?: Column[] | null
  rows?: Row[] | null
  bestForRow?: Cell[] | null
  background?: SectionBackground | null
}

/**
 * Every cell keeps a floor width, so a table with more columns than the screen
 * holds scrolls sideways inside its frame instead of crushing each column to a
 * word per line.
 */
const CELL = 'min-w-[8rem] px-3 py-3 align-top'

/** Blank cells that square off a row with fewer answers than columns. */
const padding = (have: number, want: number): number[] =>
  Array.from({ length: Math.max(0, want - have) }, (_, i) => have + i)

/**
 * Replaces `comparison-table`. Any number of columns: the frame around the
 * table scrolls on its own axis, so however wide the table grows the page
 * itself never scrolls sideways. The frame is focusable so a keyboard user can
 * scroll it too.
 */
export function Table({ heading, intro, columns, rows, bestForRow, background }: TableProps) {
  const cols = columns ?? []
  const body = rows ?? []
  if (cols.length === 0 && body.length === 0) return null
  const tone = toneFor(background)
  const verdicts = bestForRow ?? []

  return (
    <Section padding="spacious" background={background ?? 'none'}>
      {heading || intro ? (
        // `flush`: the table fills the rail, so the heading keeps its left edge.
        <ReadingColumn flush>
          {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
          {intro ? (
            <p className={cn('text-body-lg', heading && 'mt-4', tone.secondary)}>{intro}</p>
          ) : null}
        </ReadingColumn>
      ) : null}
      <div
        role="region"
        aria-label={heading || 'Table'}
        tabIndex={0}
        className={cn('max-w-full overflow-x-auto', (heading || intro) && 'mt-8')}
      >
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className={cn('border-b', tone.ruleStrong)}>
              <td className={CELL} />
              {cols.map((col, i) => (
                <th key={col.id ?? i} scope="col" className={CELL}>
                  <div className="font-semibold">{col.label}</div>
                  {col.tagline ? (
                    <div className={cn('text-small font-normal', tone.secondary)}>
                      {col.tagline}
                    </div>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => {
              const cells = row.cells ?? []
              return (
                <tr key={row.id ?? i} className={cn('border-b', tone.rule)}>
                  <th
                    scope="row"
                    className={cn(CELL, 'text-caption uppercase tracking-wide', tone.muted)}
                  >
                    {row.dimension}
                  </th>
                  {cells.map((cell, j) => (
                    <td key={cell.id ?? j} className={cn(CELL, 'text-body')}>
                      {cell.value}
                    </td>
                  ))}
                  {padding(cells.length, cols.length).map((j) => (
                    <td key={`pad-${j}`} className={CELL} />
                  ))}
                </tr>
              )
            })}
            {verdicts.length > 0 ? (
              <tr className={tone.highlight}>
                <th
                  scope="row"
                  className={cn(CELL, 'text-caption uppercase tracking-wide', tone.accent)}
                >
                  Best for
                </th>
                {verdicts.map((cell, j) => (
                  <td key={cell.id ?? j} className={cn(CELL, 'font-semibold')}>
                    {cell.value}
                  </td>
                ))}
                {padding(verdicts.length, cols.length).map((j) => (
                  <td key={`pad-${j}`} className={CELL} />
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

export default Table
