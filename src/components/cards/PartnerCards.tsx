import Link from 'next/link'

import { type CardKind, type GridProps, type MediaLike, isMedia } from './types'

export interface PartnerCard {
  id?: string | number
  name?: string | null
  slug?: string | null
  summary?: string | null
  logo?: MediaLike | string | number | null
}

/** A partner card is only ever a link, so a partner without a slug is not drawn. */
export const isPartnerDoc = (v: unknown): v is PartnerCard =>
  typeof v === 'object' && v !== null && 'name' in v && Boolean((v as PartnerCard).slug)

export function PartnerCards({ docs, headingLevel }: GridProps<PartnerCard>) {
  const CardHeading = headingLevel
  return (
    <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((p, i) => (
        <li key={p.id ?? p.slug ?? i}>
          {/* `<a>` is transparent content, so flow content (the card's
              heading) belongs in a <div>, not a <span> (phrasing-only).
              Focus ring comes from the global `:focus-visible` rule. */}
          <Link
            href={`/partners/${p.slug}`}
            className="flex h-full flex-col rounded-lg border border-border-subtle bg-surface text-text-primary transition-colors hover:border-border-strong"
          >
            <div className="flex items-center justify-center border-b border-border-subtle px-6 py-10">
              {isMedia(p.logo) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.logo.url}
                  alt={p.logo.alt ?? p.name ?? ''}
                  className="h-14 w-auto object-contain md:h-16"
                />
              ) : (
                <span className="text-h3 font-bold text-text-secondary">{p.name}</span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 px-6 py-6">
              <CardHeading className="text-h4 font-bold">{p.name}</CardHeading>
              {p.summary ? <p className="text-body text-text-secondary">{p.summary}</p> : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export const partnerKind: CardKind<PartnerCard> = {
  isDoc: isPartnerDoc,
  Grid: PartnerCards,
  featured: (p) => ({
    title: p.name ?? '',
    subtitle: p.summary,
    href: `/partners/${p.slug}`,
    ctaLabel: 'See the partnership',
    image: isMedia(p.logo) ? { ...p.logo, alt: p.logo.alt ?? p.name ?? '' } : null,
    imageIsLogo: true,
  }),
}
