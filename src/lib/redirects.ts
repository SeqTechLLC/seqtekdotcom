import type { Redirect } from 'next/dist/lib/load-custom-routes'

// spec 004 T039 (redirect-map.md). 301 map from old Wix URLs → canonical
// routes. Source of truth: INTEGRATIONS.md §9 — reconciled in the same PR.
// Extracted to a module so next.config.ts and the RM test (T040) share one
// definition. Distinct from src/payload/seed/slugRewrites.ts (bare slugs for
// the seed; this is the HTTP path-level contract with route prefixes).
//
// The two INTEGRATIONS §9 identity rows (`/contact` → `/contact`,
// `/privacy-policy` → `/privacy-policy`) are intentionally OMITTED: a redirect
// to itself is a loop, not a redirect — those URLs simply don't change.

export const redirectMap: Redirect[] = [
  { source: '/about-us-1', destination: '/about', permanent: true },
  { source: '/our-services', destination: '/services', permanent: true },
  { source: '/workshops', destination: '/touchstone-workshops', permanent: true },
  { source: '/blog-old', destination: '/insights', permanent: true },
  { source: '/blog-old/:path*', destination: '/insights/:path*', permanent: true },
  {
    source: '/organizational-strategy-1-5',
    // /resources/* is a planned route (ARCHITECTURE §3, ScoreApp) not built in
    // spec 004 — a documented deferred destination (see redirects.int.spec.ts).
    destination: '/resources/organizational-maturity-assessment',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-1-1-3',
    destination: '/case-studies/airline-automation',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-1-1-3-1',
    destination: '/case-studies/oil-gas-modernization',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-1-1-3-1-1',
    destination: '/case-studies/banking-integration-platform',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-3-1-1-1',
    destination: '/case-studies',
    permanent: true,
  },
  {
    source: '/case-study-3',
    destination: '/case-studies/mobile-apps-remote-operations',
    permanent: true,
  },
  {
    source: '/case-study-4',
    destination: '/case-studies/retail-pos-update-experience',
    permanent: true,
  },
  {
    source: '/case-study-5',
    destination: '/case-studies/data-warehouse-strategy',
    permanent: true,
  },
  {
    source: '/driving-innovation-case-study',
    destination: '/case-studies/healthcare-ux-redesign',
    permanent: true,
  },
  {
    source: '/modernizing-healthcare-case-study',
    destination: '/case-studies/healthcare-data-modernization',
    permanent: true,
  },
]
