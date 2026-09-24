import { HubspotLeadForm } from '@/components/forms/HubspotLeadForm'
import { WorkshopInquiryForm } from '@/components/forms/WorkshopInquiryForm'
import { type FormFieldConfig } from '@/lib/hubspot/fields'
import { WORKSHOP_FORM_ID } from '@/lib/hubspot/forms'
import { Section, type SectionBackground } from '../ui/Section'

interface HubspotFormProps {
  heading?: string | null
  description?: string | null
  formId: string
  background?: SectionBackground | null
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

export function HubspotForm({
  heading,
  description,
  formId,
  background = 'none',
}: HubspotFormProps) {
  const inverse = background === 'inverse'
  return (
    <Section padding="spacious" background={background ?? 'none'}>
      {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
      {description ? (
        <p
          className={`mt-3 max-w-2xl text-body-lg ${inverse ? 'text-neutral-200' : 'text-text-secondary'}`}
        >
          {description}
        </p>
      ) : null}
      {/* The form's muted and error text is set for a light page, so on the
          dark band it sits on a light panel rather than restyling every field. */}
      <div
        className={
          inverse ? 'mt-8 rounded-lg bg-surface-elevated p-6 text-text-primary md:p-8' : 'mt-8'
        }
      >
        {formId === WORKSHOP_FORM_ID ? (
          <WorkshopInquiryForm />
        ) : (
          <HubspotLeadForm formId={formId} fields={DEFAULT_FIELDS} />
        )}
      </div>
    </Section>
  )
}

export default HubspotForm
