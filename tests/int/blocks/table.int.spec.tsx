import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Table } from '../../../src/components/sections/Table'

/**
 * The `table` block replaces comparison-table, without its two-to-four column
 * cap: the frame around the table scrolls, never the page.
 */

const columns = (n: number) => Array.from({ length: n }, (_, i) => ({ label: `Col ${i}` }))
const row = (dimension: string, values: string[]) => ({
  dimension,
  cells: values.map((value) => ({ value })),
})

const BASE = {
  heading: 'Three ways to staff a team',
  columns: [
    { label: 'Option A', tagline: 'Same time zone' },
    { label: 'Option B' },
    { label: 'Option C' },
  ],
  rows: [row('Overlap', ['8h', '5h', '1h']), row('Ramp-up', ['1w', '3w', '6w'])],
  bestForRow: [{ value: 'Roadmap' }, { value: 'Features' }, { value: 'Maintenance' }],
}

describe('<Table />', () => {
  it('draws a column header per column and a row header per row', () => {
    const { getAllByRole } = render(<Table {...BASE} />)
    const headers = getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers).toEqual(['Option ASame time zone', 'Option B', 'Option C'])
    const rowHeaders = getAllByRole('rowheader').map((h) => h.textContent)
    expect(rowHeaders).toEqual(['Overlap', 'Ramp-up', 'Best for'])
  })

  it('handles any number of columns', () => {
    const { getAllByRole } = render(
      <Table
        columns={columns(9)}
        rows={[
          row(
            'Seats',
            Array.from({ length: 9 }, (_, i) => String(i)),
          ),
        ]}
      />,
    )
    expect(getAllByRole('columnheader')).toHaveLength(9)
  })

  it('scrolls wide tables inside a focusable, labelled frame rather than the page', () => {
    const { getByRole } = render(<Table {...BASE} />)
    const frame = getByRole('region', { name: BASE.heading })
    expect(frame.className).toMatch(/overflow-x-auto/)
    expect(frame.className).toMatch(/max-w-full/)
    expect(frame.getAttribute('tabindex')).toBe('0')
    expect(frame.querySelector('table')).toBeTruthy()
  })

  it('names the frame generically when there is no heading', () => {
    const { getByRole } = render(<Table {...BASE} heading={null} />)
    expect(getByRole('region', { name: 'Table' })).toBeTruthy()
  })

  it('squares off a short row with blank cells instead of misaligning it', () => {
    const { container } = render(
      <Table {...BASE} rows={[row('Short', ['only one'])]} bestForRow={[{ value: 'x' }]} />,
    )
    const trs = container.querySelectorAll('tbody tr')
    for (const tr of trs) expect(tr.children).toHaveLength(1 + BASE.columns.length)
  })

  it('leaves out the "Best for" row when there are no verdicts', () => {
    const { container } = render(<Table {...BASE} bestForRow={[]} />)
    expect(container.textContent).not.toContain('Best for')
  })

  it('draws the intro under the heading', () => {
    const { getByText } = render(<Table {...BASE} intro="Compared on the same terms." />)
    expect(getByText('Compared on the same terms.').previousElementSibling?.textContent).toBe(
      BASE.heading,
    )
  })

  it('keeps an empty corner cell out of the header semantics', () => {
    const { container } = render(<Table {...BASE} />)
    expect(container.querySelector('thead tr')?.firstElementChild?.tagName).toBe('TD')
  })

  it('swaps its muted text for light greys on the dark band', () => {
    const { getByRole } = render(<Table {...BASE} background="inverse" />)
    expect(getByRole('rowheader', { name: 'Overlap' }).className).toMatch(/text-neutral-300/)
  })
})
