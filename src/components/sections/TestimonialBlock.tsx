interface TestimonialDoc {
  quote?: string | null
  personName?: string | null
  personTitle?: string | null
  company?: string | null
  photo?: { url?: string | null; alt?: string | null } | string | number | null
}

interface TestimonialBlockProps {
  testimonial?: TestimonialDoc | string | number | null
  layout?: 'centered' | 'with-photo-left' | 'with-photo-right' | null
}

const isDoc = (v: unknown): v is TestimonialDoc =>
  typeof v === 'object' && v !== null && 'quote' in (v as object)

const isMedia = (v: unknown): v is { url: string; alt?: string | null } =>
  typeof v === 'object' && v !== null && 'url' in (v as object) && !!(v as { url: unknown }).url

export function TestimonialBlock({ testimonial, layout = 'centered' }: TestimonialBlockProps) {
  if (!isDoc(testimonial)) return null
  const { quote, personName, personTitle, company, photo } = testimonial
  const photoEl = isMedia(photo) ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.url}
      alt={photo.alt ?? personName ?? ''}
      className="h-20 w-20 rounded-full object-cover"
    />
  ) : null

  const attribution = (
    <p className="mt-4 text-small text-text-secondary">
      {personName}
      {personTitle ? `, ${personTitle}` : ''}
      {company ? ` · ${company}` : ''}
    </p>
  )

  if (layout === 'centered') {
    return (
      <section className="bg-surface-subtle px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-container-md flex-col items-center text-center">
          {photoEl}
          <blockquote className="mt-6 text-h3 font-semibold">&ldquo;{quote}&rdquo;</blockquote>
          {attribution}
        </div>
      </section>
    )
  }

  const flexCls = layout === 'with-photo-right' ? 'flex-row-reverse' : 'flex-row'
  return (
    <section className="bg-surface-subtle px-4 py-16 md:px-6 lg:px-8">
      <div className={`mx-auto flex max-w-container-lg items-start gap-8 ${flexCls}`}>
        {photoEl}
        <div>
          <blockquote className="text-h3 font-semibold">&ldquo;{quote}&rdquo;</blockquote>
          {attribution}
        </div>
      </div>
    </section>
  )
}

export default TestimonialBlock
