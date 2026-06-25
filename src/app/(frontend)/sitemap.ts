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
const SERVICE_OFFERING_PATHS = [
  '/services/localshoring',
  '/services/ai-integration',
  '/services/digital-transformation',
]

// The block-composed Pages that back /services (overview + the three offerings).
// Their canonical URL is /services or /services/<offering>, never the flat
// /service-* slug, so they are excluded from the flat-page sitemap loop.
const SERVICE_PAGE_SLUGS = new Set([
  'service-overview',
  'service-localshoring',
  'service-ai-integration',
  'service-digital-transformation',
])

const STATIC_PATHS = [
  '/',
  '/case-studies',
  '/insights',
  '/services',
  ...SERVICE_OFFERING_PATHS,
  '/workshops',
  '/team',
  '/privacy-policy', // spec 006 US5 (T025): static legal route
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
    const [pageSlugs, caseStudySlugs, postSlugs, workshopSlugs, teamSlugs] = await Promise.all([
      publishedSlugsFor('pages'),
      publishedSlugsFor('caseStudies'),
      publishedSlugsFor('posts'),
      publishedSlugsFor('workshops'),
      publishedSlugsFor('teamMembers'),
    ])

    // A page slug that collides with a 301 source (e.g. the audit-seeded
    // `touchstone-workshops` doc, if ever published) would put a
    // redirecting URL in the sitemap — the redirect wins over the route,
    // so exclude redirect sources here (PR #49 review hardening). The
    // `service-*` offering Pages are excluded too: their canonical URL is
    // /services/<offering> (a STATIC_PATH), not the flat /service-* slug.
    const redirectSources = new Set(redirectMap.map((r) => r.source))
    for (const slug of pageSlugs) {
      if (SERVICE_PAGE_SLUGS.has(slug)) continue
      if (!redirectSources.has(`/${slug}`)) paths.add(`/${slug}`)
    }
    for (const slug of caseStudySlugs) paths.add(`/case-studies/${slug}`)
    for (const slug of postSlugs) paths.add(`/insights/${slug}`)
    for (const slug of workshopSlugs) paths.add(`/workshops/${slug}`)
    for (const slug of teamSlugs) paths.add(`/team/${slug}`)
  } catch (err) {
    console.warn('[sitemap] published-slug read failed; emitting static paths only:', err)
  }

  return Array.from(paths).map((path) => ({
    url: url(path),
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
