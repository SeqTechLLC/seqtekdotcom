import { type FormFieldConfig } from '@/lib/hubspot/fields'

import { HubspotLeadForm } from './HubspotLeadForm'

// Provisioned form, confirmed with the HubSpot admin 2026-06-02 (INTEGRATIONS.md
// §1.2 "Workshop Inquiry — provisioned"). Field internal names match the HubSpot
// properties exactly. `marketing_info` is a free-text property — the workshop
// choices are a page-side decision; we POST the selected string. No `message`
// property exists on this form. `phone` is required on the form.
const WORKSHOP_FIELDS: FormFieldConfig[] = [
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
  { name: 'email', label: 'Work email', type: 'email', required: true, autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, autoComplete: 'tel' },
  { name: 'company', label: 'Company', type: 'text', autoComplete: 'organization' },
  {
    name: 'marketing_info',
    label: 'Which workshop?',
    type: 'select',
    required: true,
    options: [
      { label: 'AI Strategy', value: 'AI Strategy' },
      { label: 'Five Dysfunctions of a Team', value: 'Five Dysfunctions of a Team' },
      { label: 'Leadership & Culture', value: 'Leadership & Culture' },
      { label: 'Not sure yet', value: 'Not sure yet' },
    ],
  },
]

export function WorkshopInquiryForm() {
  const formId = process.env.NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID ?? ''
  return (
    <HubspotLeadForm
      formId={formId}
      fields={WORKSHOP_FIELDS}
      submitLabel="Request details"
      successHeading="You're on the list."
      successBody="We'll follow up with workshop dates and what to expect."
    />
  )
}

export default WorkshopInquiryForm
