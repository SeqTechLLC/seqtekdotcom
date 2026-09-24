/**
 * The collections a `cards` block can list, and the one normalisation its
 * resolver and its component share.
 *
 * A leaf module on purpose: the block config, `resolveLayout` (server-only)
 * and the render component all read this list, and none of them can import
 * the others without dragging in what the other side cannot load.
 */
export const CARD_COLLECTIONS = [
  'caseStudies',
  'posts',
  'services',
  'industries',
  'workshops',
  'teamMembers',
  'locations',
  'partners',
] as const

export type CardCollection = (typeof CARD_COLLECTIONS)[number]

export const isCardCollection = (value: unknown): value is CardCollection =>
  typeof value === 'string' && (CARD_COLLECTIONS as readonly string[]).includes(value)

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * `manualItems` is one relationship across all eight collections, so Payload
 * hands each pick back as `{ relationTo, value }`. This keeps the picks that
 * belong to `collection`, in the order they were picked, as plain documents.
 *
 * Dropped: picks from another collection (left behind when an editor switches
 * the block's collection), and picks that are still bare ids (unpublished or
 * unpopulated). Entries that are already plain documents pass through, which
 * is the shape the resolver hands the component.
 */
export function unwrapPicks(items: unknown, collection: CardCollection): unknown[] {
  if (!Array.isArray(items)) return []
  return items.flatMap((entry) => {
    if (!isObject(entry)) return []
    if ('relationTo' in entry && 'value' in entry) {
      return entry.relationTo === collection && isObject(entry.value) ? [entry.value] : []
    }
    return [entry]
  })
}
