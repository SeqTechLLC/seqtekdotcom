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
      <div className="mx-auto max-w-container-md">
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
    </section>
  )
}

export default KeyTakeaways
