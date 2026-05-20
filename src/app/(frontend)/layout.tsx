import React from 'react'
import { SkipToContent } from '@/components/layout/SkipToContent'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
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
        <SkipToContent />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
