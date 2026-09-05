import { ResponsiveImage } from '../ui/ResponsiveImage'

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

// `sizes` per column count, for the same reason `Image.tsx` keys its table off
// `width`: one string cannot serve cells that differ by 2x. `columns: '2'` is
// the case that forces it — it has no `lg:` override above, so it stays two-up
// at every width, and under container-xl its cell is 628px at 1440 (1256 device
// px at DPR 2). A shared `33vw` declares 475, so the browser picks the 1024w
// rung and upscales. Under container-lg the cell was 500px and 33vw was right,
// so this is the widening's doing, not an inherited imprecision.
//
// Padding is on the outer <section> (px-4 / md:px-6 / lg:px-8) with the
// max-width on an inner unpadded div, so box = min(1280, 100vw - padding);
// grid gap is 24px. Ladder (Media.ts): 640 / 1024 / 1600 / 2400.
const GRID_SIZES: Record<NonNullable<GalleryProps['columns']>, string> = {
  // Two-up from sm all the way up: 628px once container-xl caps the box.
  '2': '(min-width: 1344px) 628px, (min-width: 1024px) calc((100vw - 88px) / 2), (min-width: 768px) calc((100vw - 72px) / 2), (min-width: 640px) calc((100vw - 56px) / 2), calc(100vw - 32px)',
  // Two-up until lg, then three.
  '3': '(min-width: 1344px) 411px, (min-width: 1024px) calc((100vw - 112px) / 3), (min-width: 768px) calc((100vw - 72px) / 2), (min-width: 640px) calc((100vw - 56px) / 2), calc(100vw - 32px)',
  // Two-up until lg, then four.
  '4': '(min-width: 1344px) 302px, (min-width: 1024px) calc((100vw - 136px) / 4), (min-width: 768px) calc((100vw - 72px) / 2), (min-width: 640px) calc((100vw - 56px) / 2), calc(100vw - 32px)',
}

// The carousel ignores `columns` and sizes its slides in percentages of the
// same box (80% / 48% / 32%), which the viewport-relative string still tracks.
const CAROUSEL_SIZES = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'

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
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-xl">
        {heading ? <h2 className="mb-6 text-h3 font-semibold">{heading}</h2> : null}
        {layout === 'carousel' ? (
          <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2">
            {figures.map((f, i) => (
              <div
                key={i}
                className="min-w-[80%] shrink-0 snap-start sm:min-w-[48%] lg:min-w-[32%]"
              >
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
      </div>
    </section>
  )
}

export default Gallery
