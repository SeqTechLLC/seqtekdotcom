'use client'

import { useId, useRef, useState } from 'react'

interface Tab {
  id?: string | null
  label: string
  body: string
}

interface TabsProps {
  heading?: string | null
  tabs: Tab[]
}

/**
 * ROADMAP INERT-2 — this block is called "tabs" and used to draw jump links
 * over a stack in which every panel was visible, so the name promised
 * something the page did not do. It now shows one panel at a time.
 *
 * Keyboard behaviour follows the ARIA tabs pattern: left/right move between
 * tabs, home/end jump to the ends, and only the selected tab is in the tab
 * order so a keyboard user tabs past the strip into the panel rather than
 * through every label.
 */
export function Tabs({ heading, tabs }: TabsProps) {
  const [active, setActive] = useState(0)
  const base = useId()
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  if (tabs.length === 0) return null

  const select = (index: number) => {
    const next = (index + tabs.length) % tabs.length
    setActive(next)
    buttons.current[next]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next)
  }

  return (
    <section className="px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? (
          <h2 id={`${base}-heading`} className="text-h3 font-semibold">
            {heading}
          </h2>
        ) : null}
        <div
          role="tablist"
          // Point at the visible heading rather than copying it: an aria-label
          // here makes a screen reader announce the same string twice, once for
          // the <h2> and again for the tablist.
          aria-labelledby={heading ? `${base}-heading` : undefined}
          aria-label={heading ? undefined : 'Sections'}
          className="mt-6 flex flex-wrap gap-2 border-b border-border-subtle"
        >
          {tabs.map((t, i) => {
            const selected = i === active
            return (
              <button
                key={t.id ?? i}
                ref={(el) => {
                  buttons.current[i] = el
                }}
                type="button"
                role="tab"
                id={`${base}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${base}-panel-${i}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(event) => onKeyDown(event, i)}
                className={`-mb-px rounded-t-md border-b-2 px-3 py-2 text-small font-medium transition ${
                  selected
                    ? 'border-accent-strong text-text-primary'
                    : 'border-transparent text-text-secondary hover:border-border-strong hover:text-text-primary'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        {tabs.map((t, i) => (
          <div
            key={t.id ?? i}
            role="tabpanel"
            id={`${base}-panel-${i}`}
            aria-labelledby={`${base}-tab-${i}`}
            tabIndex={0}
            hidden={i !== active}
            className="mt-6"
          >
            <p className="text-body text-text-secondary">{t.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Tabs
