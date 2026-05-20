import Link from 'next/link'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

type SmartLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  children: ReactNode
  /** Force external behavior even if the href looks internal. */
  external?: boolean
}

function isExternalHref(href: string): boolean {
  return (
    /^https?:\/\//i.test(href) ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  )
}

export function SmartLink({ href, children, external, ...rest }: SmartLinkProps) {
  const treatAsExternal = external ?? isExternalHref(href)

  if (treatAsExternal) {
    const isProtocolLink = href.startsWith('mailto:') || href.startsWith('tel:')
    return (
      <a
        href={href}
        target={isProtocolLink ? undefined : '_blank'}
        rel={isProtocolLink ? undefined : 'noopener noreferrer'}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  )
}
