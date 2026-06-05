interface NewsletterCtaProps {
  heading?: string | null
  body?: string | null
  formId?: string | null
}

export function NewsletterCta({ heading, body, formId }: NewsletterCtaProps) {
  // Phase 3 (Spec 005) wires the real HubSpot form via the existing
  // HubspotTracking integration. Showcase renders the affordance only so
  // no third-party script loads during visual verification.
  const showFallback = !formId
  return (
    <section className="bg-surface-accent px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-md text-center">
        <h2 className="text-h2 font-bold">{heading ?? 'Subscribe to SEQTEK Insights'}</h2>
        {body ? <p className="mt-4 text-body-lg text-text-secondary">{body}</p> : null}
        <form
          className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row"
          aria-label="Newsletter signup placeholder"
        >
          <input
            type="email"
            placeholder="you@company.com"
            className="rounded-md border border-border-strong bg-surface px-4 py-3 text-body"
            disabled
          />
          <button
            type="button"
            className="rounded-md bg-accent-strong px-5 py-3 font-medium text-white"
            disabled
          >
            Subscribe
          </button>
        </form>
        {showFallback ? (
          <p className="mt-4 text-caption text-text-muted">
            Form GUID missing — production wires HubSpot via NEXT_PUBLIC_HUBSPOT_NEWSLETTER_FORM_ID.
          </p>
        ) : (
          <p className="mt-4 text-caption text-text-muted">
            HubSpot form {formId} loads in production.
          </p>
        )}
      </div>
    </section>
  )
}

export default NewsletterCta
