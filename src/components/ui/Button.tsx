import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-base ease-transition disabled:cursor-not-allowed'

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-strong text-text-inverse shadow-xs hover:bg-accent-hover active:bg-accent-pressed disabled:bg-neutral-200 disabled:text-text-muted disabled:shadow-none',
  secondary:
    'bg-brand-navy-700 text-text-inverse shadow-xs hover:bg-brand-navy-800 active:bg-brand-navy-900',
  ghost: 'border border-border-strong bg-transparent text-text-primary hover:bg-surface-subtle',
  link: 'p-0 text-link underline-offset-4 hover:underline hover:text-link-hover',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-small',
  md: 'h-11 px-5 text-body',
  lg: 'h-12 px-6 text-body-lg',
}

/** Opt a link-mode Button into `cta_click` tracking (spec 008 US3, T017). */
export type ButtonCta = { ctaId: string; location: string; label?: string }

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  className?: string
  /** When set on a link-mode Button, emit `cta_click` via TrackedCtaLink. */
  cta?: ButtonCta
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: never
  }

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    href: string
  }

export type ButtonProps = ButtonAsButton | ButtonAsLink

function isInternalHref(href: string): boolean {
  return (
    !/^https?:\/\//i.test(href) &&
    !href.startsWith('//') &&
    !href.startsWith('mailto:') &&
    !href.startsWith('tel:')
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  cta,
  ...rest
}: ButtonProps) {
  const classes = cn(base, variantClass[variant], variant !== 'link' && sizeClass[size], className)

  if ('href' in rest && rest.href) {
    const { href, ...anchorProps } = rest

    // CTA-tracked link: route through the single `cta_click` emitter, keeping
    // Button's internal/external + prefetch={false} behavior (TrackedCtaLink
    // mirrors it). A forwarded onClick (e.g. mobile-nav close) still runs.
    if (cta) {
      return (
        <TrackedCtaLink
          href={href}
          ctaId={cta.ctaId}
          location={cta.location}
          label={cta.label ?? (typeof children === 'string' ? children : undefined)}
          className={classes}
          prefetch={false}
          newTab
          {...anchorProps}
        >
          {children}
        </TrackedCtaLink>
      )
    }

    if (isInternalHref(href)) {
      // prefetch={false}: the header/mobile CTA points at /contact/book-a-call,
      // which isn't built yet — prefetching it 404s and dings the Lighthouse
      // best-practices gate (console errors). See SmartLink for the rationale.
      return (
        <Link href={href} prefetch={false} className={classes} {...anchorProps}>
          {children}
        </Link>
      )
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...anchorProps}>
        {children}
      </a>
    )
  }

  const { type = 'button', ...buttonProps } = rest as ButtonAsButton
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
