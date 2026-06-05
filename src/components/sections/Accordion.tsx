interface AccordionItem {
  id?: string | null
  title: string
  body: string
}

interface AccordionProps {
  heading?: string | null
  items: AccordionItem[]
}

export function Accordion({ heading, items }: AccordionProps) {
  return (
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md">
        {heading ? <h2 className="text-h3 font-semibold">{heading}</h2> : null}
        <ul className="mt-6 divide-y divide-border-subtle border-y border-border-subtle">
          {items.map((item, i) => (
            <li key={item.id ?? i}>
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between py-3 text-body font-semibold">
                  <span>{item.title}</span>
                  <span className="ml-4 text-accent-strong transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <p className="pb-3 text-body text-text-secondary">{item.body}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Accordion
