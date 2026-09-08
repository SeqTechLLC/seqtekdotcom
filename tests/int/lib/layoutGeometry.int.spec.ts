import { readFileSync } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { CAROUSEL_SIZES, GRID_SIZES } from '@/components/sections/Gallery'
import { SIZES as IMAGE_SIZES } from '@/components/sections/Image'
import { CARD_SIZES } from '@/components/sections/TeamGrid'

import {
  boxAt,
  boxSizes,
  cellWidth,
  GAP,
  gridSizes,
  MEDIA_LADDER,
  PADDING_STEPS,
  paddingAt,
  railCrossover,
  RAIL,
  SHELL_RAIL,
  SPLIT_MEDIA_SIZES,
  type ColumnStep,
  type RailSize,
} from '@/lib/layoutGeometry'

/**
 * These tests exist because six review rounds could not catch a stale `sizes`
 * string by reading it. `Gallery` shipped one string for a 2-, 3- and 4-column
 * grid; at the widest case the browser picked a derivative one rung too small
 * and upscaled. `TeamGrid` used the SAME string and was never defective, for a
 * reason invisible at either call site — see the witness below. That is the
 * argument for deriving these rather than reviewing them.
 *
 * Reading a `sizes` string tells you nothing: you have to resolve it at a
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
  const { rail = SHELL_RAIL, columns, gap = 6 } = geometry
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
    // Expressed against SHELL_RAIL, not a hard-coded `xl`. ADR 0012 claims
    // moving the shell is one line; that is only true if the module's own
    // assertions move with it, so nothing here names a rail the shell might
    // not be on.
    expect(boxAt(390)).toBe(358)
    expect(boxAt(1024)).toBe(960)
    expect(boxAt(railCrossover())).toBe(RAIL[SHELL_RAIL])
    expect(boxAt(RAIL[SHELL_RAIL] + 640)).toBe(RAIL[SHELL_RAIL])
  })

  it('the rail crossover is where 100vw - padding reaches the cap', () => {
    // Checked for every rail, so the set stays correct whichever one is current.
    expect(railCrossover('xl')).toBe(1344)
    expect(railCrossover('lg')).toBe(1088)
    expect(railCrossover('md')).toBe(816)
    expect(boxAt(railCrossover() - 1)).toBeLessThan(RAIL[SHELL_RAIL])
    expect(boxAt(railCrossover())).toBe(RAIL[SHELL_RAIL])
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
    // Pinned to `xl` on purpose: this documents the configuration the defect
    // shipped in, so it must NOT drift with SHELL_RAIL.
    // The Gallery/TeamGrid defect in one assertion: 2-up and 4-up cannot be
    // served by the same string, because their cells differ by more than a rung.
    const two = gridSizes({
      rail: 'xl',
      columns: [
        [640, 2],
        [0, 1],
      ],
    })
    const four = gridSizes({
      rail: 'xl',
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
    const cell = cellWidth(boxAt(1440, 'xl'), 2, GAP[6])
    expect(cell).toBeCloseTo(628, 0)
    expect(rungFor(cell * 2)).toBe(1600)
    expect(rungFor(resolveVw(SHIPPED, 1440) * 2)).toBe(1024)
  })

  it('was, by luck, correct for the 3-up grid — which is why it survived review', () => {
    // TeamGrid used the same string and was NEVER defective: its `compact`
    // layout renders a fixed 96px avatar rather than a ResponsiveImage, so the
    // string only ever served the 3-up `cards` grid, where it over-declares but
    // still lands on the same rung. Recorded because a string being right in one
    // block and wrong in another, for reasons invisible at either call site, is
    // the whole argument for deriving it.
    const cell = cellWidth(boxAt(1440, 'xl'), 3, GAP[6])
    expect(rungFor(cell * 2)).toBe(rungFor(resolveVw(SHIPPED, 1440) * 2))
  })

  it('the derived string gets the 2-up case the shipped one missed', () => {
    const two = gridSizes({
      rail: 'xl',
      columns: [
        [640, 2],
        [0, 1],
      ],
    })
    expect(rungFor(resolveSizes(two, 1440) * 2)).toBe(1600)
  })
})

describe('the mirrored constants match their sources', () => {
  const source = (p: string) => readFileSync(path.resolve(p), 'utf8')

  it('RAIL matches tailwind.config.mjs maxWidth.container-*', () => {
    const config = source('tailwind.config.mjs')
    for (const [name, width] of Object.entries(RAIL)) {
      expect(config, `container-${name}`).toContain(`'container-${name}': '${width}px'`)
    }
  })

  it('MEDIA_LADDER matches the Media collection BREAKPOINTS', () => {
    const media = source('src/collections/Media.ts')
    const widths = [...media.matchAll(/\{\s*name:\s*'[a-z]+',\s*width:\s*(\d+)\s*\}/g)].map((m) =>
      Number(m[1]),
    )
    expect(widths.length).toBeGreaterThan(0)
    expect([...widths].sort((a, b) => a - b)).toEqual([...MEDIA_LADDER])
  })

  it('PADDING_STEPS matches the padding Section actually renders', () => {
    // Section writes the triple as a literal because Tailwind must see it, so
    // the binding has to be an assertion rather than a shared constant.
    const section = source('src/components/ui/Section.tsx')
    expect(section).toContain("'px-4 md:px-6 lg:px-8'")
    expect(PADDING_STEPS.map(([min, pad]) => `${min}:${pad}`)).toEqual([
      '1024:64',
      '768:48',
      '0:32',
    ])
  })
})

/**
 * The binding the last two rounds kept claiming and not having.
 *
 * The suite at the top proves `gridSizes(X)` is correct FOR X. That is not the
 * same as proving a block passes the right X, and an earlier version of this
 * file re-typed each block's arguments in the test — so reverting the real
 * regression into `Hero.tsx` left all 163 assertions green. A test that cannot
 * fail for the defect it was written for is worse than no test, because the
 * comment above it tells the next reader to stop checking by hand.
 *
 * Three bindings. Stated precisely, because this docblock overclaimed in three
 * consecutive review rounds and the reviewer disproved it twice by injection:
 *
 *  1. `sizes` is imported — from the BLOCK module for `GRID_SIZES`,
 *     `CAROUSEL_SIZES`, `CARD_SIZES` and `IMAGE_SIZES`, but from
 *     `@/lib/layoutGeometry` for `SPLIT_MEDIA_SIZES`, which four blocks share.
 *     So for that one site this binding alone proves only that the LIBRARY
 *     constant is self-consistent.
 *  2. the grid classes are read out of the component's source, so changing the
 *     layout without changing the geometry fails here.
 *  3. the whole `sizes={...}` EXPRESSION is pinned in each component's source —
 *     and for the split-media site this is what actually holds the line, since
 *     a bare token check survived swapping the value out from under it (an
 *     unused import is only a warning, and `npm run lint` sets no
 *     `--max-warnings`).
 *
 * Both injections the reviewer used now fail: swapping `sizes={SPLIT_MEDIA_SIZES}`
 * in `Hero.tsx`, and changing `TwoColumn`'s `lg:grid-cols-2` to `md:grid-cols-2`.
 */
describe('call-site geometry — bound to the components, not re-typed', () => {
  const source = (p: string) => readFileSync(path.resolve(p), 'utf8')

  const CALL_SITES: Array<{
    name: string
    file: string
    /** Must appear verbatim in `file` — this is binding (2). */
    classes: string
    /** The whole `sizes={...}` expression, pinned so swapping the value fails. */
    expression: string
    /** Extra files that must carry the same expression and classes. */
    alsoIn?: string[]
    /** Imported from the component — this is binding (1). */
    sizes: string
    cell: (viewport: number) => number
  }> = [
    {
      name: 'split media column (Hero, CaseStudyHero, TwoColumn, ServicePillarHero)',
      file: 'src/components/sections/Hero.tsx',
      classes: 'grid gap-10 lg:grid-cols-2 lg:items-center',
      expression: 'sizes={SPLIT_MEDIA_SIZES}',
      alsoIn: [
        'src/components/sections/CaseStudyHero.tsx',
        'src/components/sections/TwoColumn.tsx',
        'src/components/sections/ServicePillarHero.tsx',
      ],
      sizes: SPLIT_MEDIA_SIZES,
      cell: (vw) => (vw >= 1024 ? cellWidth(boxAt(vw), 2, GAP[10]) : boxAt(vw)),
    },
    {
      name: 'gallery carousel slide',
      expression: 'sizes={CAROUSEL_SIZES}',
      file: 'src/components/sections/Gallery.tsx',
      classes: 'min-w-[80%] shrink-0 snap-start sm:min-w-[48%] lg:min-w-[32%]',
      sizes: CAROUSEL_SIZES,
      cell: (vw) => boxAt(vw) * (vw >= 1024 ? 0.32 : vw >= 640 ? 0.48 : 0.8),
    },
    {
      name: 'gallery grid, 2 columns',
      expression: "sizes={GRID_SIZES[columns ?? '3']}",
      file: 'src/components/sections/Gallery.tsx',
      classes: "'2': 'sm:grid-cols-2'",
      sizes: GRID_SIZES['2'],
      cell: (vw) => cellWidth(boxAt(vw), vw >= 640 ? 2 : 1, GAP[6]),
    },
    {
      name: 'gallery grid, 3 columns',
      expression: "sizes={GRID_SIZES[columns ?? '3']}",
      file: 'src/components/sections/Gallery.tsx',
      classes: "'3': 'sm:grid-cols-2 lg:grid-cols-3'",
      sizes: GRID_SIZES['3'],
      cell: (vw) => cellWidth(boxAt(vw), vw >= 1024 ? 3 : vw >= 640 ? 2 : 1, GAP[6]),
    },
    {
      name: 'gallery grid, 4 columns',
      expression: "sizes={GRID_SIZES[columns ?? '3']}",
      file: 'src/components/sections/Gallery.tsx',
      classes: "'4': 'sm:grid-cols-2 lg:grid-cols-4'",
      sizes: GRID_SIZES['4'],
      cell: (vw) => cellWidth(boxAt(vw), vw >= 1024 ? 4 : vw >= 640 ? 2 : 1, GAP[6]),
    },
    {
      name: 'team grid cards',
      expression: 'sizes={CARD_SIZES}',
      file: 'src/components/sections/TeamGrid.tsx',
      classes: 'sm:grid-cols-2 lg:grid-cols-3',
      sizes: CARD_SIZES,
      cell: (vw) => cellWidth(boxAt(vw), vw >= 1024 ? 3 : vw >= 640 ? 2 : 1, GAP[6]),
    },
    {
      name: 'image block, standard variant',
      expression: "sizes={SIZES[width ?? 'standard']}",
      file: 'src/components/sections/Image.tsx',
      classes: "standard: 'max-w-3xl'",
      sizes: IMAGE_SIZES.standard,
      cell: (vw) => Math.min(768, boxAt(vw)),
    },
    {
      name: 'image block, narrow variant',
      file: 'src/components/sections/Image.tsx',
      classes: "narrow: 'max-w-2xl'",
      expression: "sizes={SIZES[width ?? 'standard']}",
      sizes: IMAGE_SIZES.narrow,
      cell: (vw) => Math.min(672, boxAt(vw)),
    },
    {
      name: 'image block, wide variant',
      file: 'src/components/sections/Image.tsx',
      classes: "wide: 'max-w-5xl'",
      expression: "sizes={SIZES[width ?? 'standard']}",
      sizes: IMAGE_SIZES.wide,
      cell: (vw) => Math.min(1024, boxAt(vw)),
    },
    {
      name: 'image block, full variant',
      expression: "sizes={SIZES[width ?? 'standard']}",
      file: 'src/components/sections/Image.tsx',
      classes: 'full: RAIL_CLASS[SHELL_RAIL]',
      sizes: IMAGE_SIZES.full,
      cell: (vw) => boxAt(vw),
    },
  ]

  for (const site of CALL_SITES) {
    it(`${site.name} still renders the layout its sizes assumes`, () => {
      for (const file of [site.file, ...(site.alsoIn ?? [])]) {
        const src = source(file)
        expect(
          src,
          `${file} no longer contains ${site.classes} — the layout changed, so its geometry must too`,
        ).toContain(site.classes)
        // The whole expression, not a bare token: an unused import is only a
        // WARNING here and `npm run lint` sets no --max-warnings, so a token
        // check survives swapping the value out from under it.
        expect(
          src,
          `${file} no longer passes ${site.expression} — its sizes is no longer the value this test checks`,
        ).toContain(site.expression)
      }
    })

    it(`${site.name} never drifts a rung`, () => {
      for (const vw of VIEWPORTS) {
        const actual = site.cell(vw)
        const declared = resolveSizes(site.sizes, vw)
        for (const dpr of DPRS) {
          expect(
            rungFor(declared * dpr),
            `${site.file} @ ${vw}px ${dpr}x: declared ${declared.toFixed(0)}px for a ${actual.toFixed(0)}px cell`,
          ).toBe(rungFor(actual * dpr))
        }
      }
    })
  }

  it('the four split-media blocks all use the one shared constant', () => {
    // They re-typed the same geometry four times before, which is how one wrong
    // fraction landed in all four at once.
    for (const f of ['Hero', 'CaseStudyHero', 'TwoColumn', 'ServicePillarHero']) {
      expect(source(`src/components/sections/${f}.tsx`), f).toContain('SPLIT_MEDIA_SIZES')
    }
  })

  it('rejects the constant-fraction string that shipped for the split column', () => {
    const constant = boxSizes({ fraction: 0.5 })
    expect(rungFor(resolveSizes(constant, 390) * 2)).not.toBe(rungFor(boxAt(390) * 2))
  })
})
