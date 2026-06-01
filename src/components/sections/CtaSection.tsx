import Link from 'next/link'

type Cta = { label?: string | null; url?: string | null } | null

interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface CtaSectionProps {
  variant?: 'centered' | 'split' | 'inverse' | null
  headline: string
  body?: string | null
  primaryCta?: Cta
  secondaryCta?: Cta
  background?: 'default' | 'accent' | 'image' | null
  backgroundImage?: MediaLike | string | number | null
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function CtaSection({
  variant = 'centered',
  headline,
  body,
  primaryCta,
  secondaryCta,
  background = 'default',
  backgroundImage,
}: CtaSectionProps) {
  const isInverse = variant === 'inverse' || background === 'accent'
  const wrapperCls = [
    'relative px-4 py-16 md:px-6 lg:px-8',
    // accent-strong (green-700) — brand-green-500 (`bg-accent`) fails WCAG AA
    // contrast with white text (2.39:1). DESIGN_SYSTEM.md §14.
    isInverse ? 'bg-accent-strong text-white' : 'bg-surface-subtle',
  ].join(' ')
  const alignmentCls = variant === 'centered' ? 'text-center' : 'text-left'

  return (
    <section className={wrapperCls}>
      {background === 'image' && isFullMedia(backgroundImage) && backgroundImage.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundImage.url}
          alt={backgroundImage.alt ?? ''}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
        />
      ) : null}
      <div className={`mx-auto max-w-container-md ${alignmentCls}`}>
        <h2 className="text-h2 font-bold">{headline}</h2>
        {body ? <p className="mt-4 text-body-lg">{body}</p> : null}
        <div
          className={`mt-8 flex flex-wrap items-center gap-4 ${variant === 'centered' ? 'justify-center' : ''}`}
        >
          {primaryCta?.label && primaryCta?.url ? (
            <Link
              href={primaryCta.url}
              className={`rounded-md px-5 py-3 font-medium ${isInverse ? 'bg-white text-accent-strong' : 'bg-accent-strong text-white'}`}
            >
              {primaryCta.label}
            </Link>
          ) : null}
          {secondaryCta?.label && secondaryCta?.url ? (
            <Link href={secondaryCta.url} className="font-medium underline">
              {secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default CtaSection
