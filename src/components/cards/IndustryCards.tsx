import Link from 'next/link'

import { type CardKind, type GridProps, hasKey } from './types'

export interface IndustryCard {
  id?: string | number
  title?: string | null
  slug?: string | null
  _status?: ('draft' | 'published') | null
  layout?: unknown[] | null
}

export const isIndustryDoc = hasKey<IndustryCard>('title')

const CARD =
  'flex h-full flex-col rounded-md border border-border-subtle bg-surface p-5 text-center text-text-primary shadow-xs'

/**
 * Published is not the same as ROUTABLE. `/industries/[slug]` calls
 * `notFound()` on an industry with an empty `layout`, so a card must not link
 * to one — the same predicate the sitemap uses
 * (`findPublishedIndustrySlugsWithBody`).
 *
 * A draft loses its LINK, not its card. On the public paths a draft never
 * arrives populated (the readers pass `overrideAccess: false`); the guard is
 * for draft preview, which populates drafts by design and should still show
 * the editor what the public page will look like.
 *
 * `layout` arrives because every reader populates industries without a
 * `select` or `defaultPopulate`. Adding either to `Industries` would unlink
 * every card, and no test would notice: `cards.int.spec.tsx` pins this rule on
 * hand-built docs, not on what the readers return.
 */
export const isLinkable = (d: IndustryCard): boolean =>
  Boolean(d.slug) && d._status !== 'draft' && (d.layout ?? []).length > 0

export function IndustryCards({ docs, headingLevel }: GridProps<IndustryCard>) {
  const CardHeading = headingLevel
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {docs.map((d) => (
        <li key={d.id ?? d.slug}>
          {/* `<a>` is transparent content, so the heading belongs in flow
              content inside the link. */}
          {isLinkable(d) ? (
            <Link
              href={`/industries/${d.slug}`}
              className={`${CARD} transition-colors hover:border-border-strong`}
            >
              <CardHeading className="text-h4 font-semibold">{d.title}</CardHeading>
            </Link>
          ) : (
            <div className={CARD}>
              <CardHeading className="text-h4 font-semibold">{d.title}</CardHeading>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export const industryKind: CardKind<IndustryCard> = {
  isDoc: isIndustryDoc,
  Grid: IndustryCards,
  featured: (d) => ({
    title: d.title ?? '',
    href: isLinkable(d) ? `/industries/${d.slug}` : null,
    ctaLabel: 'Explore the industry',
  }),
}
