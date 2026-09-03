import type { Redirect } from 'next/dist/lib/load-custom-routes'

// spec 004 T039 (redirect-map.md). 301 map from old Wix URLs → canonical
// routes. Source of truth: INTEGRATIONS.md §9 — reconciled in the same PR.
// Extracted to a module so next.config.ts and the RM test (T040) share one
// definition. This is the HTTP path-level contract, with route prefixes. The
// seed-side bare-slug map it used to pair with (`seed/slugRewrites.ts`) went
// with the audit seeder in spec 011; every mapping it held is represented here.
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
  { source: '/our-services', destination: '/services/what-we-do', permanent: true },
  // `/services` was the four-offering overview (`service-overview` Page). The
  // two-axis nav links neither it nor anything through it, so it became an
  // orphan that only legacy traffic reached. The axis page IS the overview of
  // what we do, so the URL collapses onto it rather than surviving as a second
  // index above two axes.
  { source: '/services', destination: '/services/what-we-do', permanent: true },
  // Old-Wix `/workshops` is now an identity (the canonical route IS
  // /workshops since the 2026-06-11 IA correction: ONE Touchstone workshop
  // among three, no branded umbrella) — omitted per the identity-row rule.
  // The previously-canonical branded URLs 301 to the generic routes so ad
  // links and bookmarks survive.
  { source: '/touchstone-workshops', destination: '/workshops', permanent: true },
  { source: '/touchstone-workshops/:slug*', destination: '/workshops/:slug*', permanent: true },
  { source: '/blog-old', destination: '/insights', permanent: true },
  // Wix serves blog posts at `/post/<slug>`, NOT `/blog-old/<slug>`. The 18 old
  // posts are deliberately not carried over (generic SEO copy; the /insights
  // pieces are original), so both patterns FLATTEN onto the listing. Exempted
  // from the wildcard rule via FLATTENED_SOURCES in the RM test.
  { source: '/blog-old/:path*', destination: '/insights', permanent: true },
  { source: '/post/:slug*', destination: '/insights', permanent: true },
  {
    source: '/organizational-strategy-1-5',
    // The Wix "Assessment" page. The maturity assessment is retired (2026-08-08),
    // so /resources/* is never built and this used to 301 into a 404. The page was
    // a lead-gen entry under the organizational-strategy pillar, which already
    // funnels to /workshops (see the pillar + leaf rows below).
    destination: '/workshops',
    permanent: true,
  },
  // The old Wix case studies. The new set is a different, NAMED set of clients
  // (Endurance Lift, Hogan, NovaMud, WellChecked, Taurex ×4), so the old
  // anonymous industry studies have no one-to-one successor and land on the
  // listing. Do NOT re-point these at a per-slug study unless that slug actually
  // exists — RM3 enforces that via KNOWN_DETAIL_DESTINATIONS.
  { source: '/organizational-strategy-1-1-1-3', destination: '/case-studies', permanent: true },
  { source: '/organizational-strategy-1-1-1-3-1', destination: '/case-studies', permanent: true },
  { source: '/organizational-strategy-1-1-1-3-1-1', destination: '/case-studies', permanent: true },
  { source: '/organizational-strategy-1-3-1-1-1', destination: '/case-studies', permanent: true },
  { source: '/case-study-3', destination: '/case-studies', permanent: true },
  { source: '/case-study-4', destination: '/case-studies', permanent: true },
  { source: '/case-study-5', destination: '/case-studies', permanent: true },
  { source: '/case-study-6', destination: '/case-studies', permanent: true },
  { source: '/driving-innovation-case-study', destination: '/case-studies', permanent: true },
  { source: '/modernizing-healthcare-case-study', destination: '/case-studies', permanent: true },

  // ---- Workshops -----------------------------------------------------------
  // `/workshops-1` is the live Wix workshops landing. Bare `/workshops` on Wix
  // is the ABANDONED page titled "Old Workshops Page".
  { source: '/workshops-1', destination: '/workshops', permanent: true },
  { source: '/re-align', destination: '/workshops/re-alignment', permanent: true },
  { source: '/fivedysfunctions-1', destination: '/workshops/five-dysfunctions', permanent: true },
  { source: '/fivedysfunctions', destination: '/workshops/five-dysfunctions', permanent: true },
  // "Case Study Workshop" was Touchstone's name on Wix.
  { source: '/casestudyws', destination: '/workshops/touchstone', permanent: true },
  // Orphaned "Strategy & Alignment Workshop" (not linked from the Wix workshops
  // page, which points its Strategy & Alignment card at /re-align). Lands on the
  // listing rather than guessing which of the three it meant.
  { source: '/organizational-strategy-1-1-1-4', destination: '/workshops', permanent: true },
  // Per-market Touchstone landing pages (an a/b variant per city). The four
  // regional pages are an open content gap (CONTENT_NEEDS §9); until they exist
  // these land on the workshop itself.
  { source: '/tulsaacasestudyworkshop', destination: '/workshops/touchstone', permanent: true },
  { source: '/tulsabcasestudyworkshop', destination: '/workshops/touchstone', permanent: true },
  { source: '/okcacasestudyworkshop', destination: '/workshops/touchstone', permanent: true },
  { source: '/okcbcasestudyworkshop', destination: '/workshops/touchstone', permanent: true },
  { source: '/kcacasestudyworkshop', destination: '/workshops/touchstone', permanent: true },
  { source: '/kcbcasestudyworkshop', destination: '/workshops/touchstone', permanent: true },
  { source: '/nwarkacasestudyworkshop', destination: '/workshops/touchstone', permanent: true },
  { source: '/nwarkbcasestudyworkshop', destination: '/workshops/touchstone', permanent: true },

  // ---- Careers -------------------------------------------------------------
  // There is no Careers page on the new site (CONTENT_NEEDS §9), so the Wix
  // careers page and its role descriptions point at the contact form: the ask is
  // the same either way, start a conversation. Revisit if a Careers page ships.
  //
  // "goverment" and "machione" reproduce the Wix misspellings verbatim. The typo
  // is what is indexed; a corrected slug would match nothing.
  { source: '/careers-1', destination: '/contact', permanent: true },
  { source: '/careers', destination: '/contact', permanent: true },
  { source: '/business-analyst', destination: '/contact', permanent: true },
  { source: '/database-developer', destination: '/contact', permanent: true },
  { source: '/front-end-developer', destination: '/contact', permanent: true },
  { source: '/full-stack-developer', destination: '/contact', permanent: true },
  { source: '/goverment-contract-specialist', destination: '/contact', permanent: true },
  { source: '/java-developer', destination: '/contact', permanent: true },
  { source: '/machione-learning-engineer', destination: '/contact', permanent: true },
  { source: '/project-management', destination: '/contact', permanent: true },
  { source: '/software-quality-assurance', destination: '/contact', permanent: true },
  { source: '/ui-ux-developer', destination: '/contact', permanent: true },

  // ---- AI Dev Guide --------------------------------------------------------
  // The Wix lead magnet: a landing page and a thank-you page gating a PDF. The
  // guide's content is published ungated as the insight post instead, so both
  // URLs land there and the HubSpot form gate is retired with them.
  { source: '/ai-dev-guide-download', destination: '/insights/the-skill-shift', permanent: true },
  {
    source: '/thank-you-download-guide',
    destination: '/insights/the-skill-shift',
    permanent: true,
  },

  // ---- The old Wix Services menu -------------------------------------------
  // The old site's main nav. These used to fold onto /services/ai-integration
  // and /services/digital-transformation, which were `/services/[offering]`
  // Page slugs.
  //
  // ROADMAP SVC-2 deleted that route, and Brent's structure retires both as
  // service names, so neither URL comes back. They pointed at `/services` as
  // an interim while no service was seeded; the axis page now exists and is
  // what the nav points at, so they land there directly.
  //
  // ONE hop, deliberately: `/services` itself redirects to the same place a
  // few lines down, so leaving these on `/services` would chain. Nothing is
  // live, so redirects are REPLACED rather than layered (Kenn, 2026-08-31).
  //
  // Leadership/process/PM leaves still land on /workshops, the funnel.
  {
    source: '/organizational-strategy-1-1-1-2',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-1-1-2-1',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-1-1-2-1-1',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-3-1',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-3-1-1',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-1-1-1',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-1-3',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-2-1',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-3',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/organizational-strategy-1-4',
    destination: '/services/what-we-do',
    permanent: true,
  },
  // The Wix "Technology & Data" pillar page.
  {
    source: '/technology-and-data',
    destination: '/services/what-we-do',
    permanent: true,
  },
  { source: '/organizational-strategy-1-1', destination: '/workshops', permanent: true },
  { source: '/organizational-strategy-1-1-1', destination: '/workshops', permanent: true },
  { source: '/organizational-strategy-1-1-2', destination: '/workshops', permanent: true },
  { source: '/organizational-strategy-1-2', destination: '/workshops', permanent: true },

  // The retired 3-pillar / 9-service IA. Pillar slugs and the nine leaf service
  // slugs were read live from the DB before finalizing. Workshops is the primary
  // funnel, so the organizational-strategy pillar + its workshop/strategy leaves
  // land on /workshops; everything else lands on the What We Do axis for the
  // reason given above. These are internal route→route 301s (INTEGRATIONS §9),
  // and they stay ONE hop: `/services/ai-automation` points straight at
  // `/services/what-we-do` rather than at `/services`, which is itself a 301.
  { source: '/services/ai-automation', destination: '/services/what-we-do', permanent: true },
  {
    source: '/services/technology-data',
    destination: '/services/what-we-do',
    permanent: true,
  },
  { source: '/services/organizational-strategy', destination: '/workshops', permanent: true },
  // ai-automation leaves → the What We Do axis (see the note above: the
  // AI Integration URL they used to fold onto no longer exists)
  {
    source: '/services/ai-automation/ai-assisted-modernization',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/services/ai-automation/machine-learning-solutions',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/services/ai-automation/process-automation',
    destination: '/services/what-we-do',
    permanent: true,
  },
  // technology-data leaves → the What We Do axis, same reason
  {
    source: '/services/technology-data/application-modernization',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/services/technology-data/cloud-data-engineering',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/services/technology-data/custom-software-development',
    destination: '/services/what-we-do',
    permanent: true,
  },
  // organizational-strategy leaves → Workshops (the funnel), except
  // fractional-product-ownership, which lands on the What We Do axis
  {
    source: '/services/organizational-strategy/team-workshops',
    destination: '/workshops',
    permanent: true,
  },
  {
    source: '/services/organizational-strategy/fractional-product-ownership',
    destination: '/services/what-we-do',
    permanent: true,
  },
  {
    source: '/services/organizational-strategy/strategy-alignment',
    destination: '/workshops',
    permanent: true,
  },
]
