import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'
import { navigation, siteSettings } from '@/lib/site-content'

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3v9zM6.5 8.25A1.75 1.75 0 1 1 8.25 6.5 1.75 1.75 0 0 1 6.5 8.25zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19a.66.66 0 0 0 0 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.48A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12C4.5 20.4 12 20.4 12 20.4s7.5 0 9.4-.48a3 3 0 0 0 2.1-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.6 15.6V8.4l6.24 3.6z" />
    </svg>
  )
}

export function SiteFooter() {
  const { footerNav, legalNav } = navigation
  const { companyName, tagline, phone, socialLinks, footerText } = siteSettings
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : ''

  return (
    <footer data-testid="site-footer" className="bg-surface-inverse text-text-inverse">
      <Container size="xl">
        <div className="grid gap-10 py-12 md:grid-cols-2 md:py-16 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" aria-label={companyName} className="inline-block">
              <Image
                src="/brand/White SEQTEK Logo-Transparent.png"
                alt={companyName}
                width={580}
                height={160}
                className="h-14 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-small text-text-inverse opacity-80">{tagline}</p>
            {telHref ? (
              <SmartLink
                href={telHref}
                className="mt-6 inline-block text-body text-text-inverse transition-colors duration-fast hover:text-brand-green-400"
              >
                {phone}
              </SmartLink>
            ) : null}
            <ul className="mt-6 flex gap-3">
              {socialLinks.linkedinUrl ? (
                <li>
                  <SmartLink
                    href={socialLinks.linkedinUrl}
                    aria-label={`${companyName} on LinkedIn`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-inverse opacity-80 transition-opacity duration-fast hover:opacity-100"
                  >
                    <LinkedInIcon />
                  </SmartLink>
                </li>
              ) : null}
              {socialLinks.facebookUrl ? (
                <li>
                  <SmartLink
                    href={socialLinks.facebookUrl}
                    aria-label={`${companyName} on Facebook`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-inverse opacity-80 transition-opacity duration-fast hover:opacity-100"
                  >
                    <FacebookIcon />
                  </SmartLink>
                </li>
              ) : null}
              {socialLinks.youtubeUrl ? (
                <li>
                  <SmartLink
                    href={socialLinks.youtubeUrl}
                    aria-label={`${companyName} on YouTube`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-inverse opacity-80 transition-opacity duration-fast hover:opacity-100"
                  >
                    <YouTubeIcon />
                  </SmartLink>
                </li>
              ) : null}
            </ul>
          </div>

          {footerNav.map((column) => (
            <nav key={column.label} aria-label={`${column.label} links`} className="lg:col-span-1">
              <h2 className="text-small font-semibold uppercase tracking-wide text-text-inverse opacity-80">
                {column.label}
              </h2>
              <ul className="mt-4 space-y-2">
                {column.children?.map((item) => (
                  <li key={item.url}>
                    <SmartLink
                      href={item.url}
                      className="text-body text-text-inverse opacity-90 transition-colors duration-fast hover:text-brand-green-400 hover:opacity-100"
                    >
                      {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-neutral-800 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-small text-text-inverse opacity-70">{footerText}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-small">
            {legalNav.map((item) => (
              <li key={item.url}>
                <SmartLink
                  href={item.url}
                  className="text-text-inverse opacity-70 transition-opacity duration-fast hover:opacity-100"
                >
                  {item.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  )
}
