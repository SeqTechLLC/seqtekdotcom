import type { DateField, NumberField } from 'payload'

/**
 * Spec 011 US4 — `publishedAt` and `order`, whose help text is HALF shared.
 *
 * Both fields repeat across six and five collections, and the first pass at
 * this feature copied one sentence to all of them. That sentence was false on
 * four: `publishedAt` orders only the two collections read `-publishedAt`
 * (`posts`, `caseStudies`) and is rendered on exactly one page (`posts`);
 * everything else is sorted by `order` (`src/lib/payload.ts`). Copying a
 * sentence into six places is precisely what a factory is supposed to prevent,
 * so these take the part that differs as an argument and own only the part
 * that is genuinely shared.
 */

interface PublishedAtOptions {
  /**
   * What the date does on THIS collection, in the editor's terms. Check it
   * against `src/lib/payload.ts`'s sort and the route that renders the record
   * before writing it. Omit when the date has no effect beyond scheduling.
   */
  effect?: string
}

/** The half that is true everywhere: `enforceDraftWhenScheduled`. */
const SCHEDULING =
  'A date in the future forces this record back to draft, so it will not go live until that date passes and someone publishes it.'

export const publishedAtField = ({ effect }: PublishedAtOptions = {}): DateField => ({
  name: 'publishedAt',
  type: 'date',
  label: 'Publish date',
  admin: {
    position: 'sidebar',
    description: effect ? `${effect} ${SCHEDULING}` : `Scheduling only. ${SCHEDULING}`,
  },
})

interface OrderOptions {
  /** What is being ordered, e.g. "the service cards". */
  what: string
  /** How records with no number sort, where the query defines it. */
  unnumbered?: string
  /**
   * Hide the control without touching the schema, for a collection nothing
   * sorts by. Passed here rather than spread over afterwards: `{ ...orderField(),
   * admin: { hidden: true } }` replaces the whole `admin` object and silently
   * drops the description — the same footgun `requiredWhen` was rewritten to
   * make impossible.
   */
  hidden?: boolean
}

export const orderField = ({ what, unnumbered, hidden = false }: OrderOptions): NumberField => ({
  name: 'order',
  type: 'number',
  label: 'Sort position',
  admin: {
    ...(hidden ? { hidden: true } : {}),
    description: `Lowest number first in ${what}. ${
      unnumbered ?? 'Records left without a number come after the numbered ones, newest first.'
    }`,
  },
})
