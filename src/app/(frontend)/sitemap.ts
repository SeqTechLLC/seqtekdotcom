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
// type and a new one needs no code change. `service-overview` stays excluded
// below because /services is a STATIC_PATH, not a flat page slug.
const SERVICE_OVERVIEW_PAGE_SLUG = 'service-overview'

const STATIC_PATHS = [
  '/',
  '/case-studies',
  '/insights',
  '/services',
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
    ] = await Promise.all([
      publishedSlugsFor('pages'),
      publishedSlugsFor('caseStudies'),
      publishedSlugsFor('posts'),
      publishedSlugsFor('workshops'),
      publishedSlugsFor('teamMembers'),
      publishedSlugsFor('partners'),
      publishedSlugsFor('services'),
    ])

    // A page slug that collides with a 301 source (e.g. the audit-seeded
    // `touchstone-workshops` doc, if ever published) would put a
    // redirecting URL in the sitemap — the redirect wins over the route,
    // so exclude redirect sources here (PR #49 review hardening). The
    // `service-*` offering Pages are excluded too: their canonical URL is
    // /services/<offering> (a STATIC_PATH), not the flat /service-* slug.
    const redirectSources = new Set(redirectMap.map((r) => r.source))
    for (const slug of pageSlugs) {
      if (slug === SERVICE_OVERVIEW_PAGE_SLUG) continue
      if (!redirectSources.has(`/${slug}`)) paths.add(`/${slug}`)
    }
    for (const slug of caseStudySlugs) paths.add(`/case-studies/${slug}`)
    for (const slug of postSlugs) paths.add(`/insights/${slug}`)
    for (const slug of workshopSlugs) paths.add(`/workshops/${slug}`)
    for (const slug of teamSlugs) paths.add(`/team/${slug}`)
    // SVC-2: one flat namespace and one collection, so every tier — axis page,
    // group page and service — is just `/services/<slug>`.
    for (const slug of serviceSlugs) paths.add(`/services/${slug}`)
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
