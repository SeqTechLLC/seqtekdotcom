import { HubspotLeadForm } from '@/components/forms/HubspotLeadForm'
import { type FormFieldConfig } from '@/lib/hubspot/fields'

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
 * success panel, so `fileUrl` reaches the page only after a submit lands.
 */
export function DownloadCard({
  title,
  description,
  coverImage,
  formId,
  fileUrl,
}: DownloadCardProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-container-lg gap-8 rounded-md border border-border-subtle bg-surface p-6 shadow-sm md:grid-cols-2">
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
              successBody="The download is ready below, and a copy is on its way by email."
              successCta={{ href: fileUrl, label: 'Download now' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default DownloadCard
