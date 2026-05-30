/**
 * Wix → canonical slug map. Source of truth: `docs/INTEGRATIONS.md` §9.
 * When that table changes, this map changes in the same PR (FR-031,
 * `docs/CONTENT_MIGRATION.md` §6).
 *
 * Keys are the bare Wix slug (no leading `/`, no host); values are the
 * canonical slug stored on the Payload doc. Audit URLs come through
 * `audit/*.json` keyed by full URL — `bareSlug()` below strips host/path.
 */
export const slugRewrites: Readonly<Record<string, string>> = Object.freeze({
  'case-study-3': 'mobile-apps-remote-operations',
  'case-study-4': 'retail-pos-update-experience',
  'case-study-5': 'data-warehouse-strategy',
  'driving-innovation-case-study': 'healthcare-ux-redesign',
  'modernizing-healthcare-case-study': 'healthcare-data-modernization',
  'organizational-strategy-1-1-1-3': 'airline-automation',
  'organizational-strategy-1-1-1-3-1': 'oil-gas-modernization',
  'organizational-strategy-1-1-1-3-1-1': 'banking-integration-platform',
  'about-us-1': 'about',
  'our-services': 'services',
  workshops: 'touchstone-workshops',
  'blog-old': 'insights',
  // Routing prefix (`/resources/`) is applied by the URL builder; the stored
  // slug must satisfy `validateSlug` (^[a-z0-9]+(?:-[a-z0-9]+)*$). The
  // INTEGRATIONS.md §9 redirect still points at `/resources/...`.
  'organizational-strategy-1-5': 'organizational-maturity-assessment',
})

/** Strip scheme, host, leading/trailing slashes from a URL or path. */
export function bareSlug(urlOrPath: string): string {
  const trimmed = urlOrPath.trim()
  if (!trimmed) return ''
  let path = trimmed
  const schemeMatch = path.match(/^[a-z]+:\/\/[^/]+(\/.*)?$/i)
  if (schemeMatch) path = schemeMatch[1] ?? '/'
  return path.replace(/^\/+|\/+$/g, '')
}

/** Apply the §9 rewrite map; identity for unknown slugs. */
export function applySlugRewrite(rawSlug: string): string {
  const bare = bareSlug(rawSlug)
  return slugRewrites[bare] ?? bare
}
