'use client'

import { useEffect, useRef } from 'react'

import { pushDataLayer, type AnalyticsEvent } from '@/lib/analytics/dataLayer'

/**
 * spec 008 US3 (T018) — fire-once `case_study_view` island (contract D2). The
 * case-study detail page is a Server Component; this `'use client'` child emits
 * exactly once on mount. The ref guard makes it idempotent under React Strict
 * Mode's dev double-invoke (setup/cleanup/setup runs on the SAME instance, so
 * the ref persists) and across client re-renders (data-model §A INV).
 */
export function TrackView({ slug, title }: { slug: string; title: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    pushDataLayer({ event: 'case_study_view', slug, title } satisfies AnalyticsEvent)
    // Mount-once: slug/title are stable for a given page view; the ref guards
    // re-fires regardless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default TrackView
