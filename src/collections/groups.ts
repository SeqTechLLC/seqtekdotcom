/**
 * Spec 011 US6 — contracts/admin-metadata.md C3.
 *
 * The headings Payload draws in the admin sidebar. `admin.group` is a
 * free-form string in Payload's types, so the allowed set lives here and
 * `tests/int/adminMetadata.int.spec.ts` holds every collection and global to
 * it. Without that pairing a typo silently mints a fifth heading with one
 * entry under it, which looks like a bug in the panel rather than in a config.
 *
 * Sidebar order follows the order each group is FIRST seen in the
 * `collections` array (`isNavEntityVisible` / `groupNavItems`), not the order
 * declared here — see the note on that array in `./index.ts`.
 */
export const ADMIN_GROUPS = {
  /** Has a public URL and a body someone composes. */
  content: 'Content',
  /** No page of its own; feeds the collections above. */
  reference: 'Reference data',
  /**
   * One-of-a-kind site-wide documents. Currently unclaimed: `Homepage` is the
   * only global and it sits in `content`, because `groupNavItems` appends every
   * global after every collection — a `Site` group holding just the homepage
   * drew at the bottom of the panel, below `Admin`.
   */
  site: 'Site',
  /** Who can get in. Not editor-facing. */
  admin: 'Admin',
} as const

export type AdminGroup = (typeof ADMIN_GROUPS)[keyof typeof ADMIN_GROUPS]

export const ADMIN_GROUP_LABELS: readonly string[] = Object.values(ADMIN_GROUPS)
