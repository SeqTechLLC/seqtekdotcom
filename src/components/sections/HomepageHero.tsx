import Link from 'next/link'
import { Section } from '../ui/Section'

interface MediaLike {
  url?: string | null
  alt?: string | null
}

type Cta = { label?: string | null; url?: string | null } | null

interface HomepageHeroProps {
  eyebrow?: string | null
  headline: string
  subheadline?: string | null
  backgroundImage?: MediaLike | string | number | null
  primaryCta?: Cta
  secondaryCta?: Cta
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function HomepageHero({
  eyebrow,
  headline,
  subheadline,
  backgroundImage,
  primaryCta,
  secondaryCta,
}: HomepageHeroProps) {
  return (
    // This block used to put its padding INSIDE the max-width box, the one
    // recipe §11.5 calls out as not commuting with the other: it landed the
    // hero's content 32px right of every section below it, so the homepage
    // never shared its own page grid edge. Taking the shell from Section fixes
    // that alignment — the only intentional visual change in this migration.
    <Section
      padding="none"
      background="inverse"
      className="relative overflow-hidden py-24"
      innerClassName="relative"
      bleed={
        isFullMedia(backgroundImage) && backgroundImage.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backgroundImage.url}
            alt={backgroundImage.alt ?? ''}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null
      }
    >
      {eyebrow ? (
        <p className="text-caption uppercase tracking-wide text-accent">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-display font-bold lg:text-display-xl">{headline}</h1>
      {subheadline ? <p className="mt-6 max-w-3xl text-body-lg">{subheadline}</p> : null}
      <div className="mt-10 flex flex-wrap items-center gap-4">
        {primaryCta?.label && primaryCta?.url ? (
          <Link
            href={primaryCta.url}
            className="rounded-md bg-accent-strong px-6 py-3 font-medium text-white"
          >
            {primaryCta.label}
          </Link>
        ) : null}
        {secondaryCta?.label && secondaryCta?.url ? (
          <Link
            href={secondaryCta.url}
            className="rounded-md border border-white/40 px-6 py-3 font-medium"
          >
            {secondaryCta.label}
          </Link>
        ) : null}
      </div>
    </Section>
  )
}

export default HomepageHero
