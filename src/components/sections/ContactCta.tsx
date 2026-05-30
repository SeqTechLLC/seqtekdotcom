import Link from 'next/link'

type Cta = { label?: string | null; url?: string | null } | null

interface ContactCtaProps {
  heading: string
  body?: string | null
  primaryCta?: Cta
  secondaryCta?: Cta
  meetingUrl?: string | null
}

export function ContactCta({
  heading,
  body,
  primaryCta,
  secondaryCta,
  meetingUrl,
}: ContactCtaProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-container-lg gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-h2 font-bold">{heading}</h2>
          {body ? <p className="mt-4 text-body-lg text-text-secondary">{body}</p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {primaryCta?.label && primaryCta?.url ? (
              <Link
                href={primaryCta.url}
                className="rounded-md bg-accent px-5 py-3 font-medium text-white"
              >
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta?.label && secondaryCta?.url ? (
              <Link href={secondaryCta.url} className="font-medium underline">
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="rounded-md border border-border-subtle bg-surface-subtle p-6 text-center">
          {meetingUrl ? (
            <>
              <p className="text-caption uppercase tracking-wide text-accent">Book a time</p>
              <p className="mt-2 text-body-lg font-semibold">HubSpot Meetings embed</p>
              <p className="mt-1 text-small text-text-muted">{meetingUrl}</p>
            </>
          ) : (
            <>
              <p className="text-caption uppercase tracking-wide text-text-muted">Alternative</p>
              <p className="mt-2 text-body">
                Configure a HubSpot meetings URL to embed the scheduler.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default ContactCta
