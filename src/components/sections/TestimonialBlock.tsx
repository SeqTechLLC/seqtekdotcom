import { Section } from '../ui/Section'

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
      <Section
        padding="spacious"
        background="subtle"
        rail="md"
        innerClassName="flex flex-col items-center text-center"
      >
        {photoEl}
        <blockquote className="mt-6 text-h3 font-semibold">&ldquo;{quote}&rdquo;</blockquote>
        {attribution}
      </Section>
    )
  }

  const flexCls = layout === 'with-photo-right' ? 'flex-row-reverse' : 'flex-row'
  return (
    <Section
      padding="spacious"
      background="subtle"
      innerClassName={`flex items-start justify-center gap-8 ${flexCls}`}
    >
      {photoEl}
      <div>
        {/* The cap goes on the blockquote, not a wrapper: `max-w-prose` is 65ch
            and `ch` resolves against the element's OWN font size, so on a
            wrapper inheriting 16px this would cap ~42ch of text-h3 display
            type. `justify-center` above keeps the photo-and-quote unit on the
            page's centre axis once the quote stops filling the rail. */}
        <blockquote className="max-w-prose text-h3 font-semibold">&ldquo;{quote}&rdquo;</blockquote>
        {attribution}
      </div>
    </Section>
  )
}

export default TestimonialBlock
