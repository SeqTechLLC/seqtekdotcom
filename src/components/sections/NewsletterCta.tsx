import { HubspotLeadForm } from '@/components/forms/HubspotLeadForm'
import { type FormFieldConfig } from '@/lib/hubspot/fields'
import { Section } from '../ui/Section'

interface NewsletterCtaProps {
  heading?: string | null
  body?: string | null
  formId?: string | null
}

const EMAIL_ONLY: FormFieldConfig[] = [
  { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
]

/**
 * ROADMAP INERT-2 — this was a disabled input, a disabled button and a caption
 * naming `NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID`, an env var nothing in
 * `src/` reads. It now mounts the same `HubspotLeadForm` the `hubspot-form`
 * block has used all along, with the one field a newsletter needs; the submit
 * path (`lib/hubspot/submit.ts`) and its GTM events come with it.
 *
 * Without a form GUID there is no way to subscribe, so the section renders
 * nothing rather than publishing a heading over a form that cannot work —
 * the same choice `logo-bar` and `industry-grid` make when they have no items.
 */
export function NewsletterCta({ heading, body, formId }: NewsletterCtaProps) {
  if (!formId) return null
  return (
    <Section padding="spacious" background="accent" rail="md" innerClassName="text-center">
      <h2 className="text-h2 font-bold">{heading ?? 'Subscribe to SEQTEK Insights'}</h2>
      {body ? <p className="mt-4 text-body-lg text-text-secondary">{body}</p> : null}
      <div className="mx-auto mt-8 max-w-md text-left">
        <HubspotLeadForm
          formId={formId}
          fields={EMAIL_ONLY}
          submitLabel="Subscribe"
          successHeading="You're on the list."
          successBody="Look for the next SEQTEK Insights in your inbox."
        />
      </div>
    </Section>
  )
}

export default NewsletterCta
