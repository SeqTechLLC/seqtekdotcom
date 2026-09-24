import Link from 'next/link'
import type { ReactNode } from 'react'

import { BookingCompleteSeam } from '@/components/analytics/BookingCompleteSeam'
import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink'
import { HubspotLeadForm } from '@/components/forms/HubspotLeadForm'
import { cn } from '@/lib/cn'
import { type FormFieldConfig } from '@/lib/hubspot/fields'
import { ReadingColumn } from '../ui/ReadingColumn'
import { Section, type SectionBackground } from '../ui/Section'
import { toneFor, type Tone } from '../ui/tone'

type ButtonStyle = 'primary' | 'secondary' | 'ghost'
type CtaAction = 'buttons' | 'meeting' | 'newsletter' | 'download'

type CtaLink = { label?: string | null; url?: string | null; variant?: ButtonStyle | null } | null

interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface CtaProps {
  heading: string
  body?: string | null
  action?: CtaAction | null
  variant?: 'centered' | 'split' | null
  primaryCta?: CtaLink
  secondaryCta?: CtaLink
  meetingUrl?: string | null
  formId?: string | null
  coverImage?: MediaLike | string | number | null
  fileUrl?: string | null
  background?: SectionBackground | null
}

const isFullMedia = (v: unknown): v is MediaLike =>
  typeof v === 'object' && v !== null && 'url' in (v as object)

/** A button is drawn only with both its words and somewhere to go. */
const usable = (
  cta: CtaLink | undefined,
): cta is NonNullable<CtaLink> & { label: string; url: string } => Boolean(cta?.label && cta?.url)

const EMAIL_ONLY: FormFieldConfig[] = [
  { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
]

const GATE_FIELDS: FormFieldConfig[] = [
  {
    name: 'firstname',
    label: 'First name',
    type: 'text',
    required: true,
    autoComplete: 'given-name',
  },
  {
    name: 'lastname',
    label: 'Last name',
    type: 'text',
    required: true,
    autoComplete: 'family-name',
  },
  { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
  { name: 'company', label: 'Company', type: 'text', autoComplete: 'organization' },
]

/** `ctaField`'s three button styles, as `Hero` draws them, plus a dark-band set. */
const BUTTON_CLASS: Record<'light' | 'dark', Record<ButtonStyle, string>> = {
  light: {
    primary: 'rounded-md bg-accent-strong px-5 py-3 font-medium text-white',
    secondary:
      'rounded-md border border-accent-strong px-5 py-3 font-medium text-accent-strong hover:bg-surface-accent',
    ghost: 'rounded-md px-5 py-3 font-medium text-accent-strong underline hover:no-underline',
  },
  // Green-700 text on neutral-900 fails AA, so the lighter styles go white.
  dark: {
    primary: 'rounded-md bg-accent-strong px-5 py-3 font-medium text-white',
    secondary: 'rounded-md border border-white px-5 py-3 font-medium text-white hover:bg-white/10',
    ghost: 'rounded-md px-5 py-3 font-medium text-white underline hover:no-underline',
  },
}

function Buttons({
  primaryCta,
  secondaryCta,
  action,
  tone,
  className,
}: {
  primaryCta?: CtaLink
  secondaryCta?: CtaLink
  action: CtaAction
  tone: Tone
  className?: string
}): ReactNode {
  const primary = usable(primaryCta) ? primaryCta : null
  const secondary = usable(secondaryCta) ? secondaryCta : null
  if (!primary && !secondary) return null
  const styles = BUTTON_CLASS[tone.inverse ? 'dark' : 'light']
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {primary ? (
        <TrackedCtaLink
          href={primary.url}
          ctaId="cta-primary"
          location={`cta-${action}`}
          label={primary.label}
          className={styles[primary.variant ?? 'primary'] ?? styles.primary}
        >
          {primary.label}
        </TrackedCtaLink>
      ) : null}
      {secondary ? (
        <Link href={secondary.url} className="font-medium underline">
          {secondary.label}
        </Link>
      ) : null}
    </div>
  )
}

function MeetingPanel({
  meetingUrl,
  background,
}: {
  meetingUrl: string
  background: SectionBackground
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-border-subtle p-6 text-center text-text-primary',
        background === 'subtle' ? 'bg-surface' : 'bg-surface-subtle',
      )}
    >
      {/* booking_complete seam (spec 008 US3, contract D3) — dormant until the
          inline Meetings embed posts onMeetingBookSucceeded. */}
      <BookingCompleteSeam meetingUrl={meetingUrl} />
      <p className="text-caption uppercase tracking-wide text-accent-strong">Book a time</p>
      <p className="mt-2 text-body">Pick a slot and we will send the invitation.</p>
      <TrackedCtaLink
        href={meetingUrl}
        ctaId="cta-booking"
        location="cta-meeting"
        label="See available times"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-md bg-accent-strong px-5 py-3 font-medium text-white"
      >
        See available times
      </TrackedCtaLink>
    </div>
  )
}

/**
 * Replaces `cta-section`, `contact-cta`, `newsletter-cta`, `download-card` and
 * `hubspot-meetings`.
 *
 * - **Meeting.** The scheduling panel is optional in the render even though
 *   the schema requires the link: a whitespace-only value passes
 *   `httpsUrlValidate` as empty, and a bare truthiness check would put the
 *   framed panel over a blank address. Trimmed, it collapses instead, so the
 *   "Configure a HubSpot meetings URL" placeholder the old `contact-cta`
 *   published cannot come back through a side door (ROADMAP INERT-2).
 * - **Newsletter.** Without a form GUID there is no way to subscribe, so the
 *   section renders nothing rather than a heading over a form that cannot work.
 * - **Download.** A COURTESY GATE, not a real one. This is a server component
 *   and `HubspotLeadForm` is `'use client'`, so `fileUrl` crosses the boundary
 *   as a prop and is serialised into the RSC payload in the HTML before
 *   anything is submitted. Gating it for real means a token-bearing route
 *   (signed S3 URL); until then the copy must not promise more than this.
 */
export function Cta({
  heading,
  body,
  action = 'buttons',
  variant = 'centered',
  primaryCta,
  secondaryCta,
  meetingUrl,
  formId,
  coverImage,
  fileUrl,
  background = 'accent',
}: CtaProps) {
  const act: CtaAction = action ?? 'buttons'
  const bg: SectionBackground = background ?? 'accent'
  const tone = toneFor(bg)
  const split = variant === 'split'
  const form = formId?.trim() || null

  if (act === 'download') {
    const file = fileUrl?.trim() || null
    if (!form || !file) return null
    return (
      <Download
        heading={heading}
        body={body}
        coverImage={coverImage}
        formId={form}
        fileUrl={file}
        background={bg}
        split={split}
      />
    )
  }
  if (act === 'newsletter' && !form) return null

  const meeting = act === 'meeting' ? meetingUrl?.trim() || null : null

  const copy = (
    <>
      <h2 className="text-h2 font-bold">{heading}</h2>
      {body ? <p className={cn('mt-4 text-body-lg', tone.secondary)}>{body}</p> : null}
    </>
  )

  const newsletter = form ? (
    // Form controls inherit `color`, so on the dark band the fields would be
    // white on white without a light frame of their own.
    <div className={cn('text-left', tone.inverse && 'rounded-md bg-surface p-6 text-text-primary')}>
      <HubspotLeadForm
        formId={form}
        fields={EMAIL_ONLY}
        submitLabel="Subscribe"
        successHeading="You're on the list."
        successBody="Look for the next SEQTEK Insights in your inbox."
      />
    </div>
  ) : null

  const buttons = (className?: string) => (
    <Buttons
      primaryCta={primaryCta}
      secondaryCta={secondaryCta}
      action={act}
      tone={tone}
      className={className}
    />
  )

  if (!split) {
    return (
      <Section padding="spacious" background={bg} innerClassName="text-center">
        <ReadingColumn>
          {copy}
          {act === 'newsletter' ? (
            <div className="mx-auto mt-8 max-w-md">{newsletter}</div>
          ) : (
            buttons('mt-8 justify-center')
          )}
        </ReadingColumn>
        {meeting ? (
          <div className="mx-auto mt-10 max-w-md">
            <MeetingPanel meetingUrl={meeting} background={bg} />
          </div>
        ) : null}
      </Section>
    )
  }

  // Split. The second column holds the action; with nothing to put in it (a
  // meeting with no link) the section collapses to one full-width column
  // rather than reserving half the width for an empty box.
  //
  // `w-full` on the columns: a grid item with auto side margins shrinks to its
  // content, so without it a short heading or a lone button row sat centred
  // under left-aligned copy once the grid stacked on a phone. Measured, not
  // reasoned: the 390px capture showed exactly that.
  let aside: ReactNode = null
  let copyButtons: ReactNode = null
  if (act === 'newsletter') {
    aside = (
      <ReadingColumn flushFrom="lg" className="w-full">
        {newsletter}
      </ReadingColumn>
    )
  } else if (act === 'meeting') {
    copyButtons = buttons('mt-8')
    aside = meeting ? <MeetingPanel meetingUrl={meeting} background={bg} /> : null
  } else if (usable(primaryCta) || usable(secondaryCta)) {
    aside = (
      <ReadingColumn flushFrom="lg" className="w-full">
        {buttons()}
      </ReadingColumn>
    )
  }

  return (
    <Section
      padding="spacious"
      background={bg}
      innerClassName={aside ? 'grid gap-10 lg:grid-cols-2 lg:items-center' : undefined}
    >
      <ReadingColumn flushFrom={aside ? 'lg' : undefined} className={aside ? 'w-full' : undefined}>
        {copy}
        {copyButtons}
      </ReadingColumn>
      {aside}
    </Section>
  )
}

function Download({
  heading,
  body,
  coverImage,
  formId,
  fileUrl,
  background,
  split,
}: {
  heading: string
  body?: string | null
  coverImage?: MediaLike | string | number | null
  formId: string
  fileUrl: string
  background: SectionBackground
  split: boolean
}) {
  const cover =
    isFullMedia(coverImage) && coverImage.url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverImage.url}
        alt={coverImage.alt ?? heading}
        className={
          split
            ? 'h-full w-full rounded-md object-cover'
            : 'mx-auto max-h-80 w-auto rounded-md object-cover'
        }
      />
    ) : null

  const form = (
    <HubspotLeadForm
      formId={formId}
      fields={GATE_FIELDS}
      submitLabel="Get it"
      successHeading="It's yours."
      successBody="Your download is ready below."
      successCta={{ href: fileUrl, label: 'Open the download' }}
    />
  )

  // The card is a light surface on every band, so its text is pinned dark.
  const card = 'rounded-md border border-border-subtle bg-surface p-6 text-text-primary shadow-sm'

  if (split) {
    return (
      <Section
        padding="spacious"
        background={background}
        innerClassName={cn('grid gap-8', card, cover && 'md:grid-cols-2')}
      >
        {cover}
        <div className="flex flex-col">
          <p className="text-caption uppercase tracking-wide text-accent-strong">Free download</p>
          <h2 className="mt-2 text-h2 font-bold">{heading}</h2>
          {body ? <p className="mt-3 text-body text-text-secondary">{body}</p> : null}
          <div className="mt-6">{form}</div>
        </div>
      </Section>
    )
  }

  return (
    <Section padding="spacious" background={background} rail="md" innerClassName={card}>
      {cover}
      <div className={cn('text-center', cover && 'mt-6')}>
        <p className="text-caption uppercase tracking-wide text-accent-strong">Free download</p>
        <h2 className="mt-2 text-h2 font-bold">{heading}</h2>
        {body ? <p className="mt-3 text-body text-text-secondary">{body}</p> : null}
      </div>
      <div className="mx-auto mt-6 max-w-md">{form}</div>
    </Section>
  )
}

export default Cta
