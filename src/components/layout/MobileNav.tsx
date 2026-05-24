'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { SmartLink } from '@/components/ui/SmartLink'
import type { NavItem } from '@/lib/site-content'

type MobileNavProps = {
  navItems: NavItem[]
  ctaButton: { label: string; url: string }
}

export function MobileNav({ navItems, ctaButton }: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  const open = () => dialogRef.current?.showModal()
  const close = () => dialogRef.current?.close()

  // Close on backdrop (outside the dialog rect) click.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const onClick = (event: MouseEvent) => {
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      if (!inside) dialog.close()
    }

    dialog.addEventListener('click', onClick)
    return () => dialog.removeEventListener('click', onClick)
  }, [])

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
              {navItems.map((item) => (
                <li key={item.url}>
                  <SmartLink
                    href={item.url}
                    onClick={close}
                    className="block rounded-md px-3 py-2 text-body-lg font-medium text-text-primary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
                  >
                    {item.label}
                  </SmartLink>
                  {item.children?.length ? (
                    <ul className="ml-3 mt-1 flex flex-col gap-1 border-l border-border-subtle pl-3">
                      {item.children.map((child) => (
                        <li key={child.url}>
                          <SmartLink
                            href={child.url}
                            onClick={close}
                            className="block rounded-md px-3 py-1.5 text-body text-text-secondary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-primary"
                          >
                            {child.label}
                          </SmartLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-border-subtle p-4">
            <Button href={ctaButton.url} size="md" className="w-full" onClick={close}>
              {ctaButton.label}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  )
}
