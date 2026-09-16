/**
 * How a collection's slug becomes a URL — for the NAV, which is the only
 * consumer of `pathFor` today.
 *
 * **It is not yet the single source it should be, and pretending otherwise
 * would be the more expensive mistake.** The same knowledge still lives in two
 * other places, each with its own literals: the `switch` in
 * `buildRevalidatePlan` (`src/payload/hooks/revalidateOnChange.ts`) and the
 * per-collection loops in `src/app/(frontend)/sitemap.ts`. Neither imports
 * `pathFor`. The values agree today, and three copies of a route map is how a
 * menu item ends up pointing at `/insights/<slug>` while the revalidation hook
 * busts `/posts/<slug>` and nobody notices until a publish goes stale.
 *
 * So: editing `ROUTE_PREFIX` moves the MENU's URLs and nothing else. Migrating
 * the other two is a mechanical follow-up, deliberately not bundled into the
 * PR that introduced this file — the keystone parity test
 * (`tests/int/lib/payload-cache-tags.int.spec.ts`) pins the hook's output, so
 * that change wants its own diff to be read against.
 *
 * `pages` maps to the empty prefix: a Page's canonical URL is `/<slug>` on the
 * `(frontend)/[slug]` catch-all, not under a segment of its own.
 */

export const ROUTE_PREFIX = {
  pages: '',
  posts: '/insights',
  caseStudies: '/case-studies',
  services: '/services',
  workshops: '/workshops',
  teamMembers: '/team',
  partners: '/partners',
  industries: '/industries',
  locations: '/consulting',
  categories: '/insights/category',
} as const

export type RoutedCollection = keyof typeof ROUTE_PREFIX

/** `('caseStudies', 'acme')` → `/case-studies/acme`. */
export const pathFor = (collection: RoutedCollection, slug: string): string =>
  `${ROUTE_PREFIX[collection]}/${slug}`

/**
 * The collections a menu item may point at, which is deliberately NOT every
 * routed one.
 *
 * `teamMembers`, `locations` and `categories` are omitted: they are routed, so
 * they belong in `ROUTE_PREFIX` above, but none of them is a destination the
 * header menu has ever offered and adding one is a nav decision rather than a
 * schema one. Widening this list is a one-line change when that decision is
 * actually taken.
 */
export const NAV_LINKABLE_COLLECTIONS = [
  'pages',
  'services',
  'workshops',
  'industries',
  'posts',
  'caseStudies',
  'partners',
] as const satisfies readonly RoutedCollection[]

export type NavLinkableCollection = (typeof NAV_LINKABLE_COLLECTIONS)[number]

/** The field on each linkable collection that carries its display name. */
export const TITLE_FIELD: Record<NavLinkableCollection, string> = {
  pages: 'title',
  services: 'title',
  workshops: 'title',
  industries: 'title',
  posts: 'title',
  caseStudies: 'title',
  partners: 'name',
}
