/**
 * Form field config + native validation for the HubSpot lead forms (spec 005).
 *
 * INTEGRATIONS.md §1.2 allows "Zod or native" — v1 uses native validation to
 * stay dependency-free (Zod is not installed). Swap in Zod when the form work
 * is picked up if richer schemas / cross-field rules are needed.
 */

export type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select'

export interface SelectOption {
  label: string
  value: string
}

export interface FormFieldConfig {
  /**
   * HubSpot property *internal name* (e.g. `firstname`), not the display label.
   * v1 values are best-guess placeholders — confirm against the names the
   * HubSpot admin returns (§1.2 provisioning checklist) before going live, or
   * the submit 400s with PROPERTY_DOESNT_EXIST.
   */
  name: string
  label: string
  type: FieldType
  required?: boolean
  autoComplete?: string
  placeholder?: string
  /** Required when `type === 'select'`; values are the HubSpot option values. */
  options?: SelectOption[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Returns a map of fieldName → error message; an empty object means valid.
 */
export function validateFields(
  config: FormFieldConfig[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of config) {
    const value = (values[field.name] ?? '').trim()
    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`
      continue
    }
    if (value && field.type === 'email' && !EMAIL_RE.test(value)) {
      errors[field.name] = 'Enter a valid email address.'
    }
  }
  return errors
}
