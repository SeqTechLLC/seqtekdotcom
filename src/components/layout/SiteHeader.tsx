import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { SmartLink } from '@/components/ui/SmartLink'
import { navigation, siteSettings } from '@/lib/site-content'
import { MobileNav } from './MobileNav'

export function SiteHeader() {
  const { mainNav, ctaButton } = navigation

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-sticky border-b border-border-subtle bg-surface"
    >
      <Container size="xl">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Link
            href="/"
            aria-label={siteSettings.companyName}
            className="flex shrink-0 items-center"
          >
            <Image
              src="/brand/Black-logo-w-o-tagline-transparent-background.png"
              alt={siteSettings.companyName}
              width={580}
              height={120}
              priority
              className="h-7 w-auto md:h-8"
            />
          </Link>

          <nav aria-label="Primary" className="hidden lg:flex">
            <ul className="flex items-center gap-1">
              {mainNav.map((item) => (
                <li key={item.url}>
                  <SmartLink
                    href={item.url}
                    className="inline-flex h-10 items-center rounded-md px-3 text-body text-text-primary transition-colors duration-fast hover:bg-surface-subtle hover:text-text-accent"
                  >
                    {item.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              href={ctaButton.url}
              size="sm"
              className="hidden md:inline-flex"
              cta={{ ctaId: 'header-cta', location: 'header' }}
            >
              {ctaButton.label}
            </Button>
            <MobileNav navItems={mainNav} ctaButton={ctaButton} />
          </div>
        </div>
      </Container>
    </header>
  )
}
