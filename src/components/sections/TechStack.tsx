import Link from 'next/link'

interface Item {
  id?: string | null
  label: string
  linkUrl?: string | null
}

interface TechStackProps {
  heading?: string | null
  items: Item[]
}

export function TechStack({ heading, items }: TechStackProps) {
  return (
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md">
        <h2 className="text-h3 font-semibold">{heading ?? 'Technologies'}</h2>
        <ul className="mt-6 flex flex-wrap gap-2">
          {items.map((item, i) =>
            item.linkUrl ? (
              <li key={item.id ?? i}>
                <Link
                  href={item.linkUrl}
                  className="inline-block rounded-full border border-border-strong bg-surface px-4 py-1.5 text-small font-medium text-text-secondary hover:border-accent-strong hover:text-accent-strong"
                >
                  {item.label}
                </Link>
              </li>
            ) : (
              <li
                key={item.id ?? i}
                className="inline-block rounded-full border border-border-strong bg-surface-subtle px-4 py-1.5 text-small font-medium text-text-secondary"
              >
                {item.label}
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  )
}

export default TechStack
