import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { ReadingColumn } from '../ui/ReadingColumn'
import { Section, type SectionBackground } from '../ui/Section'
import { toneFor, type Tone } from '../ui/tone'

interface MediaLike {
  url: string
  alt?: string | null
}

interface TestimonialDoc {
  id?: string | number
  quote?: string | null
  personName?: string | null
  personTitle?: string | null
  company?: string | null
  photo?: { url?: string | null; alt?: string | null } | string | number | null
}

type QuoteLayout = 'centered' | 'with-photo-left' | 'with-photo-right'

interface QuoteProps {
  heading?: string | null
  intro?: string | null
  source?: 'testimonials' | 'custom' | null
  testimonials?: Array<TestimonialDoc | string | number> | null
  quote?: string | null
  attribution?: string | null
  role?: string | null
  layout?: QuoteLayout | null
  background?: SectionBackground | null
}

/** One quote, whichever side of `source` it came from. */
interface Spoken {
  key: string | number
  quote: string
  name: string | null
  title: string | null
  company: string | null
  photo: MediaLike | null
}

const isDoc = (v: unknown): v is TestimonialDoc =>
  typeof v === 'object' && v !== null && 'quote' in (v as object)

const isMedia = (v: unknown): v is MediaLike =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

const clean = (v: string | null | undefined): string | null => v?.trim() || null

/**
 * `source` is the whole precedence rule: the side it names is published and
 * the other side is ignored, even when both were filled in. An unpopulated
 * relation (an id, or a draft the reader cannot see) is dropped, as is a
 * record with no words in it.
 */
function spokenFrom(props: QuoteProps): Spoken[] {
  if (props.source === 'custom') {
    const quote = clean(props.quote)
    if (!quote) return []
    return [
      {
        key: 'custom',
        quote,
        name: clean(props.attribution),
        title: clean(props.role),
        company: null,
        photo: null,
      },
    ]
  }
  return (props.testimonials ?? []).filter(isDoc).flatMap((t, i) => {
    const quote = clean(t.quote)
    if (!quote) return []
    return [
      {
        key: t.id ?? i,
        quote,
        name: clean(t.personName),
        title: clean(t.personTitle),
        company: clean(t.company),
        photo: isMedia(t.photo) ? t.photo : null,
      },
    ]
  })
}

function Header({
  heading,
  intro,
  tone,
}: {
  heading?: string | null
  intro?: string | null
  tone: Tone
}): ReactNode {
  if (!heading && !intro) return null
  return (
    <>
      {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
      {intro ? (
        <p className={cn('text-body-lg', heading && 'mt-4', tone.secondary)}>{intro}</p>
      ) : null}
    </>
  )
}

function Single({ item, layout, props }: { item: Spoken; layout: QuoteLayout; props: QuoteProps }) {
  const tone = toneFor(props.background)
  const background = props.background ?? 'subtle'
  const photo = item.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.photo.url}
      alt={item.photo.alt ?? item.name ?? ''}
      className="h-20 w-20 rounded-full object-cover"
    />
  ) : null

  // Join only the parts that exist, so a missing title never leaves a stray
  // ", " or " · " at the front of the line.
  const who = [item.name, item.title].filter(Boolean).join(', ')
  const line = [who, item.company].filter(Boolean).join(' · ')
  const credit = line ? <p className={cn('mt-4 text-small', tone.secondary)}>{line}</p> : null
  const hasHeader = Boolean(props.heading || props.intro)

  if (layout === 'centered') {
    return (
      <Section
        padding="spacious"
        background={background}
        rail="md"
        innerClassName="flex flex-col items-center text-center"
      >
        {hasHeader ? (
          <div className="mb-2">
            <Header heading={props.heading} intro={props.intro} tone={tone} />
          </div>
        ) : null}
        {photo}
        <blockquote className="mt-6 text-h3 font-semibold">&ldquo;{item.quote}&rdquo;</blockquote>
        {credit}
      </Section>
    )
  }

  return (
    <Section padding="spacious" background={background}>
      {hasHeader ? (
        <ReadingColumn className="mb-8">
          <Header heading={props.heading} intro={props.intro} tone={tone} />
        </ReadingColumn>
      ) : null}
      <div
        className={cn(
          'flex items-start justify-center gap-8',
          layout === 'with-photo-right' ? 'flex-row-reverse' : 'flex-row',
        )}
      >
        {photo}
        <div>
          {/* The cap goes on the blockquote, not a wrapper: `max-w-prose` is
              65ch and `ch` resolves against the element's OWN font size, so on
              a wrapper inheriting 16px this would cap ~42ch of text-h3 display
              type. `justify-center` above keeps the photo-and-quote unit on
              the page's centre axis once the quote stops filling the rail. */}
          <blockquote className="max-w-prose text-h3 font-semibold">
            &ldquo;{item.quote}&rdquo;
          </blockquote>
          {credit}
        </div>
      </div>
    </Section>
  )
}

function Grid({ items, props }: { items: Spoken[]; props: QuoteProps }) {
  const tone = toneFor(props.background)
  const hasHeader = Boolean(props.heading || props.intro)
  return (
    <Section padding="spacious" background={props.background ?? 'subtle'}>
      {hasHeader ? (
        // `flush`: the grid below fills the rail, so the heading shares its
        // left edge rather than centring over it.
        <ReadingColumn flush>
          <Header heading={props.heading} intro={props.intro} tone={tone} />
        </ReadingColumn>
      ) : null}
      <ul className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', hasHeader && 'mt-8')}>
        {items.map((t) => {
          const credit = [t.title, t.company].filter(Boolean).join(', ')
          return (
            // Cards are always a light surface, so their text is pinned dark
            // rather than inheriting white from the inverse band.
            <li
              key={t.key}
              className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-6 text-text-primary shadow-xs"
            >
              <blockquote className="text-body">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="mt-auto flex items-center gap-3">
                {t.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.photo.url}
                    alt={t.photo.alt ?? t.name ?? ''}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : null}
                <div>
                  {t.name ? <p className="text-small font-semibold">{t.name}</p> : null}
                  {credit ? <p className="text-caption text-text-muted">{credit}</p> : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/**
 * Replaces `testimonial-block` (one quote, large) and `featured-testimonials`
 * (several, as a grid). The count decides which: one quote is drawn large in
 * the chosen `layout`, two or more always sit in a grid.
 */
export function Quote(props: QuoteProps) {
  const items = spokenFrom(props)
  if (items.length === 0) return null
  if (items.length === 1) {
    return <Single item={items[0]} layout={props.layout ?? 'centered'} props={props} />
  }
  return <Grid items={items} props={props} />
}

export default Quote
