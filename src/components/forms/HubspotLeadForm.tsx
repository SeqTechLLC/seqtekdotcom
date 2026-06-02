'use client'

import { type FormEvent, useState } from 'react'

import { type FormFieldConfig, validateFields } from '@/lib/hubspot/fields'
import { type HubspotField, isHubspotLive, submitHubspotForm } from '@/lib/hubspot/submit'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface HubspotLeadFormProps {
  formId: string
  fields: FormFieldConfig[]
  submitLabel?: string
  successHeading?: string
  successBody?: string
}

const MAILTO = 'mailto:contact@seqtek.com'

const FIELD_CLASS = 'mt-1 w-full rounded-md border border-border-strong px-3 py-2'

/**
 * Shared custom-form renderer + submission state machine (INTEGRATIONS.md §1.2):
 * idle → submitting → (success | error). Native client-side validation, inline
 * field errors, values preserved on error, a mailto fallback, and a half-wired
 * "preview mode" notice when no live HubSpot GUID is configured.
 */
export function HubspotLeadForm({
  formId,
  fields,
  submitLabel = 'Submit',
  successHeading = 'Thanks — we got it.',
  successBody = "We'll be in touch shortly.",
}: HubspotLeadFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const field of fields) initial[field.name] = ''
    return initial
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<FormState>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')

  function update(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Honeypot: a field humans never see. If it's filled, a bot did it — show
    // success without sending anything (INTEGRATIONS.md §1.2: spam protection
    // lives on our page since CAPTCHA is off on the API forms).
    if (honeypot.trim() !== '') {
      setState('success')
      return
    }

    const errors = validateFields(fields, values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setState('submitting')
    setFormError(null)

    const payload: HubspotField[] = fields.map((field) => ({
      name: field.name,
      value: values[field.name] ?? '',
    }))
    const result = await submitHubspotForm({ formId, fields: payload })

    if (result.status === 'success') {
      setState('success')
      return
    }
    setState('error')
    setFormError(result.message)
    if (result.fieldErrors) setFieldErrors(result.fieldErrors)
  }

  if (state === 'success') {
    return (
      <div
        data-testid="form-success"
        role="status"
        className="rounded-md border border-border-subtle bg-surface-subtle p-8"
      >
        <h3 className="text-h3 font-bold">{successHeading}</h3>
        <p className="mt-2 text-body-lg text-text-secondary">{successBody}</p>
      </div>
    )
  }

  const submitting = state === 'submitting'

  return (
    <form noValidate onSubmit={handleSubmit} data-testid="hubspot-lead-form" className="space-y-5">
      {/* Honeypot — hidden from humans + the a11y tree; naive bots fill it and
          get silently dropped on submit. */}
      <div hidden>
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {!isHubspotLive(formId) ? (
        <p className="rounded-md bg-surface-subtle px-3 py-2 text-caption text-text-muted">
          Preview mode — submissions are not yet sent to HubSpot.
        </p>
      ) : null}

      {fields.map((field) => {
        const error = fieldErrors[field.name]
        const errorId = `${field.name}-error`
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-small font-medium">
              {field.label}
              {field.required ? (
                <span aria-hidden="true" className="text-text-muted">
                  {' '}
                  *
                </span>
              ) : null}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                rows={4}
                required={field.required}
                disabled={submitting}
                value={values[field.name] ?? ''}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => update(field.name, event.target.value)}
                className={FIELD_CLASS}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                required={field.required}
                disabled={submitting}
                value={values[field.name] ?? ''}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => update(field.name, event.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">Select…</option>
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                required={field.required}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                disabled={submitting}
                value={values[field.name] ?? ''}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => update(field.name, event.target.value)}
                className={FIELD_CLASS}
              />
            )}
            {error ? (
              <p id={errorId} className="mt-1 text-small text-red-700">
                {error}
              </p>
            ) : null}
          </div>
        )
      })}

      {formError ? (
        <div
          data-testid="form-error"
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-small text-red-700"
        >
          <p>{formError}</p>
          <a href={MAILTO} className="font-medium underline">
            Email us instead
          </a>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent-strong px-5 py-3 font-medium text-white disabled:opacity-60"
      >
        {submitting ? 'Sending…' : submitLabel}
      </button>
    </form>
  )
}

export default HubspotLeadForm
