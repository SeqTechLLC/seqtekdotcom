import type { GroupField, SelectField, TextField } from 'payload'

import { safeUrlValidate } from './url'

/**
 * Spec 011 US4 / T047 — the call-to-action group, authored once.
 *
 * Ten groups across six blocks repeated the same `{ label, url }` shape with
 * no labels, so every CTA in the admin read "Primary Cta > Label / Url" —
 * three mechanically title-cased words in a row, none of which says "this is
 * the button and where it goes" (FR-018).
 *
 * **Schema-identical by construction**, same as `seoField()`: names, types and
 * validators are unchanged, so the generated `primary_cta_label` /
 * `primary_cta_url` / `primary_cta_variant` columns are unchanged.
 */

/** The button styles `Hero`'s primary CTA offers. Matches `Button`'s variants. */
const BUTTON_STYLES: SelectField['options'] = [
  { label: 'Primary (solid)', value: 'primary' },
  { label: 'Secondary (outlined)', value: 'secondary' },
  { label: 'Ghost (text only)', value: 'ghost' },
]

interface CtaFieldOptions {
  /** Field name — `cta`, `primaryCta`, `secondaryCta`. Sets the column prefix. */
  name: 'cta' | 'primaryCta' | 'secondaryCta'
  /** What an editor calls this button, e.g. "Main button". */
  label: string
  /** One line on where the button goes and what it is for. */
  description: string
  /** Both text and link required, as the block's render path assumes. */
  required?: boolean
  /**
   * Offer the three button styles. Only `hero.primaryCta` has this today; the
   * column exists there and nowhere else, so it stays opt-in.
   */
  withStyle?: boolean
}

export const ctaField = ({
  name,
  label,
  description,
  required = false,
  withStyle = false,
}: CtaFieldOptions): GroupField => {
  const text: TextField = {
    name: 'label',
    type: 'text',
    label: 'Button text',
    required,
    admin: {
      description: 'The words on the button. Two to four words reads best, e.g. "Book a call".',
    },
  }

  const url: TextField = {
    name: 'url',
    type: 'text',
    label: 'Button link',
    required,
    validate: safeUrlValidate,
    admin: {
      description:
        'Where the button goes. A path on this site starts with a slash ("/contact"); an outside link needs the full https:// address.',
    },
  }

  const style: SelectField = {
    name: 'variant',
    type: 'select',
    label: 'Button style',
    defaultValue: 'primary',
    options: BUTTON_STYLES,
    admin: {
      description:
        'How much weight the button carries: solid for the one thing you want clicked, outlined for a real but lesser option, text-only when it should not compete with the page.',
    },
  }

  return {
    name,
    type: 'group',
    label,
    admin: { description },
    fields: withStyle ? [text, url, style] : [text, url],
  }
}
