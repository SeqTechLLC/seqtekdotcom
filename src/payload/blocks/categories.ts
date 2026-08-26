/**
 * Spec 011 (FR-009) — the canonical block-category taxonomy.
 *
 * These six categories are not new. They already exist twice: as the section
 * structure of `docs/BLOCK_LIBRARY.md` §5.1–§5.6, and as the `category` field
 * on every entry in `src/payload/seed/showcase/fixtures.ts`. This module is
 * their one definition, so the block picker, the docs, and the showcase
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
 * Human-facing group headings for the admin picker. Editors read these, so
 * they are written in plain language rather than mirroring the slug — the
 * slugs match `BLOCK_LIBRARY.md` §5's section titles, the labels do not have
 * to.
 */
export const BLOCK_CATEGORY_LABELS: Record<BlockCategory, string> = {
  hero: 'Page openers',
  content: 'Body content',
  'social-proof': 'Proof and credibility',
  cta: 'Calls to action',
  'content-collection': 'Lists and collections',
  specialty: 'Specialty',
}

/** Maps a category slug to its `BLOCK_LIBRARY.md` §5 subsection, for docs cross-reference. */
export const BLOCK_CATEGORY_DOC_SECTIONS: Record<BlockCategory, string> = {
  hero: '5.1',
  content: '5.2',
  'social-proof': '5.3',
  cta: '5.4',
  'content-collection': '5.5',
  specialty: '5.6',
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
