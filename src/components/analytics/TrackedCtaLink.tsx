'use client'

import Link from 'next/link'
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'

import { pushDataLayer, type AnalyticsEvent } from '@/lib/analytics/dataLayer'

/**
 * spec 008 US3 (T017) — the single client surface that emits `cta_click`
 * (contract D1, FR-008). Every primary-CTA surface (Button-as-CTA, CtaSection,
 * ContactCta, InlineCta) renders through this so there is ONE push path
 * (INV-1). Mirrors Button's internal-vs-external link logic so it is a drop-in.
 *
 * Non-blocking: the push runs on click but never prevents/awaits navigation,
 * and a thrown push can never swallow the click (try/catch). A forwarded
 * `onClick` (e.g. the mobile-nav drawer close) still runs.
 */

function isInternalHref(href: string): boolean {
  return (
    !/^https?:\/\//i.test(href) &&
    !href.startsWith('//') &&
    !href.startsWith('mailto:') &&
    !href.startsWith('tel:')
  )
}

interface TrackedCtaLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'onClick' | 'className'
> {
  href: string
  /** Stable identifier (not the editable label) — GTM trigger key. */
  ctaId: string
  /** Coarse placement, e.g. `header`, `cta-section`, `contact-cta`. */
  location: string
  /** Human text for GTM Preview readability; falls back to string children. */
  label?: string
  className?: string
  /** Forwarded to next/link; omit to keep the default prefetch behavior. */
  prefetch?: boolean
  /** Match Button's external behavior (open in a new tab) when external. */
  newTab?: boolean
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  children: ReactNode
}

export function TrackedCtaLink({
  href,
  ctaId,
  location,
  label,
  className,
  prefetch,
  newTab,
  onClick,
  children,
  ...rest
}: TrackedCtaLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    try {
      pushDataLayer({
        event: 'cta_click',
        ctaId,
        label: label ?? (typeof children === 'string' ? children : ctaId),
        location,
        href,
      } satisfies AnalyticsEvent)
    } catch {
      // analytics must never break a navigation
    }
    onClick?.(e)
  }

  if (isInternalHref(href)) {
    return (
      <Link
        href={href}
        prefetch={prefetch}
        className={className}
        data-cta-id={ctaId}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </Link>
    )
  }

  return (
    <a
      href={href}
      className={className}
      data-cta-id={ctaId}
      onClick={handleClick}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}

export default TrackedCtaLink
