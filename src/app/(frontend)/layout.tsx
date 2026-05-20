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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
