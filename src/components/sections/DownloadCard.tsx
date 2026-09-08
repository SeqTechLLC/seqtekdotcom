import { HubspotLeadForm } from '@/components/forms/HubspotLeadForm'
import { type FormFieldConfig } from '@/lib/hubspot/fields'
import { Section } from '../ui/Section'

interface MediaLike {
  url?: string | null
  alt?: string | null
}

interface DownloadCardProps {
  title: string
  description: string
  coverImage?: MediaLike | string | number | null
  formId: string
  fileUrl: string
}

const isFullMedia = (v: unknown): v is MediaLike =>
  typeof v === 'object' && v !== null && 'url' in (v as object)

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

/**
 * ROADMAP INERT-2 — this was a disabled input, a disabled button, "HubSpot
 * form <id> loads in production", and `Asset: <fileUrl>` printed in the clear.
 * The gated download was therefore neither gated nor a download: the form did
 * nothing and the file was one copy-paste away.
 *
 * It now mounts the shared `HubspotLeadForm` and hands the asset over in the
 * success panel, so a reader no longer sees the address on the page.
 *
 * This is a COURTESY GATE, not a real one, and the distinction matters. This is
 * a server component and `HubspotLeadForm` is `'use client'`, so `successCta`
 * crosses the boundary as a prop and Next serialises it into the RSC flight
 * payload embedded in the HTML. `curl` the page and the address is there before
 * anything is submitted. That is strictly better than the old `Asset: {fileUrl}`
 * line, which a reader could see — but anyone who views source, and any scraper
 * that never renders the form, still has the link. Gating it for real means
 * serving the asset through a token-bearing route (signed S3 URL), which is its
 * own piece of work; until then the copy must not promise more than this.
 */
export function DownloadCard({
  title,
  description,
  coverImage,
  formId,
  fileUrl,
}: DownloadCardProps) {
  return (
    <Section
      padding="spacious"
      innerClassName="grid gap-8 rounded-md border border-border-subtle bg-surface p-6 shadow-sm md:grid-cols-2"
    >
      {isFullMedia(coverImage) && coverImage.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage.url}
          alt={coverImage.alt ?? title}
          className="h-full w-full rounded-md object-cover"
        />
      ) : null}
      <div className="flex flex-col">
        <p className="text-caption uppercase tracking-wide text-accent-strong">Free download</p>
        <h2 className="mt-2 text-h2 font-bold">{title}</h2>
        <p className="mt-3 text-body text-text-secondary">{description}</p>
        <div className="mt-6">
          <HubspotLeadForm
            formId={formId}
            fields={GATE_FIELDS}
            submitLabel="Get it"
            successHeading="It's yours."
            successBody="Your download is ready below."
            successCta={{ href: fileUrl, label: 'Open the download' }}
          />
        </div>
      </div>
    </Section>
  )
}

export default DownloadCard
