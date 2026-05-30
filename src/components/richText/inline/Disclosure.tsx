interface DisclosureProps {
  summary?: string | null
  body?: string | null
}

export function Disclosure({ summary, body }: DisclosureProps) {
  if (!summary || !body) return null
  return (
    <details className="my-4 rounded-md border border-border px-4 py-2">
      <summary className="cursor-pointer font-medium">{summary}</summary>
      <p className="mt-2 whitespace-pre-line text-text-secondary">{body}</p>
    </details>
  )
}

export default Disclosure
