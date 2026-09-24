'use client'

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface TabSetItem {
  key: string | number
  label: string
  /** Rendered by the server (rich text), handed over as a finished node. */
  panel: ReactNode
}

interface TabSetProps {
  items: TabSetItem[]
  /** Id of the visible heading that names the strip, when there is one. */
  labelledBy?: string
  /** On the dark band the unselected labels and rule need light colours. */
  inverse?: boolean
  className?: string
}

/**
 * One panel at a time, following the ARIA tabs pattern: left/right move
 * between tabs and wrap at the ends, home/end jump to them, and only the
 * selected tab is in the tab order, so a keyboard user tabs past the strip
 * into the panel rather than through every label. Ported from the retired
 * `tabs` block (ROADMAP INERT-2).
 */
export function TabSet({ items, labelledBy, inverse = false, className }: TabSetProps) {
  const [active, setActive] = useState(0)
  const base = useId()
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  if (items.length === 0) return null

  // Live preview replaces props on the mounted tree (`Pages` has it enabled),
  // so deleting the selected tab can leave `active` past the end: every panel
  // hidden and no tab holding tabIndex={0}, which drops the strip out of the
  // tab order. Clamp rather than trust the index.
  const current = Math.min(active, items.length - 1)

  const select = (index: number) => {
    const next = (index + items.length) % items.length
    setActive(next)
    buttons.current[next]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next)
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        // Point at the visible heading rather than copying it: an aria-label
        // here makes a screen reader announce the same string twice, once for
        // the <h2> and again for the tablist.
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : 'Sections'}
        className={cn(
          'flex flex-wrap gap-2 border-b',
          inverse ? 'border-neutral-700' : 'border-border-subtle',
        )}
      >
        {items.map((item, i) => {
          const selected = i === current
          return (
            <button
              key={item.key}
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
              className={cn(
                '-mb-px rounded-t-md border-b-2 px-3 py-2 text-small font-medium transition',
                selected
                  ? cn('border-accent-strong', inverse ? 'text-white' : 'text-text-primary')
                  : inverse
                    ? 'border-transparent text-neutral-300 hover:border-neutral-500 hover:text-white'
                    : 'border-transparent text-text-secondary hover:border-border-strong hover:text-text-primary',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {items.map((item, i) => (
        <div
          key={item.key}
          role="tabpanel"
          id={`${base}-panel-${i}`}
          aria-labelledby={`${base}-tab-${i}`}
          tabIndex={0}
          hidden={i !== current}
          className="mt-6"
        >
          {item.panel}
        </div>
      ))}
    </div>
  )
}

export default TabSet
