import Link from 'next/link'

interface PostDoc {
  id?: string | number
  title?: string | null
  slug?: string | null
}

interface RelatedPostsProps {
  heading?: string | null
  manualItems?: Array<PostDoc | string | number> | null
  limit?: number | null
}

const isDoc = (v: unknown): v is PostDoc =>
  typeof v === 'object' && v !== null && 'title' in (v as object)

export function RelatedPosts({ heading, manualItems, limit = 3 }: RelatedPostsProps) {
  const docs = (manualItems ?? []).filter(isDoc).slice(0, limit ?? 6)
  if (docs.length === 0) {
    return (
      <section className="border-t border-border-subtle px-4 py-12 md:px-6 lg:px-8">
        <div className="mx-auto max-w-container-md">
          <h2 className="text-h3 font-semibold">{heading ?? 'Related posts'}</h2>
          <p className="mt-2 text-caption text-text-muted">
            No manual items — falls back to category-derived list at render time.
          </p>
        </div>
      </section>
    )
  }
  return (
    <section className="border-t border-border-subtle px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md">
        <h2 className="text-h3 font-semibold">{heading ?? 'Related posts'}</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {docs.map((p) => (
            <li
              key={p.id ?? p.slug}
              className="rounded-md border border-border-subtle bg-surface-subtle p-4"
            >
              <h3 className="text-body font-semibold">
                {p.slug ? <Link href={`/insights/${p.slug}`}>{p.title}</Link> : p.title}
              </h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default RelatedPosts
