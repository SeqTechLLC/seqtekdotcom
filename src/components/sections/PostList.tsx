import Link from 'next/link'

interface PostDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  featuredImage?: { url?: string | null; alt?: string | null } | string | number | null
}

interface PostListProps {
  heading?: string | null
  source: 'latest' | 'by-category' | 'manual'
  manualItems?: Array<PostDoc | string | number> | null
  limit?: number | null
  /** Card title level. Defaults to `h3`; listing pages with a page-level `h1`
   *  and no section heading pass `h2` to keep heading order non-skipping. */
  headingLevel?: 'h2' | 'h3'
}

const isDoc = (v: unknown): v is PostDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

const isMedia = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function PostList({
  heading,
  source,
  manualItems,
  limit = 3,
  headingLevel = 'h3',
}: PostListProps) {
  const docs = source === 'manual' ? (manualItems ?? []).filter(isDoc).slice(0, limit ?? 12) : []
  const CardHeading = headingLevel
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading ?? 'Latest insights'}</h2> : null}
        {source !== 'manual' ? (
          <p className="mt-2 text-caption text-text-muted">
            Source: {source} (resolves at template time)
          </p>
        ) : null}
        {docs.length > 0 ? (
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((p) => (
              <li
                key={p.id ?? p.slug}
                className="overflow-hidden rounded-md border border-border-subtle bg-surface shadow-xs"
              >
                {isMedia(p.featuredImage) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.featuredImage.url}
                    alt={p.featuredImage.alt ?? p.title ?? ''}
                    className="h-36 w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  <CardHeading className="text-h4 font-semibold">
                    {p.slug ? <Link href={`/insights/${p.slug}`}>{p.title}</Link> : p.title}
                  </CardHeading>
                  {p.excerpt ? (
                    <p className="mt-2 text-body text-text-secondary">{p.excerpt}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export default PostList
