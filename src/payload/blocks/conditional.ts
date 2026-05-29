import type { FieldHookArgs } from 'payload'

type Predicate<TData = Record<string, unknown>> = (data: TData) => boolean

/**
 * Conditional-required helper (R-06, FR-011). Returns `admin.condition` so the
 * field hides when the predicate is false, plus a `validate` that enforces
 * presence when the predicate is true. Use on any block field that's only
 * required for a specific variant (e.g., `media` when variant is `with-image`).
 */
export const requiredWhen =
  <TData = Record<string, unknown>>(predicate: Predicate<TData>) =>
  () => ({
    admin: {
      condition: (data: unknown, siblingData: unknown) => predicate((siblingData ?? data) as TData),
    },
    validate: (value: unknown, args: FieldHookArgs) => {
      const data = (args.siblingData ?? args.data) as TData
      if (!predicate(data)) return true
      if (value === null || value === undefined || value === '') {
        return 'This field is required for the selected variant'
      }
      return true
    },
  })
