interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface LogoItem {
  id?: string | null
  logo?: MediaLike | string | number | null
  caption?: string | null
}

interface ClientLogoGridProps {
  heading?: string | null
  logos: LogoItem[]
  columns?: '3' | '4' | '6' | null
}

const isFullMedia = (v: unknown): v is MediaLike =>
  typeof v === 'object' && v !== null && 'url' in (v as object)

const COL_CLASSES: Record<NonNullable<ClientLogoGridProps['columns']>, string> = {
  '3': 'grid-cols-2 sm:grid-cols-3',
  '4': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  '6': 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
}

export function ClientLogoGrid({ heading, logos, columns = '4' }: ClientLogoGridProps) {
  const colCls = COL_CLASSES[columns ?? '4']
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ul className={`mt-8 grid gap-x-6 gap-y-8 ${colCls}`}>
          {logos.map((item, i) => {
            if (!isFullMedia(item.logo) || !item.logo.url) return null
            return (
              <li key={item.id ?? i} className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.logo.url}
                  alt={item.logo.alt ?? item.caption ?? ''}
                  className="h-12 w-auto object-contain"
                />
                {item.caption ? (
                  <span className="text-caption text-text-muted">{item.caption}</span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default ClientLogoGrid
