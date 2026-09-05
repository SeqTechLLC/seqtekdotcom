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
  //
  // Trimmed because `httpsUrlValidate` accepts a whitespace-only value as
  // empty (`src/payload/fields/url.ts`), while a bare `meetingUrl` check would
  // read '   ' as present and draw the panel over a blank address — the same
  // placeholder-publishing defect, through a side door.
  const meeting = meetingUrl?.trim() || null
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      {/* Whole-string ternary rather than an appended fragment, matching
          `BrandTeaser`: `grid` and `gap-10` do nothing on a one-child
          container, and a leading space inside a branch is easy to delete
          into `gap-10lg:grid-cols-2`. */}
      <div
        className={
          meeting
            ? 'mx-auto grid max-w-container-xl gap-10 lg:grid-cols-2 lg:items-center'
            : 'mx-auto max-w-container-xl'
        }
      >
        {/* DESIGN_SYSTEM §11.4. The cap is always centred; only at `lg` does it
            go flush left. `lg:grid-cols-2` is the ONLY thing that makes the
            parent two columns, so below 1024px this is a single full-rail grid
            item — and a grid item with a definite max-width resolves to START,
            not centre. A bare `max-w-prose` there would left-align a 65ch
            column above the full-rail scheduling panel: the mismatch §11.4
            calls "what looks broken", and the bare-`max-w-prose` wrapper it
            bans by name. At `lg` and up the column shares the grid's left edge
            with the panel beside it, which is what `lg:mx-0` restores. */}
        <div className={meeting ? 'mx-auto max-w-prose lg:mx-0' : 'mx-auto max-w-prose'}>
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
        {meeting ? (
          <div className="rounded-md border border-border-subtle bg-surface-subtle p-6 text-center">
            <p className="text-caption uppercase tracking-wide text-accent-strong">Book a time</p>
            <p className="mt-2 text-body">Pick a slot and we will send the invitation.</p>
            <TrackedCtaLink
              href={meeting}
              ctaId="contact-cta-booking"
              location="contact-cta"
              label="See available times"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-md bg-accent-strong px-5 py-3 font-medium text-white"
            >
              See available times
            </TrackedCtaLink>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ContactCta
