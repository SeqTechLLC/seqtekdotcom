interface CalloutProps {
  tone?: 'info' | 'tip' | 'warning' | 'note' | null
  body?: string | null
}

const TONE_CLASSES: Record<NonNullable<CalloutProps['tone']>, string> = {
  info: 'border-blue-300 bg-blue-50 text-blue-900',
  tip: 'border-green-300 bg-green-50 text-green-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  note: 'border-slate-300 bg-slate-50 text-slate-900',
}

export function Callout({ tone = 'info', body }: CalloutProps) {
  if (!body) return null
  const cls = TONE_CLASSES[tone ?? 'info']
  return (
    <aside className={`my-6 rounded-md border px-4 py-3 ${cls}`} role="note">
      <p className="whitespace-pre-line">{body}</p>
    </aside>
  )
}

export default Callout
