import { type FormFieldConfig } from '@/lib/hubspot/fields'

import { HubspotLeadForm } from './HubspotLeadForm'

// Field internal names verified against the live HubSpot form by a test submit
// 2026-06-22 (all accepted, HTTP 200 — INTEGRATIONS.md §1.2). The inquiry_type
// option `general` round-tripped; the other three values weren't each tested.
const CONTACT_FIELDS: FormFieldConfig[] = [
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
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
  {
    name: 'inquiry_type',
    label: 'How can we help?',
    type: 'select',
    required: true,
    options: [
      { label: 'New project or proposal', value: 'new_project' },
      { label: 'General question', value: 'general' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Careers', value: 'careers' },
    ],
  },
  { name: 'message', label: 'Message', type: 'textarea', required: true },
]

export function ContactForm() {
  const formId = process.env.NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID ?? ''
  return (
    <HubspotLeadForm
      formId={formId}
      fields={CONTACT_FIELDS}
      submitLabel="Send message"
      successHeading="Thanks for reaching out."
      successBody="A member of our team will get back to you within one business day."
    />
  )
}

export default ContactForm
