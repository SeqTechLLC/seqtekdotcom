import React from 'react'
import type { Metadata } from 'next'
import { Nunito_Sans } from 'next/font/google'
import { SkipToContent } from '@/components/layout/SkipToContent'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { ConsentDefault } from '@/components/integrations/ConsentDefault'
import { GtmScript } from '@/components/integrations/GtmScript'
import { HubSpotTracking } from '@/components/integrations/HubSpotTracking'
import { LinkedInInsightTag } from '@/components/integrations/LinkedInInsightTag'
import { DEFAULT_DESCRIPTION } from '@/lib/metadata'
import './styles.css'

export const metadata: Metadata = {
  // Resolves the relative share-image path from the page metadata to an absolute URL, which
  // crawlers require. Pages render at request time, so the lane's runtime value is read.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100'),
  title: {
    default: 'SEQTEK',
    template: '%s | SEQTEK',
  },
  description: DEFAULT_DESCRIPTION,
}

// The brand face. next/font downloads it at build time and serves it from this
// origin, so no request reaches Google and `font-src 'self'` still holds. It
// sets `--font-nunito-sans` on <html>, which styles.css builds the families on.
const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-nunito-sans',
})

// Preconnect hints shave a round-trip off the first
// request to each third-party origin. Env-gated on the same vars as the
// loader scripts so unset dev/CI environments don't preconnect to nothing.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID
const HUBSPOT_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunitoSans.variable}>
      <head>
        {GTM_ID ? (
          <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
        ) : null}
        {HUBSPOT_ID ? (
          <>
            <link rel="preconnect" href="https://js.hs-scripts.com" crossOrigin="" />
            <link rel="preconnect" href="https://forms.hubspot.com" crossOrigin="" />
          </>
        ) : null}
      </head>
      <body className="flex min-h-screen flex-col">
        <ConsentDefault />
        <SkipToContent />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <GtmScript />
        <HubSpotTracking />
        <LinkedInInsightTag />
      </body>
    </html>
  )
}
