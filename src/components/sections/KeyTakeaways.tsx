interface Item {
  id?: string | null
  label: string
}

interface KeyTakeawaysProps {
  heading?: string | null
  items: Item[]
}

export function KeyTakeaways({ heading, items }: KeyTakeawaysProps) {
  return (
    <section className="bg-surface-subtle px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-xl">
        {/* DESIGN_SYSTEM §11.4: the takeaway labels are body copy, so they take
            the 65ch measure, and the heading travels inside the same centred
            column rather than sitting full-rail above it. */}
        <div className="mx-auto max-w-prose">
          <h2 className="text-h2 font-bold">{heading ?? 'Key takeaways'}</h2>
          <ol className="mt-8 space-y-4">
            {items.map((item, i) => (
              <li key={item.id ?? i} className="flex items-start gap-4">
                <span className="text-h3 font-bold text-accent-strong">{i + 1}.</span>
                <span className="text-body-lg">{item.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default KeyTakeaways
