import Link from 'next/link'

import { type CardKind, type GridProps, type MediaLike, hasKey, isMedia } from './types'

export interface PostCard {
  id?: string | number
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  featuredImage?: MediaLike | string | number | null
}

export const isPostDoc = hasKey<PostCard>('title')

/** Featured image on top, title and excerpt under it; the whole card links. */
export function PostCards({ docs, headingLevel }: GridProps<PostCard>) {
  const CardHeading = headingLevel
  return (
    <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {docs.map((p) => {
        const card = (
          <>
            {isMedia(p.featuredImage) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.featuredImage.url}
                alt={p.featuredImage.alt ?? p.title ?? ''}
                className="aspect-[16/9] w-full object-cover"
              />
            ) : null}
            <div className="p-5">
              <CardHeading className="text-h4 font-semibold">{p.title}</CardHeading>
              {p.excerpt ? <p className="mt-2 text-body text-text-secondary">{p.excerpt}</p> : null}
            </div>
          </>
        )
        // Whole card is the click target. group + transition for a subtle
        // hover lift; the heading inherits color so it is not a separate link.
        return (
          <li
            key={p.id ?? p.slug}
            className="group overflow-hidden rounded-md border border-border-subtle bg-surface text-text-primary shadow-xs transition hover:border-border-strong hover:shadow-sm"
          >
            {p.slug ? (
              <Link href={`/insights/${p.slug}`} className="block h-full">
                {card}
              </Link>
            ) : (
              card
            )}
          </li>
        )
      })}
    </ul>
  )
}

export const postKind: CardKind<PostCard> = {
  isDoc: isPostDoc,
  Grid: PostCards,
  featured: (p) => ({
    title: p.title ?? '',
    subtitle: p.excerpt,
    href: p.slug ? `/insights/${p.slug}` : null,
    ctaLabel: 'Read the article',
    image: isMedia(p.featuredImage) ? p.featuredImage : null,
  }),
}
