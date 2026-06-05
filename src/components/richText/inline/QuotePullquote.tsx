interface QuotePullquoteProps {
  quote?: string | null
  attribution?: string | null
}

export function QuotePullquote({ quote, attribution }: QuotePullquoteProps) {
  if (!quote) return null
  return (
    <blockquote className="my-8 border-l-4 border-accent-strong pl-6 text-2xl font-semibold">
      <p>“{quote}”</p>
      {attribution ? (
        <footer className="mt-2 text-sm font-normal text-text-secondary">— {attribution}</footer>
      ) : null}
    </blockquote>
  )
}

export default QuotePullquote
