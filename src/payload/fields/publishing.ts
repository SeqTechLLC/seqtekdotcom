import type { NumberField } from 'payload'

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

export const publishedAtField = ({ effect }: PublishedAtOptions = {}) =>
  ({
    name: 'publishedAt',
    type: 'date' as const,
    label: 'Publish date',
    admin: {
      position: 'sidebar' as const,
      description: effect ? `${effect} ${SCHEDULING}` : `Scheduling only. ${SCHEDULING}`,
    },
  }) as const

interface OrderOptions {
  /** What is being ordered, e.g. "the service cards". */
  what: string
  /** How records with no number sort, where the query defines it. */
  unnumbered?: string
}

export const orderField = ({ what, unnumbered }: OrderOptions): NumberField => ({
  name: 'order',
  type: 'number',
  label: 'Sort position',
  admin: {
    description: `Lowest number first in ${what}. ${
      unnumbered ??
      'Give every record a number: the sequence of records without one is not defined.'
    }`,
  },
})
