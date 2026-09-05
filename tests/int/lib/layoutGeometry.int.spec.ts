import { describe, expect, it } from 'vitest'

import {
  boxAt,
  boxSizes,
  cellWidth,
  GAP,
  gridSizes,
  MEDIA_LADDER,
  paddingAt,
  railCrossover,
  RAIL,
  type ColumnStep,
  type RailSize,
} from '@/lib/layoutGeometry'

/**
 * These tests exist because six review rounds could not catch a stale `sizes`
 * string by reading it. `Gallery` shipped one string for a 2-, 3- and 4-column
 * grid, and `TeamGrid` still ships one for a 3- and a 4-column layout; in both
 * the widest case the browser picked a derivative one rung too small and
 * upscaled. Reading the string tells you nothing — you have to resolve it at a
 * viewport, multiply by DPR, and compare against the ladder. So that is what
 * the suite does, rather than asserting on string equality.
 */

/** Resolve a `sizes` attribute the way a browser would: first match wins. */
function resolveSizes(sizes: string, viewport: number): number {
  for (const arm of sizes.split(', ')) {
    const m = arm.match(/^\(min-width:\s*(\d+)px\)\s*(.+)$/)
    const [condition, value] = m ? [Number(m[1]), m[2]] : [0, arm]
    if (viewport < condition) continue
    return evaluateLength(value, viewport)
  }
  throw new Error(`no arm matched ${viewport}px in "${sizes}"`)
}

function evaluateLength(value: string, viewport: number): number {
  const px = value.match(/^([\d.]+)px$/)
  if (px) return Number(px[1])
  const divided = value.match(/^calc\(\(100vw - ([\d.]+)px\)\s*\/\s*([\d.]+)\)$/)
  if (divided) return (viewport - Number(divided[1])) / Number(divided[2])
  const scaled = value.match(/^calc\(\(100vw - ([\d.]+)px\)\s*\*\s*([\d.]+)\)$/)
  if (scaled) return (viewport - Number(scaled[1])) * Number(scaled[2])
  const plain = value.match(/^calc\(100vw - ([\d.]+)px\)$/)
  if (plain) return viewport - Number(plain[1])
  throw new Error(`unparsed length: ${value}`)
}

/** Smallest derivative that covers `needed` device px; the largest if none do. */
function rungFor(needed: number): number {
  return MEDIA_LADDER.find((w) => w >= needed) ?? MEDIA_LADDER[MEDIA_LADDER.length - 1]
}

const VIEWPORTS = [360, 390, 414, 639, 640, 767, 768, 900, 1023, 1024, 1280, 1343, 1344, 1440, 1920]
const DPRS = [1, 2]

/** The invariant: a derived string never selects a rung other than the one the real cell needs. */
function expectNoRungDrift(
  sizes: string,
  geometry: { rail?: RailSize; columns: ReadonlyArray<ColumnStep>; gap?: keyof typeof GAP },
) {
  const { rail = 'xl', columns, gap = 6 } = geometry
  const columnsAt = (vw: number) => {
    for (const [min, n] of columns) if (vw >= min) return n
    return columns[columns.length - 1][1]
  }
  for (const vw of VIEWPORTS) {
    const actual = cellWidth(boxAt(vw, rail), columnsAt(vw), GAP[gap])
    for (const dpr of DPRS) {
      const declared = resolveSizes(sizes, vw)
      expect(
        rungFor(declared * dpr),
        `${vw}px @${dpr}x: declared ${declared.toFixed(1)}px for a ${actual.toFixed(1)}px cell`,
      ).toBe(rungFor(actual * dpr))
    }
  }
}

describe('layout geometry — the shell, written down once', () => {
  it('padding matches the px-4 / md:px-6 / lg:px-8 the blocks share', () => {
    expect(paddingAt(390)).toBe(32)
    expect(paddingAt(767)).toBe(32)
    expect(paddingAt(768)).toBe(48)
    expect(paddingAt(1023)).toBe(48)
    expect(paddingAt(1024)).toBe(64)
  })

  it('the box is viewport-bound below the rail and capped above it', () => {
    expect(boxAt(390)).toBe(358)
    expect(boxAt(1024)).toBe(960)
    expect(boxAt(1344)).toBe(RAIL.xl)
    expect(boxAt(1920)).toBe(RAIL.xl)
  })

  it('the rail crossover is where 100vw - padding reaches the cap', () => {
    expect(railCrossover('xl')).toBe(1344)
    expect(railCrossover('lg')).toBe(1088)
    expect(boxAt(railCrossover('xl') - 1)).toBeLessThan(RAIL.xl)
    expect(boxAt(railCrossover('xl'))).toBe(RAIL.xl)
  })
})

describe('gridSizes — no rung drift at any viewport or DPR', () => {
  // The exact configurations that shipped a defect.
  const CASES: Record<string, { columns: ColumnStep[]; gap?: keyof typeof GAP }> = {
    'Gallery columns=2 (sm:grid-cols-2, no lg override)': {
      columns: [
        [640, 2],
        [0, 1],
      ],
    },
    'Gallery columns=3 (sm:grid-cols-2 lg:grid-cols-3)': {
      columns: [
        [1024, 3],
        [640, 2],
        [0, 1],
      ],
    },
    'Gallery columns=4 (sm:grid-cols-2 lg:grid-cols-4)': {
      columns: [
        [1024, 4],
        [640, 2],
        [0, 1],
      ],
    },
    'TeamGrid default (sm:grid-cols-2 lg:grid-cols-3)': {
      columns: [
        [1024, 3],
        [640, 2],
        [0, 1],
      ],
    },
    'TeamGrid compact (sm:grid-cols-2 lg:grid-cols-4)': {
      columns: [
        [1024, 4],
        [640, 2],
        [0, 1],
      ],
    },
    'CaseStudyGrid (md:grid-cols-2 lg:grid-cols-3)': {
      columns: [
        [1024, 3],
        [768, 2],
        [0, 1],
      ],
    },
    'two-column split (lg:grid-cols-2, gap-10)': {
      columns: [
        [1024, 2],
        [0, 1],
      ],
      gap: 10,
    },
  }

  for (const [name, geometry] of Object.entries(CASES)) {
    it(name, () => {
      expectNoRungDrift(gridSizes(geometry), geometry)
    })
  }

  it('distinguishes column counts a single hand-written string used to share', () => {
    // The Gallery/TeamGrid defect in one assertion: 2-up and 4-up cannot be
    // served by the same string, because their cells differ by more than a rung.
    const two = gridSizes({
      columns: [
        [640, 2],
        [0, 1],
      ],
    })
    const four = gridSizes({
      columns: [
        [1024, 4],
        [640, 2],
        [0, 1],
      ],
    })
    expect(two).not.toBe(four)
    expect(rungFor(resolveSizes(two, 1440) * 2)).toBe(1600)
    expect(rungFor(resolveSizes(four, 1440) * 2)).toBe(640)
  })
})

describe('boxSizes — single elements that fill or cap the rail', () => {
  it('the Image block width variants each land on their own rung', () => {
    for (const cap of [672, 768, 1024, RAIL.xl]) {
      const sizes = boxSizes({ cap })
      for (const vw of VIEWPORTS) {
        const actual = Math.min(cap, boxAt(vw))
        for (const dpr of DPRS) {
          expect(rungFor(resolveSizes(sizes, vw) * dpr), `cap ${cap} at ${vw}px @${dpr}x`).toBe(
            rungFor(actual * dpr),
          )
        }
      }
    }
  })

  it('a half-rail media column declares half, not the whole rail', () => {
    const half = boxSizes({ fraction: 0.5 })
    expect(resolveSizes(half, 1440)).toBeCloseTo(640, 0)
    expect(resolveSizes(half, 390)).toBeCloseTo(179, 0)
  })
})

describe('regression witnesses — the strings that shipped', () => {
  /**
   * Proof the guard above has teeth. These are the literal `sizes` values that
   * were in the tree, checked against the cells they actually served. If a
   * future change makes these pass, the check has gone slack.
   */
  const SHIPPED = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'

  const resolveVw = (sizes: string, viewport: number): number => {
    for (const arm of sizes.split(', ')) {
      const m = arm.match(/^\(min-width:\s*(\d+)px\)\s*(.+)$/)
      const [condition, value] = m ? [Number(m[1]), m[2]] : [0, arm]
      if (viewport < condition) continue
      const vw = value.match(/^([\d.]+)vw$/)
      if (!vw) throw new Error(`unparsed: ${value}`)
      return (viewport * Number(vw[1])) / 100
    }
    throw new Error('no arm matched')
  }

  it('under-served the 2-up gallery it was applied to (picked 1024w for a 1256px cell)', () => {
    const cell = cellWidth(boxAt(1440), 2, GAP[6])
    expect(cell).toBeCloseTo(628, 0)
    expect(rungFor(cell * 2)).toBe(1600)
    expect(rungFor(resolveVw(SHIPPED, 1440) * 2)).toBe(1024)
  })

  it('over-served the 4-up team grid it was applied to (picked 1024w for a 604px need)', () => {
    const cell = cellWidth(boxAt(1440), 4, GAP[6])
    expect(cell).toBeCloseTo(302, 0)
    expect(rungFor(cell * 2)).toBe(640)
    expect(rungFor(resolveVw(SHIPPED, 1440) * 2)).toBe(1024)
  })

  it('the derived strings get both right', () => {
    const two = gridSizes({
      columns: [
        [640, 2],
        [0, 1],
      ],
    })
    const four = gridSizes({
      columns: [
        [1024, 4],
        [640, 2],
        [0, 1],
      ],
    })
    expect(rungFor(resolveSizes(two, 1440) * 2)).toBe(1600)
    expect(rungFor(resolveSizes(four, 1440) * 2)).toBe(640)
  })
})
