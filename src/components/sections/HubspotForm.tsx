import { HubspotLeadForm } from '@/components/forms/HubspotLeadForm'
import { WorkshopInquiryForm } from '@/components/forms/WorkshopInquiryForm'
import { type FormFieldConfig } from '@/lib/hubspot/fields'
import { WORKSHOP_FORM_ID } from '@/lib/hubspot/forms'

interface HubspotFormProps {
  heading?: string | null
  description?: string | null
  formId: string
  submitRedirect?: string | null
}

// Generic lead fields for content-placed `hubspot-form` blocks. When the block's
// formId is the Workshop Inquiry GUID we render the richer, workshop-specific
// <WorkshopInquiryForm /> (phone + which-workshop) instead. Confirm field
// internal names against the HubSpot form (§1.2).
const DEFAULT_FIELDS: FormFieldConfig[] = [
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
  { name: 'message', label: 'Message', type: 'textarea' },
]

export function HubspotForm({ heading, description, formId }: HubspotFormProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        {description ? (
          <p className="mt-3 max-w-2xl text-body-lg text-text-secondary">{description}</p>
        ) : null}
        <div className="mt-8">
          {formId === WORKSHOP_FORM_ID ? (
            <WorkshopInquiryForm />
          ) : (
            <HubspotLeadForm formId={formId} fields={DEFAULT_FIELDS} />
          )}
        </div>
      </div>
    </section>
  )
}

export default HubspotForm
