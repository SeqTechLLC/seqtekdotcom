import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section, type SectionBackground } from '../ui/Section'
import { boxSizes, gridSizes, type ColumnStep } from '@/lib/layoutGeometry'

interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, { url?: string | null; width?: number | null } | null>> | null
}

interface GalleryItem {
  id?: string | null
  image?: MediaLike | string | number | null
  caption?: string | null
}

interface GalleryProps {
  heading?: string | null
  intro?: string | null
  items?: GalleryItem[] | null
  layout?: 'grid' | 'carousel' | 'logos' | null
  background?: SectionBackground | null
}

/**
 * Columns follow the count (docs/planning/block-consolidation.md): up to `fit`
 * items share one row; past that, whichever of `choices` leaves the last row
 * fullest, the wider on a tie. There is deliberately no editor control and no
 * ceiling — a cap on how many fit is how content changes became code changes.
 */
export function columnsFor(count: number, fit: number, choices: readonly number[]): number {
  if (count <= fit) return Math.max(1, count)
  const empty = (n: number) => (n - (count % n)) % n
  return choices.reduce((best, n) =>
    empty(n) < empty(best) || (empty(n) === empty(best) && n > best) ? n : best,
  )
}

type GridColumns = '1' | '2' | '3' | '4'
type LogoColumns = '1' | '2' | '3' | '4' | '5' | '6'

/** Photos: up to three in a row, then three or four across. */
export const gridColumnsFor = (count: number): GridColumns =>
  String(columnsFor(count, 3, [3, 4])) as GridColumns

/** Logos are small, so up to six share a row, then four, five or six across. */
export const logoColumnsFor = (count: number): LogoColumns =>
  String(columnsFor(count, 6, [4, 5, 6])) as LogoColumns

// Tailwind must see whole class names, so these stay literal while `sizes` is
// derived from the steps below — the same fact in two forms. Nothing in the
// type system binds them; `layoutGeometry.int.spec.ts` does, in both
// directions: it imports `GRID_SIZES` from this file, and asserts these class
// strings still appear in it. Change one without the other and it fails.
//
// A single picture is not stretched across the rail: it is held to the Image
// block's standard measure and centred, as a lone figure would be.
const GRID_COLUMN_CLASSES: Record<GridColumns, string> = {
  '1': 'mx-auto max-w-3xl',
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

// The column steps ABOVE, as numbers, so `sizes` is derived from the same
// geometry the grid classes describe instead of being hand-computed against
// it. Two across has no `lg:` override, so it stays two-up at every width —
// the case a single shared string used to get wrong by a whole rung.
const GRID_COLUMN_STEPS: Record<Exclude<GridColumns, '1'>, ColumnStep[]> = {
  '2': [
    [640, 2],
    [0, 1],
  ],
  '3': [
    [1024, 3],
    [640, 2],
    [0, 1],
  ],
  '4': [
    [1024, 4],
    [640, 2],
    [0, 1],
  ],
}

export const GRID_SIZES: Record<GridColumns, string> = {
  '1': boxSizes({ cap: 768 }),
  '2': gridSizes({ columns: GRID_COLUMN_STEPS['2'] }),
  '3': gridSizes({ columns: GRID_COLUMN_STEPS['3'] }),
  '4': gridSizes({ columns: GRID_COLUMN_STEPS['4'] }),
}

// The carousel sizes slides as a percentage of the box — but as THREE
// percentages, matching `min-w-[80%] sm:min-w-[48%] lg:min-w-[32%]` on the
// slide below. A single 0.32 is right only in the top band and under-declares
// in the other two.
export const CAROUSEL_SIZES = boxSizes({
  fraction: [
    [1024, 0.32],
    [640, 0.48],
    [0, 0.8],
  ],
})

// Logos render as plain <img> at a fixed height, so no `sizes` is involved.
// Short sets are held narrower than the rail so a pair of logos does not sit in
// two cards the width of half the page.
const LOGO_COLUMN_CLASSES: Record<LogoColumns, string> = {
  '1': 'grid-cols-1 max-w-xs',
  '2': 'grid-cols-2 max-w-2xl',
  '3': 'grid-cols-2 sm:grid-cols-3 max-w-4xl',
  '4': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  '5': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  '6': 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

interface FigureItem {
  image: MediaLike
  caption: string | null
}

function Figure({
  item,
  sizes,
  captionCls,
}: {
  item: FigureItem
  sizes: string
  captionCls: string
}) {
  return (
    <figure className="overflow-hidden rounded-md border border-border-subtle">
      <ResponsiveImage
        media={item.image}
        sizes={sizes}
        className="aspect-[4/3] w-full object-cover"
      />
      {item.caption ? (
        <figcaption className={`px-4 py-3 text-small ${captionCls}`}>{item.caption}</figcaption>
      ) : null}
    </figure>
  )
}

export function Gallery({
  heading,
  intro,
  items,
  layout = 'grid',
  background = 'none',
}: GalleryProps) {
  // Keep only rows whose upload relation is populated (depth > 0), mirroring
  // the workshop proof-gallery resilience the retired template had.
  const figures = (items ?? [])
    .map((it) =>
      isFullMedia(it.image) && it.image.url
        ? { image: it.image, caption: it.caption ?? null }
        : null,
    )
    .filter((f): f is FigureItem => f !== null)

  if (figures.length === 0) return null

  const secondaryCls = background === 'inverse' ? 'text-neutral-200' : 'text-text-secondary'

  return (
    <Section padding="default" background={background ?? 'none'}>
      {heading || intro ? (
        <div className="mb-6">
          {heading ? <h2 className="text-h3 font-semibold">{heading}</h2> : null}
          {intro ? (
            <p className={`${heading ? 'mt-3' : ''} max-w-2xl text-body-lg ${secondaryCls}`}>
              {intro}
            </p>
          ) : null}
        </div>
      ) : null}
      {layout === 'logos' ? (
        <LogoGrid figures={figures} />
      ) : layout === 'carousel' ? (
        // A scrolling row with nothing focusable inside it cannot be scrolled
        // from the keyboard, so the row itself takes focus (axe
        // scrollable-region-focusable) and is named for the landmark it becomes.
        <div
          role="region"
          aria-label={heading ?? 'Photo gallery'}
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
        >
          {figures.map((f, i) => (
            <div key={i} className="min-w-[80%] shrink-0 snap-start sm:min-w-[48%] lg:min-w-[32%]">
              <Figure item={f} sizes={CAROUSEL_SIZES} captionCls={secondaryCls} />
            </div>
          ))}
        </div>
      ) : (
        <PhotoGrid figures={figures} captionCls={secondaryCls} />
      )}
    </Section>
  )
}

function PhotoGrid({ figures, captionCls }: { figures: FigureItem[]; captionCls: string }) {
  const columns = gridColumnsFor(figures.length)
  return (
    <div className={`grid grid-cols-1 gap-6 ${GRID_COLUMN_CLASSES[columns]}`}>
      {figures.map((f, i) => (
        <Figure key={i} item={f} sizes={GRID_SIZES[columns]} captionCls={captionCls} />
      ))}
    </div>
  )
}

// Ported from the retired logo bar (gray until pointed at, so a wall of
// mismatched brand colours stays calm) and client logo grid (the cards, and a
// small caption under the logo). Each card is a light surface whatever the
// band, so a logo drawn for a white page and its caption stay legible on the
// dark one.
function LogoGrid({ figures }: { figures: FigureItem[] }) {
  const columns = logoColumnsFor(figures.length)
  return (
    <ul className={`grid gap-4 sm:gap-5 ${LOGO_COLUMN_CLASSES[columns]}`}>
      {figures.map((f, i) => (
        <li
          key={i}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-6 py-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={f.image.url ?? ''}
            alt={f.image.alt ?? f.caption ?? ''}
            className="h-16 w-auto max-w-full object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 md:h-20"
          />
          {f.caption ? (
            <span className="text-center text-caption text-text-muted">{f.caption}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export default Gallery
