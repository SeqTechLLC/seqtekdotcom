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

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

function Figure({ item }: { item: { image: MediaLike; caption: string | null } }) {
  return (
    <figure className="overflow-hidden rounded-md border border-border-subtle">
      <ResponsiveImage
        media={item.image}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="mb-6 text-h3 font-semibold">{heading}</h2> : null}
        {layout === 'carousel' ? (
          <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2">
            {figures.map((f, i) => (
              <div
                key={i}
                className="min-w-[80%] shrink-0 snap-start sm:min-w-[48%] lg:min-w-[32%]"
              >
                <Figure item={f} />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-6 ${GRID_COLUMN_CLASSES[columns ?? '3']}`}>
            {figures.map((f, i) => (
              <Figure key={i} item={f} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Gallery
