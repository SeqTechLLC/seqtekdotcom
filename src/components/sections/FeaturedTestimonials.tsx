interface TestimonialDoc {
  id?: string | number
  quote?: string | null
  personName?: string | null
  personTitle?: string | null
  company?: string | null
  photo?: { url?: string | null; alt?: string | null } | string | number | null
}

interface FeaturedTestimonialsProps {
  heading?: string | null
  testimonials?: Array<TestimonialDoc | string | number> | null
  // autoplay: deferred until the carousel ships; static stack-grid for now.
}

const isDoc = (v: unknown): v is TestimonialDoc =>
  typeof v === 'object' && v !== null && 'quote' in (v as object)

const isMedia = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function FeaturedTestimonials({ heading, testimonials }: FeaturedTestimonialsProps) {
  const docs = (testimonials ?? []).filter(isDoc)
  if (docs.length === 0) return null
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((t, i) => (
            <li
              key={t.id ?? i}
              className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-6 shadow-xs"
            >
              <blockquote className="text-body">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="mt-auto flex items-center gap-3">
                {isMedia(t.photo) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.photo.url}
                    alt={t.photo.alt ?? t.personName ?? ''}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : null}
                <div>
                  <p className="text-small font-semibold">{t.personName}</p>
                  {t.personTitle || t.company ? (
                    <p className="text-caption text-text-muted">
                      {t.personTitle}
                      {t.company ? `, ${t.company}` : ''}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default FeaturedTestimonials
