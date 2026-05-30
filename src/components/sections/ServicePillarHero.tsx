import Link from 'next/link'

interface MediaLike {
  url?: string | null
  alt?: string | null
}

type Cta = { label?: string | null; url?: string | null } | null

interface ServicePillarHeroProps {
  pillarName: string
  headline: string
  subheadline?: string | null
  heroImage?: MediaLike | string | number | null
  primaryCta?: Cta
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function ServicePillarHero({
  pillarName,
  headline,
  subheadline,
  heroImage,
  primaryCta,
}: ServicePillarHeroProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-container-lg gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-caption uppercase tracking-wide text-accent">{pillarName}</p>
          <h1 className="mt-2 text-h1 font-bold">{headline}</h1>
          {subheadline ? (
            <p className="mt-4 text-body-lg text-text-secondary">{subheadline}</p>
          ) : null}
          {primaryCta?.label && primaryCta?.url ? (
            <Link
              href={primaryCta.url}
              className="mt-8 inline-block rounded-md bg-accent px-5 py-3 font-medium text-white"
            >
              {primaryCta.label}
            </Link>
          ) : null}
        </div>
        {isFullMedia(heroImage) && heroImage.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage.url} alt={heroImage.alt ?? ''} className="w-full rounded-md" />
        ) : null}
      </div>
    </section>
  )
}

export default ServicePillarHero
