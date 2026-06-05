interface Item {
  id?: string | null
  label: string
}

interface DeliverablesProps {
  heading?: string | null
  items: Item[]
}

export function Deliverables({ heading, items }: DeliverablesProps) {
  return (
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md">
        {heading ? <h2 className="text-h3 font-semibold">{heading}</h2> : null}
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map((item, i) => (
            <li
              key={item.id ?? i}
              className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface px-4 py-3"
            >
              <span
                aria-hidden
                className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-accent-strong"
              />
              <span className="text-body">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Deliverables
