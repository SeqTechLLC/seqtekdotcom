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
  // ROADMAP INERT-2 — an empty pick used to publish "No manual items — falls
  // back to category-derived list at render time", promising a fallback that
  // was never built: `resolveLayout` has no `related-posts` resolver, and
  // writing one needs the containing document's categories, which its
  // block-only signature does not carry. Until that lands, an empty block
  // renders nothing, the same as every other collection-backed block.
  if (docs.length === 0) return null
  return (
    <section className="border-t border-border-subtle px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-xl">
        <h2 className="text-h3 font-semibold">{heading ?? 'Related posts'}</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {docs.map((p) => {
            const card = <h3 className="text-body font-semibold">{p.title}</h3>
            return (
              <li
                key={p.id ?? p.slug}
                className="group rounded-md border border-border-subtle bg-surface-subtle transition hover:border-border-strong hover:shadow-sm"
              >
                {p.slug ? (
                  <Link href={`/insights/${p.slug}`} className="block h-full p-4">
                    {card}
                  </Link>
                ) : (
                  <div className="p-4">{card}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default RelatedPosts
