import { BookingCompleteSeam } from '@/components/analytics/BookingCompleteSeam'

interface HubspotMeetingsProps {
  meetingUrl: string
  heading?: string | null
}

/**
 * ROADMAP INERT-2 — this used to draw a bordered box printing the raw meeting
 * URL and "HubSpot meetings widget loads in production", which is developer
 * copy on a public page for a widget no code in this repo ever loaded.
 *
 * It now sends the visitor to the real scheduler. An inline iframe embed would
 * mean shipping HubSpot's `MeetingsEmbedCode.js` and widening the CSP
 * (INTEGRATIONS.md §8) for a block with no live instances; a link books the
 * meeting today and can be upgraded to the inline embed later without
 * changing the block's fields. `BookingCompleteSeam` stays wired for that.
 */
export function HubspotMeetings({ meetingUrl, heading }: HubspotMeetingsProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      {/* booking_complete seam (spec 008 US3, contract D3) — dormant until the
          inline Meetings embed posts onMeetingBookSucceeded. */}
      <BookingCompleteSeam meetingUrl={meetingUrl} />
      <div className="mx-auto max-w-container-lg">
        <h2 className="text-h2 font-bold">{heading ?? 'Book a time'}</h2>
        <div className="mt-8 rounded-md border border-border-subtle bg-surface-subtle p-8 text-center">
          <p className="text-body-lg text-text-secondary">
            Pick a slot that suits you and we will send the invitation.
          </p>
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-md bg-accent-strong px-5 py-3 font-medium text-white"
          >
            See available times
          </a>
        </div>
      </div>
    </section>
  )
}

export default HubspotMeetings
