'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { SmartLink } from '@/components/ui/SmartLink'
import type { NavItem } from '@/lib/site-content'

import { NavCaret } from './NavCaret'

/**
 * ROADMAP NAV-1 — the desktop dropdown panels.
 *
 * Three things about the shape are deliberate:
 *
 * 1. **The top-level item stays a link, and the caret is a separate button.**
 *    Every axis has its own page (`/services` is today's), so turning the
 *    trigger into a button would strand that page behind a menu. Two controls
 *    with two accessible names is also the same row pattern a *linked group*
 *    needs, so there is one idea here rather than two.
 * 2. **Click to open, never hover-only.** Hover-only fails WCAG 2.2 §1.4.13
 *    and is simply broken on touch and hybrid laptops. Hover may be layered on
 *    top of click later; it is not a substitute for it.
 * 3. **It is a disclosure, not a modal.** No focus trap. Tab walks out of the
 *    panel and into the rest of the page, and leaving closes it.
 *
 * The column count is `groups.length`, taken straight from the data — see the
 * `NavPanel` docs in `site-content.ts` for why the group is the unit.
 */
export function PrimaryNav({ items }: { items: NavItem[] }) {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const caretRefs = useRef<(HTMLButtonElement | null)[]>([])

  const close = useCallback(() => setOpenIndex(null), [])

  // Click-outside closes. Bound only while something is open so the document
  // carries no listener in the common case.
  useEffect(() => {
    if (openIndex === null) return
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [openIndex, close])

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || openIndex === null) return
    // Escape returns focus to the control that opened the panel, so a keyboard
    // user is not dropped at the top of the document.
    const caret = caretRefs.current[openIndex]
    close()
    caret?.focus()
  }

  // Focus leaving the nav entirely closes the panel. `relatedTarget` is null
  // when focus goes to the browser chrome or the window loses it — leave the
  // panel open there rather than yanking it away mid-interaction.
  const onBlur = (event: React.FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null
    if (next && !event.currentTarget.contains(next)) close()
  }

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="hidden lg:flex"
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <ul className="flex items-center gap-1">
        {items.map((item, index) => {
          const panel = item.panel
          const open = openIndex === index
          const triggerId = `${baseId}-trigger-${index}`
          const panelId = `${baseId}-panel-${index}`

          return (
            <li key={item.url} className="relative">
              <div className="flex items-center">
                <SmartLink
                  id={triggerId}
                  href={item.url}
                  className="inline-flex h-10 items-center rounded-md px-3 text-body text-text-primary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
                >
                  {item.label}
                </SmartLink>
                {panel ? (
                  <button
                    type="button"
                    ref={(node) => {
                      caretRefs.current[index] = node
                    }}
                    aria-expanded={open}
                    aria-controls={panelId}
                    aria-label={`${item.label} menu`}
                    data-testid={`nav-caret-${index}`}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="-ml-1 inline-flex h-10 w-7 items-center justify-center rounded-md text-text-secondary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
                  >
                    <NavCaret open={open} />
                  </button>
                ) : null}
              </div>

              {panel ? (
                // `hidden` does the hiding, so no display utility may sit on
                // this element — a `grid`/`flex` class in the utilities layer
                // would win over the base `[hidden]` rule and the panel would
                // never close. The grid lives on the inner element.
                <div
                  id={panelId}
                  hidden={!open}
                  data-testid={`nav-panel-${index}`}
                  // `w-max` matters: the panel is absolutely positioned inside a
                  // list item barely wider than its own label, and without it
                  // shrink-to-fit clamps every column to its 10rem minimum and
                  // the longest leaf overflows its own box.
                  className="absolute left-0 top-full z-dropdown mt-1 w-max max-w-[min(80vw,56rem)] rounded-md border border-border-subtle bg-surface p-5 shadow-lg"
                >
                  <div
                    className="grid gap-x-10 gap-y-6"
                    style={{
                      gridTemplateColumns: `repeat(${panel.groups.length}, minmax(10rem, max-content))`,
                    }}
                  >
                    {panel.groups.map((group, groupIndex) => {
                      // One group means the trigger is already the heading;
                      // rendering the group title too would announce the same
                      // word twice and print it under itself.
                      const showTitle = panel.groups.length > 1
                      const groupId = `${panelId}-group-${groupIndex}`

                      return (
                        <div key={group.label}>
                          {showTitle ? (
                            group.url ? (
                              <SmartLink
                                id={groupId}
                                href={group.url}
                                onClick={close}
                                className="block text-eyebrow font-semibold uppercase text-text-primary transition-colors duration-fast hover:text-text-accent"
                              >
                                {group.label}
                              </SmartLink>
                            ) : (
                              <span
                                id={groupId}
                                className="block text-eyebrow font-semibold uppercase text-text-secondary"
                              >
                                {group.label}
                              </span>
                            )
                          ) : null}
                          <ul
                            aria-labelledby={showTitle ? groupId : triggerId}
                            className={`flex flex-col gap-1 ${showTitle ? 'mt-3' : ''}`}
                          >
                            {group.items.map((leaf) => (
                              <li key={leaf.url}>
                                <SmartLink
                                  href={leaf.url}
                                  onClick={close}
                                  className="block whitespace-nowrap rounded-md px-2 py-1.5 text-body text-text-secondary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
                                >
                                  {leaf.label}
                                </SmartLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
