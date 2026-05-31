import React from 'react'
import { SkipToContent } from '@/components/layout/SkipToContent'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { ConsentDefault } from '@/components/integrations/ConsentDefault'
import { GtmScript } from '@/components/integrations/GtmScript'
import { HubSpotTracking } from '@/components/integrations/HubSpotTracking'
import './styles.css'

export const metadata = {
  title: {
    default: 'SEQTEK',
    template: '%s | SEQTEK',
  },
  description: 'Delivering Transformative Technologies Since 1999',
}

// T135 / spec 003 Polish. Preconnect hints shave a round-trip off the first
// request to each third-party origin. Env-gated on the same vars as the
// loader scripts so unset dev/CI environments don't preconnect to nothing.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID
const HUBSPOT_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
      </body>
    </html>
  )
}
