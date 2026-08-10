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
  { source: '/about-us-1', destination: '/our-story', permanent: true },
  // "About" and "Our Story" were one page under two names; the page is now
  // /our-story everywhere (nav, title, slug). Internal route→route 301 so old
  // /about links, bookmarks, and any indexed URL survive the rename.
  { source: '/about', destination: '/our-story', permanent: true },
  { source: '/our-services', destination: '/services', permanent: true },
  // Old-Wix `/workshops` is now an identity (the canonical route IS
  // /workshops since the 2026-06-11 IA correction: ONE Touchstone workshop
  // among three, no branded umbrella) — omitted per the identity-row rule.
  // The previously-canonical branded URLs 301 to the generic routes so ad
  // links and bookmarks survive.
  { source: '/touchstone-workshops', destination: '/workshops', permanent: true },
  { source: '/touchstone-workshops/:slug*', destination: '/workshops/:slug*', permanent: true },
  { source: '/blog-old', destination: '/insights', permanent: true },
  { source: '/blog-old/:path*', destination: '/insights/:path*', permanent: true },
  {
    source: '/organizational-strategy-1-5',
    // The Wix "Assessment" page. The maturity assessment is retired (2026-08-08),
    // so /resources/* is never built and this used to 301 into a 404. The page was
    // a lead-gen entry under the organizational-strategy pillar, which already
    // funnels to /workshops (see the pillar + leaf rows below).
    destination: '/workshops',
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

  // feat/services-restructure — the retired 3-pillar / 9-service IA folds into
  // the four peer offerings (ADR 0009). Pillar slugs and the nine leaf service
  // slugs were read live from the DB before finalizing. Workshops is the primary
  // funnel, so the organizational-strategy pillar + its workshop/strategy leaves
  // land on /workshops; fractional-product-ownership folds into digital
  // transformation. These are internal route→route 301s (INTEGRATIONS §9).
  { source: '/services/ai-automation', destination: '/services/ai-integration', permanent: true },
  {
    source: '/services/technology-data',
    destination: '/services/digital-transformation',
    permanent: true,
  },
  { source: '/services/organizational-strategy', destination: '/workshops', permanent: true },
  // ai-automation leaves → AI Integration
  {
    source: '/services/ai-automation/ai-assisted-modernization',
    destination: '/services/ai-integration',
    permanent: true,
  },
  {
    source: '/services/ai-automation/machine-learning-solutions',
    destination: '/services/ai-integration',
    permanent: true,
  },
  {
    source: '/services/ai-automation/process-automation',
    destination: '/services/ai-integration',
    permanent: true,
  },
  // technology-data leaves → Digital Transformation
  {
    source: '/services/technology-data/application-modernization',
    destination: '/services/digital-transformation',
    permanent: true,
  },
  {
    source: '/services/technology-data/cloud-data-engineering',
    destination: '/services/digital-transformation',
    permanent: true,
  },
  {
    source: '/services/technology-data/custom-software-development',
    destination: '/services/digital-transformation',
    permanent: true,
  },
  // organizational-strategy leaves → Workshops (funnel) except FPO → Digital Transformation
  {
    source: '/services/organizational-strategy/team-workshops',
    destination: '/workshops',
    permanent: true,
  },
  {
    source: '/services/organizational-strategy/fractional-product-ownership',
    destination: '/services/digital-transformation',
    permanent: true,
  },
  {
    source: '/services/organizational-strategy/strategy-alignment',
    destination: '/workshops',
    permanent: true,
  },
]
