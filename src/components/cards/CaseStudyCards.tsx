import Link from 'next/link'

import { type CardKind, type GridProps, type MediaLike, hasKey, isMedia } from './types'

export interface CaseStudyCard {
  id?: string | number
  title?: string | null
  slug?: string | null
  subtitle?: string | null
  heroImage?: MediaLike | string | number | null
}

export const isCaseStudyDoc = hasKey<CaseStudyCard>('title')

/** Photo on top, title and one-line subtitle under it; the whole card links. */
export function CaseStudyCards({ docs, headingLevel }: GridProps<CaseStudyCard>) {
  const CardHeading = headingLevel
  return (
    <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {docs.map((d) => {
        const card = (
          <>
            {isMedia(d.heroImage) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={d.heroImage.url}
                alt={d.heroImage.alt ?? d.title ?? ''}
                className="aspect-[16/9] w-full object-cover"
              />
            ) : null}
            <div className="p-5">
              <CardHeading className="text-h4 font-semibold">{d.title}</CardHeading>
              {d.subtitle ? (
                <p className="mt-2 text-body text-text-secondary">{d.subtitle}</p>
              ) : null}
            </div>
          </>
        )
        return (
          <li
            key={d.id ?? d.slug}
            className="group overflow-hidden rounded-md border border-border-subtle bg-surface text-text-primary shadow-xs transition hover:border-border-strong hover:shadow-sm"
          >
            {d.slug ? (
              <Link href={`/case-studies/${d.slug}`} className="block h-full">
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

export const caseStudyKind: CardKind<CaseStudyCard> = {
  isDoc: isCaseStudyDoc,
  Grid: CaseStudyCards,
  featured: (d) => ({
    title: d.title ?? '',
    subtitle: d.subtitle,
    href: d.slug ? `/case-studies/${d.slug}` : null,
    ctaLabel: 'Read the case study',
    image: isMedia(d.heroImage) ? d.heroImage : null,
  }),
}
