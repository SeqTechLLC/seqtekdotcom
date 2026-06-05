interface TestimonialLike {
  quote?: string | null
  personName?: string | null
  personTitle?: string | null
  company?: string | null
}

interface TestimonialEmbedProps {
  testimonial?: TestimonialLike | string | number | null
}

const isFullDoc = (value: unknown): value is TestimonialLike =>
  typeof value === 'object' && value !== null && 'quote' in (value as object)

export function TestimonialEmbed({ testimonial }: TestimonialEmbedProps) {
  if (!isFullDoc(testimonial)) return null
  const { quote, personName, personTitle, company } = testimonial
  if (!quote) return null
  return (
    <blockquote className="my-6 border-l-4 border-accent-strong pl-4 italic">
      <p>“{quote}”</p>
      {(personName || company) && (
        <footer className="mt-2 not-italic text-sm text-text-secondary">
          — {personName}
          {personTitle ? `, ${personTitle}` : ''}
          {company ? ` · ${company}` : ''}
        </footer>
      )}
    </blockquote>
  )
}

export default TestimonialEmbed
