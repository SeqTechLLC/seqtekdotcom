type Predicate<TData = Record<string, unknown>> = (data: TData) => boolean

type ValidateArgs = { data?: unknown; siblingData?: unknown }

/**
 * Conditional-required helper (R-06, FR-011). Returns `admin.condition` so the
 * field hides when the predicate is false, plus a `validate` that enforces
 * presence when the predicate is true. Use on any block field that's only
 * required for a specific variant (e.g., `media` when variant is `with-image`).
 *
 * Spread directly onto the field config: `...requiredWhen(d => d?.variant === 'with-image')`.
 *
 * **Pass any other `admin` properties as the second argument, never as a
 * sibling key.** A spread followed by `admin: { ... }` silently replaces the
 * `condition` this returns, which is how `logo-bar.logos` shipped with a
 * conditional validator and no conditional visibility: it was required only
 * when the source was inline, yet showed unconditionally. Found by the spec
 * 011 US4 audit (T050) and fixed by this signature.
 */
export const requiredWhen = <TData = Record<string, unknown>, TAdmin extends object = object>(
  predicate: Predicate<TData>,
  admin: TAdmin = {} as TAdmin,
) => ({
  admin: {
    ...admin,
    condition: (data: unknown, siblingData: unknown) => predicate((siblingData ?? data) as TData),
  },
  validate: (value: unknown, args: ValidateArgs): true | string => {
    const data = (args.siblingData ?? args.data) as TData
    if (!predicate(data)) return true
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return 'This field is required for the selected variant'
    }
    return true
  },
})
