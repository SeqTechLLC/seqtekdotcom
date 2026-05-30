interface HubspotMeetingsProps {
  meetingUrl: string
  heading?: string | null
}

export function HubspotMeetings({ meetingUrl, heading }: HubspotMeetingsProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md">
        {heading ? <h2 className="text-h2 font-bold">{heading ?? 'Book a time'}</h2> : null}
        <div className="mt-8 rounded-md border border-border-strong bg-surface-subtle p-8 text-center">
          <p className="text-caption uppercase tracking-wide text-accent">HubSpot Meetings</p>
          <p className="mt-2 text-body-lg font-semibold">Embedded scheduler</p>
          <p className="mt-2 text-small text-text-muted">{meetingUrl}</p>
          <p className="mt-4 text-caption text-text-muted">
            HubSpot meetings widget loads in production via the HubSpotTracking integration.
          </p>
        </div>
      </div>
    </section>
  )
}

export default HubspotMeetings
