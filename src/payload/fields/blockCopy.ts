import type { SelectField, TextField, TextareaField } from 'payload'

import type { SectionBackground } from '../../components/ui/Section'

/**
 * Spec 011 US4 — the two text fields nearly every block repeats.
 *
 * `heading` appears on 29 blocks and `eyebrow` on 4, always meaning the same
 * thing and always arriving in the admin as a bare "Heading" with nothing to
 * say what it does. Writing that sentence 29 times is how 29 slightly
 * different sentences happen, so it is written here once.
 *
 * The `fallback` option exists because the blocks do not agree on what an
 * empty heading means: most drop the `<h2>` entirely, ten substitute a
 * hard-coded line ("Frequently asked questions", "Where we work"). Help text
 * that says "leave blank for no heading" would be false on those, so the call
 * site passes the string its renderer actually falls back to.
 */

interface HeadingOptions {
  /** The block cannot render without it. */
  required?: boolean
  /**
   * The line the renderer substitutes when this is empty. Omit when the
   * renderer drops the heading instead.
   */
  fallback?: string
  /** Replaces the generated sentence outright, for a block that needs its own. */
  description?: string
}

export const headingField = ({
  required = false,
  fallback,
  description,
}: HeadingOptions = {}): TextField => {
  const tail = required
    ? ''
    : fallback
      ? ` Leave it blank and the section reads "${fallback}".`
      : ' Leave it blank to run the section without a heading.'

  return {
    name: 'heading',
    type: 'text',
    label: 'Section heading',
    required,
    admin: {
      description: description ?? `The line that introduces this section.${tail}`,
    },
  }
}

interface EyebrowOptions {
  required?: boolean
  description?: string
}

export const eyebrowField = ({
  required = false,
  description,
}: EyebrowOptions = {}): TextField => ({
  name: 'eyebrow',
  type: 'text',
  label: 'Eyebrow',
  required,
  admin: {
    description:
      description ??
      'The small line above the headline, in caps. Two or three words that say what kind of thing this is, e.g. "Case study".',
  },
})

/** A short paragraph under a section heading. */
export const introField = (): TextareaField => ({
  name: 'intro',
  type: 'textarea',
  label: 'Intro',
  admin: {
    description:
      'A sentence or two under the heading. Leave it blank to go straight to the content.',
  },
})

/** The band colour behind a section. Maps to `Section`'s `background`. */
export const backgroundField = (
  defaultValue: SectionBackground = 'none',
  { brand = false }: { brand?: boolean } = {},
): SelectField => ({
  name: 'background',
  type: 'select',
  label: 'Background',
  defaultValue,
  options: [
    { label: 'None (page colour)', value: 'none' },
    { label: 'Subtle tint', value: 'subtle' },
    { label: 'Brand accent', value: 'accent' },
    { label: 'Dark', value: 'inverse' },
    // Only blocks built for white-on-green offer the solid band (Section.tsx).
    ...(brand ? [{ label: 'Solid brand green', value: 'brand' }] : []),
  ],
  admin: {
    description: 'The colour band behind this section. Alternate it with the sections around it.',
  },
})
