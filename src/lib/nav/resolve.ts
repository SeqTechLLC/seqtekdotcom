import { navigation, type NavGroup, type NavItem } from '../site-content'
import { pathFor, TITLE_FIELD, type NavLinkableCollection } from '../routes'

/**
 * Turns published `navigation` documents into the `NavItem[]` the header
 * already renders (ADR 0010, amended 2026-09-16).
 *
 * PURE ON PURPOSE — no `server-only`, no Payload import, no cache. It takes
 * documents and returns menu items, so every branch below is unit-testable
 * without a database: URL derivation per target collection, the label
 * fallback, and what happens when the collection is empty.
 *
 * The URL is DERIVED here rather than stored, which is the whole point of the
 * amendment. `pathFor` is the single route map (`src/lib/routes.ts`), so a menu
 * item, the revalidation hook and the sitemap cannot disagree about where a
 * document lives.
 */

/** A populated polymorphic relationship: `{ relationTo, value }` (Payload 3.88). */
interface LinkTarget {
  relationTo?: string | null
  value?: unknown
}

export interface NavLinkValue {
  type?: 'internal' | 'external' | 'heading' | null
  doc?: LinkTarget | string | number | null
  url?: string | null
  label?: string | null
}

export interface NavigationDoc {
  label?: string | null
  link?: NavLinkValue | null
  groups?:
    | {
        label?: string | null
        link?: NavLinkValue | null
        items?: { link?: NavLinkValue | null }[] | null
      }[]
    | null
  order?: number | null
}

/** A resolved link, or null when it cannot produce one. */
interface Resolved {
  url: string
  label: string | null
}

const isRoutable = (collection: string): collection is NavLinkableCollection =>
  collection in TITLE_FIELD

/**
 * The target's own title, for the label fallback. Only available when the
 * relationship was populated (depth >= 1); at depth 0 `value` is a bare id and
 * there is no title to read, so the item's own label has to carry it.
 */
const titleOf = (collection: NavLinkableCollection, value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) return null
  const title = (value as Record<string, unknown>)[TITLE_FIELD[collection]]
  return typeof title === 'string' && title.trim().length > 0 ? title : null
}

const slugOf = (value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) return null
  const slug = (value as Record<string, unknown>).slug
  return typeof slug === 'string' && slug.length > 0 ? slug : null
}

/**
 * One link → a URL and the title to fall back to, or null.
 *
 * Returns null rather than throwing or emitting `#`: a menu entry whose target
 * was unpublished or deleted out from under it is DROPPED from the menu. That
 * is the conservative half of "a bad link cannot publish" — the validation
 * stops one being created, and this stops a stale one rendering as a dead link
 * if the target goes away afterwards.
 */
export const resolveLink = (link: NavLinkValue | null | undefined): Resolved | null => {
  if (!link) return null

  if (link.type === 'external') {
    const url = typeof link.url === 'string' ? link.url.trim() : ''
    return url.length > 0 ? { url, label: null } : null
  }

  if (link.type === 'internal') {
    const doc = link.doc
    if (typeof doc !== 'object' || doc === null) return null
    const collection = typeof doc.relationTo === 'string' ? doc.relationTo : null
    if (!collection || !isRoutable(collection)) return null
    const slug = slugOf(doc.value)
    if (!slug) return null
    return { url: pathFor(collection, slug), label: titleOf(collection, doc.value) }
  }

  return null
}

/** The wording a menu entry shows: its own override, else the target's title. */
const labelFor = (
  link: NavLinkValue | null | undefined,
  resolved: Resolved | null,
): string | null => {
  const override = typeof link?.label === 'string' ? link.label.trim() : ''
  if (override.length > 0) return override
  return resolved?.label ?? null
}

const resolveGroup = (group: NonNullable<NavigationDoc['groups']>[number]): NavGroup | null => {
  const label = typeof group.label === 'string' ? group.label.trim() : ''
  if (label.length === 0) return null

  const items: NavItem[] = []
  for (const row of group.items ?? []) {
    const resolved = resolveLink(row?.link)
    if (!resolved) continue
    const itemLabel = labelFor(row?.link, resolved)
    if (!itemLabel) continue
    items.push({ label: itemLabel, url: resolved.url })
  }

  // NO LINKS, NO COLUMN — and therefore no caret, since `resolveNavigation`
  // only attaches a panel when a group survives.
  //
  // This used to keep a zero-item column when its heading was linked, on the
  // theory that a linked heading "earns its place". The renderer disagrees:
  // `PrimaryNav` suppresses a single column's heading (`showTitle` is
  // `groups.length > 1`), so that case drew a caret opening an empty box, and
  // `MobileNav` has the same hole. A button whose dropdown is blank is worse
  // than one link fewer.
  //
  // The cost, stated: a heading's own page stops being reachable from the menu
  // until something is added under it. That is a half-finished column, and the
  // remedy is to finish it — or to point a leaf at the same page.
  if (items.length === 0) return null

  // Resolved after the guard: a dropped column has no use for its heading.
  const headingLink = resolveGroupHeading(group)

  return headingLink ? { label, url: headingLink.url, items } : { label, items }
}

/** A column heading may be a link or, with `type: 'heading'`, nothing at all. */
const resolveGroupHeading = (
  group: NonNullable<NavigationDoc['groups']>[number],
): Resolved | null => (group.link?.type === 'heading' ? null : resolveLink(group.link))

const byOrder = (a: NavigationDoc, b: NavigationDoc): number => {
  const ao = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY
  const bo = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY
  if (ao !== bo) return ao - bo
  return (a.label ?? '').localeCompare(b.label ?? '')
}

/**
 * The published menu, or the code-owned one.
 *
 * THE FALLBACK IS LOAD-BEARING, not defensive padding. Code ships ahead of
 * content here as everywhere else — a deploy never seeds — so between this
 * merging and the first `navigation.json` load, every lane and every fresh CI
 * database has an empty `navigation` collection. Without the fallback that is a
 * site with no header menu, and it is also a red `layout.e2e.spec.ts` and
 * `navPanels.int.spec.ts`, both of which assert against the real shipped nav.
 *
 * So the collection is an OVERRIDE of `site-content.ts`, not a replacement for
 * it. Seeding the collection takes over the menu; emptying it hands the menu
 * back to the code-owned tree rather than breaking the site.
 */
export const resolveNavigation = (docs: NavigationDoc[]): NavItem[] => {
  const items: NavItem[] = []

  for (const doc of [...docs].sort(byOrder)) {
    const label = typeof doc.label === 'string' ? doc.label.trim() : ''
    if (label.length === 0) continue
    const resolved = resolveLink(doc.link)
    // Every top-level button is a link — `layout.e2e.spec.ts` pins all seven as
    // visible links, and `PrimaryNav` keys and hrefs off `item.url`. One that
    // cannot resolve a URL is dropped rather than rendered as a dead button.
    if (!resolved) continue

    const groups: NavGroup[] = []
    for (const group of doc.groups ?? []) {
      const resolvedGroup = resolveGroup(group)
      if (resolvedGroup) groups.push(resolvedGroup)
    }

    items.push(
      groups.length > 0
        ? { label, url: resolved.url, panel: { groups } }
        : { label, url: resolved.url },
    )
  }

  return items.length > 0 ? items : navigation.mainNav
}
