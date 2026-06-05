interface Tab {
  id?: string | null
  label: string
  body: string
}

interface TabsProps {
  heading?: string | null
  tabs: Tab[]
}

// Server-rendered static representation: labels as anchors, all panels
// visible. Phase 3 can ship a client-side variant when an actual tab strip
// is desired (use of <ViewTransition> is a reasonable upgrade path).
export function Tabs({ heading, tabs }: TabsProps) {
  return (
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md">
        {heading ? <h2 className="text-h3 font-semibold">{heading}</h2> : null}
        <nav aria-label="Tabs" className="mt-6 flex flex-wrap gap-2 border-b border-border-subtle">
          {tabs.map((t, i) => (
            <a
              key={t.id ?? i}
              href={`#tab-${t.id ?? i}`}
              className="rounded-t-md border-b-2 border-transparent px-3 py-2 text-small font-medium text-text-secondary hover:border-accent-strong hover:text-text-primary"
            >
              {t.label}
            </a>
          ))}
        </nav>
        <div className="mt-6 space-y-8">
          {tabs.map((t, i) => (
            <div key={t.id ?? i} id={`tab-${t.id ?? i}`}>
              <h3 className="text-h4 font-semibold">{t.label}</h3>
              <p className="mt-2 text-body text-text-secondary">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Tabs
