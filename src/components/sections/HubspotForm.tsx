interface HubspotFormProps {
  heading?: string | null
  description?: string | null
  formId: string
  submitRedirect?: string | null
}

export function HubspotForm({ heading, description, formId, submitRedirect }: HubspotFormProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        {description ? (
          <p className="mt-3 text-body-lg text-text-secondary">{description}</p>
        ) : null}
        <div className="mt-8 rounded-md border border-border-strong bg-surface-subtle p-8 text-center">
          <p className="text-caption uppercase tracking-wide text-accent-strong">HubSpot Form</p>
          <p className="mt-2 text-body-lg font-semibold">Form {formId}</p>
          {submitRedirect ? (
            <p className="mt-2 text-small text-text-muted">
              Redirects to {submitRedirect} on submit.
            </p>
          ) : null}
          <p className="mt-4 text-caption text-text-muted">
            HubSpot script loads in production via the HubSpotTracking integration.
          </p>
        </div>
      </div>
    </section>
  )
}

export default HubspotForm
