import Link from 'next/link'

interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface NavCard {
  id?: string | null
  title: string
  description: string
  image?: MediaLike | string | number | null
  linkUrl: string
}

interface NavCardsProps {
  cards: NavCard[]
}

const isFullMedia = (v: unknown): v is MediaLike =>
  typeof v === 'object' && v !== null && 'url' in (v as object)

export function NavCards({ cards }: NavCardsProps) {
  if (cards.length === 0) return null
  const gridCls =
    cards.length === 2
      ? 'sm:grid-cols-2'
      : cards.length === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        <ul className={`grid gap-6 ${gridCls}`}>
          {cards.map((c, i) => (
            <li
              key={c.id ?? i}
              className="overflow-hidden rounded-md border border-border-subtle bg-surface shadow-xs"
            >
              <Link href={c.linkUrl} className="block">
                {isFullMedia(c.image) && c.image.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image.url}
                    alt={c.image.alt ?? c.title}
                    className="h-36 w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  {/* h2: nav cards are top-level navigation that sit directly
                      under the page h1 (e.g. the /services overview), so their
                      titles must be the next heading level down — an h3 here
                      skips a level and trips the WCAG heading-order sweep. The
                      text-h4 token keeps the visual size unchanged. */}
                  <h2 className="text-h4 font-semibold">{c.title}</h2>
                  <p className="mt-2 text-body text-text-secondary">{c.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default NavCards
