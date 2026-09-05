import { ResponsiveImage } from '../ui/ResponsiveImage'
import { Section } from '../ui/Section'
import { boxSizes } from '@/lib/layoutGeometry'

// A `lg:grid-cols-2` media column: half the box above lg, the whole box below.
// Derived so it tracks the shell rail instead of restating a vw fraction that
// only happened to be right at the old width.
const HALF_RAIL_SIZES = boxSizes({ fraction: 0.5 })

interface MediaLike {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<string, { url?: string | null; width?: number | null } | null>> | null
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
    <Section padding="spacious" innerClassName="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="text-caption uppercase tracking-wide text-accent-strong">{eyebrow}</p>
        <h1 className="mt-2 text-h1 font-bold">{headline}</h1>
        {metric ? (
          <div className="mt-8 border-l-4 border-accent-strong pl-4">
            {metric.number ? (
              <p className="text-display font-bold text-accent-strong">{metric.number}</p>
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
        <ResponsiveImage
          media={heroImage}
          sizes={HALF_RAIL_SIZES}
          className="w-full rounded-md"
          loading="eager"
          fetchPriority="high"
        />
      ) : null}
    </Section>
  )
}

export default CaseStudyHero
