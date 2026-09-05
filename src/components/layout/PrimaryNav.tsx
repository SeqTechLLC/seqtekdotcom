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
 *    Every axis has its own page (`/services/what-we-do` and
 *    `/services/how-we-work`), so turning the trigger into a button would
 *    strand that page behind a menu. Two controls
 *    with two accessible names is also the same row pattern a *linked group*
 *    needs, so there is one idea here rather than two.
 * 2. **Click to open, never hover-only.** Hover-only fails WCAG 2.2 §1.4.13
 *    and is simply broken on touch and hybrid laptops. Hover may be layered on
 *    top of click later; it is not a substitute for it.
 * 3. **It is a disclosure, not a modal.** No focus trap. Tab walks out of the
 *    panel and into the rest of the page, and leaving closes it.
 *
 * A group title is a labelled `<span>`/`<a>`, never a heading. `aria-labelledby`
 * does not need a heading to point at, and a column label in the site chrome is
 * not a section of the document — putting an `<h2>` above the page's own `<h1>`
 * would misstate the outline on every route. Note this is a judgement, not
 * something a test forces: `a11y.e2e.spec.ts` only rejects *downward* heading
 * jumps, so header-`h2` → page-`h1` would pass it, and axe's `heading-order` is
 * `best-practice`, which `AXE_TAGS` excludes.
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

  // Click-outside and Escape close. Both are bound on the document, and only
  // while something is open, so nothing is listening in the common case.
  //
  // Escape is document-level rather than bound to the `<nav>` for a reason:
  // Safari and Firefox on macOS do not move focus to a `<button>` when it is
  // clicked, so after a mouse-open there is nothing focused inside the nav for
  // a nav-scoped handler to fire on, and the panel would not be dismissible by
  // keyboard on those browsers. CI runs chromium only and cannot see it.
  useEffect(() => {
    if (openIndex === null) return

    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Focus goes back to the control that opened the panel — but only if it
      // was in the nav to begin with. On a mouse-open in Safari/Firefox focus
      // never entered the nav, so the user may have tabbed well past it by
      // now; pulling them back to the caret would be worse than leaving them
      // where they are.
      const restoreFocus = navRef.current?.contains(document.activeElement)
      const caret = caretRefs.current[openIndex]
      close()
      if (restoreFocus) caret?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openIndex, close])

  // Focus leaving the nav entirely closes the panel. `relatedTarget` is null
  // when focus goes to the browser chrome or the window loses it — leave the
  // panel open there rather than yanking it away mid-interaction.
  const onBlur = (event: React.FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null
    if (next && !event.currentTarget.contains(next)) close()
  }

  return (
    <nav ref={navRef} aria-label="Primary" className="hidden xl:flex" onBlur={onBlur}>
      <ul className="flex items-center gap-1">
        {items.map((item, index) => {
          const panel = item.panel
          const open = openIndex === index
          const triggerId = `${baseId}-trigger-${index}`
          const panelId = `${baseId}-panel-${index}`

          return (
            <li key={item.url} className="relative">
              <div className="flex items-center">
                {/* `onClick={close}` is not optional here. `SiteHeader` sits in
                    the persistent frontend layout, so this component is not
                    remounted across a route change and `openIndex` survives it
                    — without this the panel hangs over the page the trigger
                    itself just navigated to. Every other link in the panel, and
                    the equivalent row in `MobileNav`, closes the same way. */}
                <SmartLink
                  id={triggerId}
                  href={item.url}
                  onClick={close}
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
                // this element. Tailwind's preflight supplies
                // `[hidden]:where(:not([hidden="until-found"])){display:none}`
                // in the BASE layer; `.grid`/`.flex` match with the same
                // specificity from the utilities layer, which comes later and
                // therefore wins, and the panel would never close. The grid
                // lives on the inner element. `navPanels.int.spec.tsx` asserts
                // this element carries no display class, because the int
                // environment loads no CSS and cannot catch it any other way.
                <div
                  id={panelId}
                  hidden={!open}
                  data-testid={`nav-panel-${index}`}
                  // `w-max` matters: the panel is absolutely positioned inside a
                  // list item barely wider than its own label, and without it
                  // shrink-to-fit clamps every column to its 10rem minimum and
                  // the longest leaf overflows its own box.
                  //
                  // The cap is 62vw, not 80vw. The panel is anchored to its
                  // trigger, so its left edge sits ~32-36% into the viewport and
                  // the space actually available to the right is ~63-67vw, not
                  // 80. With Brent's three groups this is the first data wide
                  // enough to hit that: an 80vw cap put the panel's right edge
                  // at 1142px in a 1024px window and grew
                  // `document.scrollWidth` to 1142 — a horizontal scrollbar on
                  // every page.
                  //
                  // That measurement was taken at the old `lg` boundary. IND-1
                  // moved the desktop nav to `xl`, so no panel renders below
                  // 1280 any more and the 1024 case is unreachable — 1280 is
                  // the narrowest window a panel opens in now, and the cap is
                  // verified there and at 1440 by `layout.e2e.spec.ts`.
                  className="absolute left-0 top-full z-dropdown mt-1 w-max max-w-[min(62vw,56rem)] rounded-md border border-border-subtle bg-surface p-5 shadow-lg"
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
                                  // No `whitespace-nowrap`: with the cap above,
                                  // a long leaf ("Data Engineering and
                                  // Warehousing") would be clipped by its own
                                  // column rather than wrapping. Wrapping to two
                                  // lines is the lesser evil, and only happens
                                  // at the narrow end.
                                  className="block rounded-md px-2 py-1.5 text-body text-text-secondary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
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
