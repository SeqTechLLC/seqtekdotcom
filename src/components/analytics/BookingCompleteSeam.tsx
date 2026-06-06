'use client'

import { useEffect } from 'react'

import { pushDataLayer, type AnalyticsEvent } from '@/lib/analytics/dataLayer'

/**
 * spec 008 US3 (T019) — `booking_complete` listener SEAM (contract D3).
 *
 * HubSpot Meetings reports a successful booking via a cross-window
 * `postMessage` (the `onMeetingBookSucceeded` meetings event). This island
 * defines the listener + the push shape, but `HubspotMeetings.tsx` is still a
 * PLACEHOLDER that does not load the real embed — so no window posts that
 * message today and emission stays gated on the embed landing (mirrors the
 * Meta-pixel deferral). The contract and listener shape are reviewable now.
 *
 * NOTE (go-live): confirm the exact message origin + payload shape against the
 * HubSpot Meetings embed API when the real embed is wired, and gate `origin`.
 */
export function BookingCompleteSeam({ meetingUrl }: { meetingUrl: string }) {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { meetingBookSucceeded?: boolean; event?: string } | null | undefined
      if (data?.meetingBookSucceeded || data?.event === 'onMeetingBookSucceeded') {
        pushDataLayer({ event: 'booking_complete', meetingUrl } satisfies AnalyticsEvent)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [meetingUrl])

  return null
}

export default BookingCompleteSeam
