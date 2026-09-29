/**
 * The canonical block-category taxonomy. `docs/BLOCK_LIBRARY.md` §5.1–§5.6 and
 * the `category` field on every showcase fixture use the same six; this module
 * is their one definition, so the block picker, the docs and the showcase
 * harness cannot drift apart.
 *
 * `BLOCK_CATEGORIES` order is load-bearing: it is the order categories appear
 * in the admin block picker, running roughly from "what starts a page" to
 * "what you reach for occasionally".
 */

export const BLOCK_CATEGORIES = [
  'hero',
  'content',
  'social-proof',
  'cta',
  'content-collection',
  'specialty',
] as const

export type BlockCategory = (typeof BLOCK_CATEGORIES)[number]

/**
 * Human-facing group headings for the admin picker, in plain language rather
 * than the slug. `BLOCK_LIBRARY.md` §5 uses the same headings.
 */
export const BLOCK_CATEGORY_LABELS: Record<BlockCategory, string> = {
  hero: 'Page openers',
  content: 'Body content',
  'social-proof': 'Proof and credibility',
  cta: 'Calls to action',
  'content-collection': 'Lists and collections',
  specialty: 'Specialty',
}

export function isBlockCategory(value: unknown): value is BlockCategory {
  return typeof value === 'string' && (BLOCK_CATEGORIES as readonly string[]).includes(value)
}

/**
 * Inverse of `BLOCK_CATEGORY_LABELS`. A block declares its category as the
 * human heading on `admin.group` (that is the only shape Payload's picker
 * reads), so anything that needs the canonical slug back — the showcase
 * harness, the metadata test — comes through here rather than keeping a
 * second copy of the assignment.
 *
 * Safe to invert because `adminMetadata.int.spec.ts` pins the labels unique.
 */
export function blockCategoryFromGroupLabel(label: unknown): BlockCategory | null {
  const match = (Object.entries(BLOCK_CATEGORY_LABELS) as Array<[BlockCategory, string]>).find(
    ([, value]) => value === label,
  )
  return match ? match[0] : null
}
