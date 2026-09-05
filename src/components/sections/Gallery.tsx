import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section } from '../ui/Section'
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
  items?: GalleryItem[] | null
  layout?: 'grid' | 'carousel' | null
  columns?: '2' | '3' | '4' | null
}

const GRID_COLUMN_CLASSES: Record<NonNullable<GalleryProps['columns']>, string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

// The column steps ABOVE, as numbers, so `sizes` is derived from the same
// geometry the grid classes describe instead of being hand-computed against
// it. `columns: '2'` has no `lg:` override, so it stays two-up at every width
// — the case a single shared string used to get wrong by a whole rung.
const GRID_COLUMN_STEPS: Record<NonNullable<GalleryProps['columns']>, ColumnStep[]> = {
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

const GRID_SIZES: Record<NonNullable<GalleryProps['columns']>, string> = {
  '2': gridSizes({ columns: GRID_COLUMN_STEPS['2'] }),
  '3': gridSizes({ columns: GRID_COLUMN_STEPS['3'] }),
  '4': gridSizes({ columns: GRID_COLUMN_STEPS['4'] }),
}

// The carousel ignores `columns` and sizes slides as a percentage of the box.
const CAROUSEL_SIZES = boxSizes({ fraction: 0.32 })

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

function Figure({
  item,
  sizes,
}: {
  item: { image: MediaLike; caption: string | null }
  sizes: string
}) {
  return (
    <figure className="overflow-hidden rounded-md border border-border-subtle">
      <ResponsiveImage
        media={item.image}
        sizes={sizes}
        className="aspect-[4/3] w-full object-cover"
      />
      {item.caption ? (
        <figcaption className="px-4 py-3 text-small text-text-secondary">{item.caption}</figcaption>
      ) : null}
    </figure>
  )
}

export function Gallery({ heading, items, layout = 'grid', columns = '3' }: GalleryProps) {
  // Keep only rows whose upload relation is populated (depth > 0), mirroring
  // the workshop proof-gallery resilience the retired template had.
  const figures = (items ?? [])
    .map((it) =>
      isFullMedia(it.image) && it.image.url
        ? { image: it.image, caption: it.caption ?? null }
        : null,
    )
    .filter((f): f is { image: MediaLike; caption: string | null } => f !== null)

  if (figures.length === 0) return null

  return (
    <Section padding="default">
      {heading ? <h2 className="mb-6 text-h3 font-semibold">{heading}</h2> : null}
      {layout === 'carousel' ? (
        <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2">
          {figures.map((f, i) => (
            <div key={i} className="min-w-[80%] shrink-0 snap-start sm:min-w-[48%] lg:min-w-[32%]">
              <Figure item={f} sizes={CAROUSEL_SIZES} />
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-6 ${GRID_COLUMN_CLASSES[columns ?? '3']}`}>
          {figures.map((f, i) => (
            <Figure key={i} item={f} sizes={GRID_SIZES[columns ?? '3']} />
          ))}
        </div>
      )}
    </Section>
  )
}

export default Gallery
