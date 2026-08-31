'use client'

import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SmartLink } from '@/components/ui/SmartLink'
import type { NavGroup, NavItem } from '@/lib/site-content'

import { NavCaret } from './NavCaret'

type MobileNavProps = {
  navItems: NavItem[]
  ctaButton: { label: string; url: string }
}

/**
 * ROADMAP NAV-1 — the mobile half of the dropdown panels.
 *
 * This list used to render one level of children permanently expanded, which
 * made a long menu unusable the moment the service list grows. It is now a set
 * of disclosures over the same `panel` data the desktop nav reads, so the two
 * viewports cannot drift.
 *
 * There are two row patterns, and the second one exists because
 * `NavGroup.url` is optional:
 *
 * - **Headless** (no URL) — one caret button whose accessible name is the
 *   group. Cheap, and the common case.
 * - **Linked** (has a URL) — the group link *plus* a separate caret button,
 *   each with its own accessible name. A link nested inside a `<summary>`, or
 *   a single control that both navigates and toggles, is ambiguous to operate
 *   and handled inconsistently by assistive tech.
 *
 * Same single-group rule as the desktop panel: with one group the top-level
 * row is already the heading, so the group title is not repeated. Group titles
 * are labelled spans/links rather than headings, for the reasons in
 * `PrimaryNav`.
 */
export function MobileNav({ navItems, ctaButton }: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const baseId = useId()
  // Deliberately component state rather than dialog state: a group the user
  // opened stays open the next time they pull the drawer out. Reopening to the
  // section you were just in beats collapsing everything on every close.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const open = () => dialogRef.current?.showModal()
  const close = () => dialogRef.current?.close()

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  // T137 / spec 003 Polish. The native `<dialog>` element fires `click`
  // events where `event.target === dialog` only when the user clicks the
  // backdrop (the inner panel has its own bounding box and is the event
  // target there). No need for the prior `getBoundingClientRect` math +
  // useEffect listener — handle it inline on the dialog itself.
  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) dialogRef.current.close()
  }

  const renderLeaves = (items: NavItem[]) => (
    <ul className="flex flex-col gap-1">
      {items.map((leaf) => (
        <li key={leaf.url}>
          <SmartLink
            href={leaf.url}
            onClick={close}
            className="block rounded-md px-3 py-1.5 text-body text-text-secondary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-primary"
          >
            {leaf.label}
          </SmartLink>
        </li>
      ))}
    </ul>
  )

  const renderGroup = (group: NavGroup, key: string) => {
    const isOpen = expanded[key] ?? false
    const regionId = `${key}-region`

    return (
      <div key={group.label} className="mt-1">
        <div className="flex items-center justify-between gap-1">
          {group.url ? (
            <SmartLink
              href={group.url}
              onClick={close}
              className="flex-1 rounded-md px-3 py-1.5 text-body font-medium text-text-primary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
            >
              {group.label}
            </SmartLink>
          ) : (
            <span className="flex-1 px-3 py-1.5 text-eyebrow font-semibold uppercase text-text-secondary">
              {group.label}
            </span>
          )}
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={regionId}
            aria-label={`${group.label} links`}
            onClick={() => toggle(key)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
          >
            <NavCaret open={isOpen} />
          </button>
        </div>
        {/* No display utility on the hidden wrapper — see PrimaryNav. */}
        <div
          id={regionId}
          hidden={!isOpen}
          className="ml-3 mt-1 border-l border-border-subtle pl-3"
        >
          {renderLeaves(group.items)}
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Open menu"
        aria-haspopup="dialog"
        data-testid="mobile-menu-trigger"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-primary transition-colors duration-fast hover:bg-surface-subtle lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Mobile navigation"
        data-testid="mobile-menu"
        onClick={onBackdropClick}
        className="m-0 ml-auto h-full max-h-none w-[min(85vw,360px)] max-w-none bg-surface p-0 text-text-primary shadow-xl backdrop:bg-neutral-900/40"
      >
        <div className="flex h-screen flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <span className="text-h4 font-semibold">Menu</span>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              data-testid="mobile-menu-close"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-primary transition-colors duration-fast hover:bg-surface-subtle"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          <nav aria-label="Mobile primary" className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="flex flex-col gap-1">
              {navItems.map((item, index) => {
                const panel = item.panel
                const key = `${baseId}-${index}`
                const isOpen = expanded[key] ?? false
                const regionId = `${key}-region`
                const singleGroup = panel?.groups.length === 1

                return (
                  <li key={item.url}>
                    <div className="flex items-center justify-between gap-1">
                      <SmartLink
                        href={item.url}
                        onClick={close}
                        className="flex-1 rounded-md px-3 py-2 text-body-lg font-medium text-text-primary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
                      >
                        {item.label}
                      </SmartLink>
                      {panel ? (
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={regionId}
                          aria-label={`${item.label} menu`}
                          data-testid={`mobile-nav-caret-${index}`}
                          onClick={() => toggle(key)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
                        >
                          <NavCaret open={isOpen} />
                        </button>
                      ) : null}
                    </div>

                    {panel ? (
                      <div
                        id={regionId}
                        hidden={!isOpen}
                        data-testid={`mobile-nav-panel-${index}`}
                        className="ml-3 mt-1 border-l border-border-subtle pl-3"
                      >
                        {/* One group: the row above is already the heading, so
                            the leaves sit directly under it. More than one:
                            each group is its own disclosure. */}
                        {singleGroup
                          ? renderLeaves(panel.groups[0].items)
                          : panel.groups.map((group, groupIndex) =>
                              renderGroup(group, `${key}-group-${groupIndex}`),
                            )}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="border-t border-border-subtle p-4">
            <Button
              href={ctaButton.url}
              size="md"
              className="w-full"
              onClick={close}
              cta={{ ctaId: 'mobile-nav-cta', location: 'mobile-nav' }}
            >
              {ctaButton.label}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  )
}
