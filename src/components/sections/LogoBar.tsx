interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface LogoItem {
  id?: string | null
  logo?: MediaLike | string | number | null
}

interface LogoBarProps {
  heading?: string | null
  source: 'inline' | 'from-homepage'
  logos?: LogoItem[] | null
  treatment?: 'grayscale-on-color-hover' | 'color' | null
}

const isFullMedia = (value: unknown): value is MediaLike =>
  typeof value === 'object' && value !== null && 'url' in (value as object)

export function LogoBar({
  heading,
  source,
  logos,
  treatment = 'grayscale-on-color-hover',
}: LogoBarProps) {
  const list = source === 'inline' ? (logos ?? []) : []
  if (list.length === 0) return null
  const imgCls =
    treatment === 'color'
      ? ''
      : 'grayscale opacity-70 transition hover:opacity-100 hover:grayscale-0'
  return (
    <section className="border-y border-border-subtle bg-surface-subtle px-4 py-10 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? (
          <p className="text-center text-caption uppercase tracking-wide text-text-muted">
            {heading}
          </p>
        ) : null}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {list.map((item, i) => {
            if (!isFullMedia(item.logo) || !item.logo.url) return null
            return (
              <li key={item.id ?? i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.logo.url}
                  alt={item.logo.alt ?? ''}
                  className={`h-10 w-auto object-contain ${imgCls}`}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default LogoBar
