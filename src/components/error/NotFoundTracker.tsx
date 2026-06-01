'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// spec 004 T035 (ERROR_PAGES §2 / invariant E1). Pushes the 404 analytics
// event so marketing can see which dead URLs take traffic (usually a missing
// Wix redirect). Client-only — `window.dataLayer` is stamped by ConsentDefault.

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

export function NotFoundTracker() {
  const pathname = usePathname()
  useEffect(() => {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'page_not_found', path: pathname })
  }, [pathname])
  return null
}
