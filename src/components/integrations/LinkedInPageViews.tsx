'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

// The Insight Tag counts a page view only when it loads, so client-side
// navigations would never reach LinkedIn's URL-based conversions (Contact,
// Careers, Services). `lintrk('track')` with no conversion ID is a page view.
// The first path is skipped: the tag's own load already counted it.
export function LinkedInPageViews() {
  const pathname = usePathname()
  const previous = useRef<string | null>(null)
  useEffect(() => {
    if (previous.current !== null && previous.current !== pathname) {
      window.lintrk?.('track')
    }
    previous.current = pathname
  }, [pathname])
  return null
}
