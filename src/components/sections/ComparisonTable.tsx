interface Column {
  id?: string | null
  label: string
  tagline?: string | null
}

interface RowCell {
  id?: string | null
  value: string
}

interface Row {
  id?: string | null
  dimension: string
  cells: RowCell[]
}

interface ComparisonTableProps {
  heading: string
  columns: Column[]
  rows: Row[]
  bestForRow?: RowCell[] | null
}

export function ComparisonTable({ heading, columns, rows, bestForRow }: ComparisonTableProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        <h2 className="text-h2 font-bold">{heading}</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-strong">
                <th className="px-3 py-3 text-caption uppercase tracking-wide text-text-muted">
                  &nbsp;
                </th>
                {columns.map((col, i) => (
                  <th key={col.id ?? i} className="px-3 py-3">
                    <div className="font-semibold">{col.label}</div>
                    {col.tagline ? (
                      <div className="text-small text-text-secondary">{col.tagline}</div>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id ?? i} className="border-b border-border-subtle">
                  <th
                    scope="row"
                    className="px-3 py-3 text-left text-caption uppercase tracking-wide text-text-muted"
                  >
                    {row.dimension}
                  </th>
                  {row.cells.map((cell, j) => (
                    <td key={cell.id ?? j} className="px-3 py-3 align-top text-body">
                      {cell.value}
                    </td>
                  ))}
                </tr>
              ))}
              {bestForRow && bestForRow.length > 0 ? (
                <tr className="bg-surface-accent">
                  <th
                    scope="row"
                    className="px-3 py-3 text-left text-caption uppercase tracking-wide text-accent-strong"
                  >
                    Best for
                  </th>
                  {bestForRow.map((cell, j) => (
                    <td key={cell.id ?? j} className="px-3 py-3 align-top font-semibold">
                      {cell.value}
                    </td>
                  ))}
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default ComparisonTable
