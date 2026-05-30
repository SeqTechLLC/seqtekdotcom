interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface Metric {
  number?: string | null
  label?: string | null
  context?: string | null
}

interface CaseStudyHeroProps {
  eyebrow: string
  headline: string
  metric?: Metric | null
  heroImage?: MediaLike | string | number | null
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function CaseStudyHero({ eyebrow, headline, metric, heroImage }: CaseStudyHeroProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-container-lg gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-caption uppercase tracking-wide text-accent">{eyebrow}</p>
          <h1 className="mt-2 text-h1 font-bold">{headline}</h1>
          {metric ? (
            <div className="mt-8 border-l-4 border-accent pl-4">
              {metric.number ? (
                <p className="text-display font-bold text-accent">{metric.number}</p>
              ) : null}
              {metric.label ? (
                <p className="mt-1 text-body-lg font-semibold">{metric.label}</p>
              ) : null}
              {metric.context ? (
                <p className="mt-1 text-small text-text-secondary">{metric.context}</p>
              ) : null}
            </div>
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

export default CaseStudyHero
