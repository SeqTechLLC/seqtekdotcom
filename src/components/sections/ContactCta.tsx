import Link from 'next/link'

import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink'

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
  // The scheduling panel is the block's optional second column. With no
  // meeting URL there is nothing to put in it, so the section collapses to a
  // single full-width column rather than publishing an empty framed box.
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div
        className={`mx-auto grid max-w-container-lg gap-10${
          meetingUrl ? ' lg:grid-cols-2 lg:items-center' : ''
        }`}
      >
        <div>
          <h2 className="text-h2 font-bold">{heading}</h2>
          {body ? <p className="mt-4 text-body-lg text-text-secondary">{body}</p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {primaryCta?.label && primaryCta?.url ? (
              <TrackedCtaLink
                href={primaryCta.url}
                ctaId="contact-cta-primary"
                location="contact-cta"
                label={primaryCta.label}
                className="rounded-md bg-accent-strong px-5 py-3 font-medium text-white"
              >
                {primaryCta.label}
              </TrackedCtaLink>
            ) : null}
            {secondaryCta?.label && secondaryCta?.url ? (
              <Link href={secondaryCta.url} className="font-medium underline">
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
        {meetingUrl ? (
          <div className="rounded-md border border-border-subtle bg-surface-subtle p-6 text-center">
            <p className="text-caption uppercase tracking-wide text-accent-strong">Book a time</p>
            <p className="mt-2 text-body-lg font-semibold">HubSpot Meetings embed</p>
            <p className="mt-1 text-small text-text-muted">{meetingUrl}</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ContactCta
