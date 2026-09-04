import type { MetadataRoute } from 'next'

import { publishedSlugsFor } from '@/lib/payload'
import { redirectMap } from '@/lib/redirects'

// spec 004 T043. Dynamic sitemap from published slugs across the in-scope
// collections (data-model §1). `buildRevalidatePlan` already invalidates
// `/sitemap.xml` on every content change, so this stays fresh.

export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://seqtek-preview.com').replace(
  /\/$/,
  '',
)

const url = (path: string): string => `${SITE_URL}${path}`

// feat/services-restructure (ADR 0009). The three peer-offering routes
// (/services/[offering]). Workshops is NOT here — it has its own /workshops
// route (already a STATIC_PATH). The offering content lives in `service-*`
// Pages whose canonical URL is /services/<offering>, NOT the flat /service-*
// slug — so those page slugs are excluded from the flat-page loop below.
// ROADMAP SVC-2: both hardcoded lists are gone. Services and their groups are
// collections now, so their URLs come from published slugs like every other
// type and a new one needs no code change.
//
// This set is the ONE thing that still has to be named. It is not a route map —
// it is the retiring `service-*` Pages, excluded from the flat-page loop below.
// `service-overview` because `/services` now 301s onto the axis page and the
// Page behind it is retired; the other three because SVC-2 deleted
// `/services/[offering]`, the only route that ever rendered them. Dropping
// them from this set would not make them unreachable, it would ADVERTISE them
// at `/service-ai-integration` — flat URLs that were never canonical and that
// retire on the next content seed (ROADMAP SVC-2 residual). Delete an entry
// when its Page record goes.
const SERVICE_PAGE_SLUGS_NOT_IN_SITEMAP = new Set([
  // `/services` is a 301 onto `/services/what-we-do` now, so the overview Page
  // is unreachable and its flat slug must not be advertised either — a
  // redirecting URL in a sitemap is the defect the redirect-source exclusion
  // below already guards against.
  'service-overview',
  'service-localshoring',
  'service-ai-integration',
  'service-digital-transformation',
])

const STATIC_PATHS = [
  '/',
  '/case-studies',
  '/insights',
  '/workshops',
  '/team',
  // NOTE: `/partners` is deliberately NOT static — it is added below only when
  // the collection has published docs (see the partner loop).
  '/privacy-policy', // spec 006 US5 (T025): static legal route
  '/terms-of-service', // static legal route (same shape as /privacy-policy)
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = new Set<string>(STATIC_PATHS)

  // Build-time resilience: `next build` prerenders this route, but the Docker /
  // CI build runs against an empty, unmigrated DB (the build must not depend on
  // DB content — the rest of the app's public render is dynamic for the same
  // reason). If the published-slug reads fail, ship the static surface paths
  // and let ISR backfill the dynamic slugs at runtime (revalidate + on-demand
  // `${collection}_list` tag invalidation).
  try {
    const [
      pageSlugs,
      caseStudySlugs,
      postSlugs,
      workshopSlugs,
      teamSlugs,
      partnerSlugs,
      serviceSlugs,
      industrySlugs,
    ] = await Promise.all([
      publishedSlugsFor('pages'),
      publishedSlugsFor('caseStudies'),
      publishedSlugsFor('posts'),
      publishedSlugsFor('workshops'),
      publishedSlugsFor('teamMembers'),
      publishedSlugsFor('partners'),
      publishedSlugsFor('services'),
      publishedSlugsFor('industries'),
    ])

    // A page slug that collides with a 301 source (e.g. the audit-seeded
    // `touchstone-workshops` doc, if ever published) would put a
    // redirecting URL in the sitemap — the redirect wins over the route,
    // so exclude redirect sources here (PR #49 review hardening). The
    // retiring `service-*` Pages are excluded too — see the set above.
    const redirectSources = new Set(redirectMap.map((r) => r.source))
    for (const slug of pageSlugs) {
      if (SERVICE_PAGE_SLUGS_NOT_IN_SITEMAP.has(slug)) continue
      if (!redirectSources.has(`/${slug}`)) paths.add(`/${slug}`)
    }
    for (const slug of caseStudySlugs) paths.add(`/case-studies/${slug}`)
    for (const slug of postSlugs) paths.add(`/insights/${slug}`)
    for (const slug of workshopSlugs) paths.add(`/workshops/${slug}`)
    for (const slug of teamSlugs) paths.add(`/team/${slug}`)
    // SVC-2: one flat namespace and one collection, so every tier — axis page,
    // group page and service — is just `/services/<slug>`.
    for (const slug of serviceSlugs) paths.add(`/services/${slug}`)
    // ROADMAP IND-1. Published-only, like every other loop — an industry that
    // exists purely to tag case studies stays a draft and never enters the
    // sitemap or the route.
    for (const slug of industrySlugs) paths.add(`/industries/${slug}`)
    // ADR 0009 metadata collection — no exclusion set needed here (unlike the
    // `service-*` Pages): a partner's canonical URL IS `/partners/<slug>`.
    // The index is listed only once it has cards. Code ships ahead of content
    // (a deploy never seeds), so between merge and the first `partners.json`
    // load `/partners` is a heading over an empty grid — not a URL to hand a
    // crawler. The `${collection}_list` tag busts this the moment one publishes.
    if (partnerSlugs.length > 0) {
      paths.add('/partners')
      for (const slug of partnerSlugs) paths.add(`/partners/${slug}`)
    }
  } catch (err) {
    console.warn('[sitemap] published-slug read failed; emitting static paths only:', err)
  }

  return Array.from(paths).map((path) => ({
    url: url(path),
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
