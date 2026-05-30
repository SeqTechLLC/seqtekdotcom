import Link from 'next/link'

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
    <section className="relative overflow-hidden bg-surface-inverse text-text-inverse">
      {isFullMedia(backgroundImage) && backgroundImage.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundImage.url}
          alt={backgroundImage.alt ?? ''}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      ) : null}
      <div className="relative mx-auto max-w-container-lg px-4 py-24 md:px-6 lg:px-8">
        {eyebrow ? (
          <p className="text-caption uppercase tracking-wide text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-display font-bold lg:text-display-xl">{headline}</h1>
        {subheadline ? <p className="mt-6 max-w-3xl text-body-lg">{subheadline}</p> : null}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          {primaryCta?.label && primaryCta?.url ? (
            <Link
              href={primaryCta.url}
              className="rounded-md bg-accent px-6 py-3 font-medium text-white"
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
      </div>
    </section>
  )
}

export default HomepageHero
