/**
 * The page shell's geometry, written down ONCE.
 *
 * Every block used to restate the shell in class strings and then hand-derive
 * its `sizes` attribute against it. That made a one-token rail change
 * (`container-lg` -> `container-xl`) silently invalidate ~46 hand-computed
 * geometries at once, and the fallout arrived one defect at a time over six
 * review rounds. Two blocks shipped a `sizes` string keyed to a single column
 * count while serving two or three, because nothing could check them.
 *
 * So the numbers live here and `sizes` is DERIVED. A rail change is one edit
 * below, and `gridSizes.int.spec.ts` fails on anything the change invalidates.
 */

/** Rail caps. Mirrors `maxWidth.container-*` in tailwind.config.mjs. */
export const RAIL = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export type RailSize = keyof typeof RAIL

/**
 * The site shell's rail. THIS is the one-line edit the refactor exists to make
 * possible: moving the shell used to be a 44-file change that silently
 * invalidated every `sizes` string derived from the old width. Now it is this
 * constant, and `layoutGeometry.int.spec.ts` re-checks every derived geometry
 * against the media ladder when it moves.
 */
export const SHELL_RAIL: RailSize = 'xl'

/**
 * Horizontal section padding, as [minWidth, totalHorizontalPadding].
 * Mirrors `px-4 md:px-6 lg:px-8` — the one shape all 46 blocks shared.
 * Total, not per-side: the box loses both sides.
 */
export const PADDING_STEPS: ReadonlyArray<readonly [number, number]> = [
  [1024, 64],
  [768, 48],
  [0, 32],
] as const

/**
 * Media derivative widths (`BREAKPOINTS` in src/collections/Media.ts).
 * Exported so the tests can assert which rung a `sizes` string selects
 * rather than eyeballing the arithmetic.
 */
export const MEDIA_LADDER = [640, 1024, 1600, 2400] as const

/** Tailwind `gap-N` in px, for the gaps blocks actually use. */
export const GAP = { 4: 16, 6: 24, 8: 32, 10: 40 } as const

/**
 * Columns at each breakpoint, largest first. `[minWidth, columns]`.
 * A block declares what its grid classes already say — `sm:grid-cols-2
 * lg:grid-cols-4` is `[[1024, 4], [640, 2], [0, 1]]`.
 */
export type ColumnStep = readonly [number, number]

interface GridSizesArgs {
  /** Rail the grid sits in. Default `xl`. */
  rail?: RailSize
  /** Column steps, largest breakpoint first. */
  columns: ReadonlyArray<ColumnStep>
  /** Tailwind gap token between cells. Default 6 (24px). */
  gap?: keyof typeof GAP
}

/** Total horizontal padding in effect at a given viewport width. */
export function paddingAt(viewport: number): number {
  for (const [min, pad] of PADDING_STEPS) if (viewport >= min) return pad
  return PADDING_STEPS[PADDING_STEPS.length - 1][1]
}

/** The content box (inside padding, capped by the rail) at a viewport width. */
export function boxAt(viewport: number, rail: RailSize = SHELL_RAIL): number {
  return Math.min(RAIL[rail], viewport - paddingAt(viewport))
}

/** One cell's width in an `n`-column grid within `box`, given a gap. */
export function cellWidth(box: number, columns: number, gapPx: number): number {
  return (box - gapPx * (columns - 1)) / columns
}

/**
 * The viewport at which `100vw - padding` reaches the rail cap, i.e. where the
 * box stops growing. Above it a cell is a constant px width, below it a
 * viewport-relative expression — which is exactly where a `sizes` string needs
 * its crossover, and exactly what hand-written strings kept getting wrong.
 */
export function railCrossover(rail: RailSize = SHELL_RAIL): number {
  const cap = RAIL[rail]
  for (const [min, pad] of PADDING_STEPS) {
    const viewport = cap + pad
    if (viewport >= min) return viewport
  }
  return cap + PADDING_STEPS[PADDING_STEPS.length - 1][1]
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * Build a `sizes` attribute from the grid's own geometry.
 *
 * Emits, largest first: a fixed px arm above the rail crossover, then one arm
 * per (column step x padding step) band below it, expressed as
 * `calc((100vw - <padding + gaps>px) / <columns>)`.
 */
export function gridSizes({ rail = SHELL_RAIL, columns, gap = 6 }: GridSizesArgs): string {
  const gapPx = GAP[gap]
  const cap = RAIL[rail]
  const crossover = railCrossover(rail)

  // Sorted here rather than trusted: `columnsAt` returns on first match, so an
  // ascending array would silently emit a wrong string — the exact class of
  // silent geometry error this module exists to prevent. Callers may pass any
  // order.
  const steps = [...columns].sort((a, b) => b[0] - a[0])
  const columnsAt = (viewport: number): number => {
    for (const [min, n] of steps) if (viewport >= min) return n
    return steps[steps.length - 1][1]
  }

  const arms: string[] = [
    `(min-width: ${crossover}px) ${round(cellWidth(cap, columnsAt(crossover), gapPx))}px`,
  ]

  // Every breakpoint below the crossover where either the column count or the
  // padding changes starts a new band. Deduped and sorted largest-first so the
  // browser's first-match-wins evaluation picks the right arm.
  const breaks = [...new Set([...steps.map(([m]) => m), ...PADDING_STEPS.map(([m]) => m)])]
    .filter((m) => m < crossover)
    .sort((a, b) => b - a)

  for (const min of breaks) {
    const n = columnsAt(min)
    const deduct = paddingAt(min) + gapPx * (n - 1)
    const expr = n === 1 ? `calc(100vw - ${deduct}px)` : `calc((100vw - ${deduct}px) / ${n})`
    arms.push(min === 0 ? expr : `(min-width: ${min}px) ${expr}`)
  }

  return arms.join(', ')
}

/** A share of the box that changes at a breakpoint: `[minWidth, fraction]`. */
export type FractionStep = readonly [number, number]

/**
 * `sizes` for a single (non-grid) element — the `Image` block's width variants,
 * a carousel slide sized in percentages.
 *
 * `fraction` may be a constant OR per-breakpoint steps. That distinction is the
 * whole point: an element whose share of the box changes at a breakpoint (a
 * `lg:grid-cols-2` media column is 100% below lg and 50% above; a carousel
 * slide runs 80% / 48% / 32%) cannot be described by one number, and declaring
 * the narrow share across every viewport UNDER-declares on small screens, where
 * the browser then picks a derivative too small and upscales. Prefer
 * `gridSizes` whenever the element really is a grid cell.
 */
export function boxSizes({
  rail = SHELL_RAIL,
  cap,
  fraction = 1,
}: {
  rail?: RailSize
  cap?: number
  fraction?: number | ReadonlyArray<FractionStep>
} = {}): string {
  const steps: ReadonlyArray<FractionStep> =
    typeof fraction === 'number' ? [[0, fraction]] : [...fraction].sort((a, b) => b[0] - a[0])

  // An empty array would crash on `steps[0]` below — and these are module-level
  // constants, so that is an import-time crash, not a render-time one.
  if (steps.length === 0) throw new Error('boxSizes: `fraction` steps must not be empty')

  const fractionAt = (viewport: number): number => {
    for (const [min, f] of steps) if (viewport >= min) return f
    return steps[steps.length - 1][1]
  }

  const capped = Math.min(RAIL[rail], cap ?? RAIL[rail])
  const topFraction = steps[0][1]
  const effective = capped * topFraction

  // Where `100vw - padding` first reaches the capped width. The last
  // PADDING_STEPS entry is [0, 32], so `candidate >= min` always holds and the
  // loop always assigns — no initializer needed.
  let crossover: number
  for (const [min, pad] of PADDING_STEPS) {
    crossover = capped + pad
    if (crossover >= min) break
  }

  // A fraction step at or above the crossover would be silently dropped by the
  // `m < crossover` filter below while the fixed arm used steps[0] regardless —
  // a 2x under-declaration emitted with no error, in the module written to make
  // exactly that impossible. No current caller does it; refuse rather than
  // guess what was meant.
  const topBand = steps[0][0]
  if (topBand >= crossover!) {
    throw new Error(
      `boxSizes: fraction step at ${topBand}px is at or above the ${crossover!}px rail crossover, ` +
        `where the box stops growing — the band would be silently dropped`,
    )
  }

  const arms: string[] = [`(min-width: ${crossover!}px) ${round(effective)}px`]

  // A band starts wherever either the padding or the fraction changes.
  const breaks = [...new Set([...steps.map(([m]) => m), ...PADDING_STEPS.map(([m]) => m)])]
    .filter((m) => m < crossover!)
    .sort((a, b) => b - a)

  for (const min of breaks) {
    const pad = paddingAt(min)
    const f = fractionAt(min)
    const expr = f === 1 ? `calc(100vw - ${pad}px)` : `calc((100vw - ${pad}px) * ${round(f)})`
    arms.push(min === 0 ? expr : `(min-width: ${min}px) ${expr}`)
  }
  return arms.join(', ')
}

/**
 * The `lg:grid-cols-2` media column shared by `Hero`, `CaseStudyHero`,
 * `TwoColumn` and `ServicePillarHero`: half the box above `lg`, the WHOLE box
 * below, because `lg:grid-cols-2` is the only thing making the parent two
 * columns.
 *
 * Defined once here rather than four times in the blocks — four copies of a
 * geometry is the restatement this module exists to remove, and it is also what
 * let the constant-fraction bug land in all four at once. The call-site test
 * imports THIS value, so a change here is checked against the rendered cell.
 */
export const SPLIT_MEDIA_SIZES = gridSizes({
  columns: [
    [1024, 2],
    [0, 1],
  ],
  gap: 10,
})
