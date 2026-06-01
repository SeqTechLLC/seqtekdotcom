import type { MetadataRoute } from 'next'

import { listServicePillars, listServices, publishedSlugsFor } from '@/lib/payload'
import type { Service } from '@/payload-types'

// spec 004 T043. Dynamic sitemap from published slugs across the in-scope
// collections (data-model §1). `buildRevalidatePlan` already invalidates
// `/sitemap.xml` on every content change, so this stays fresh.

export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://seqtek-preview.com').replace(
  /\/$/,
  '',
)

const url = (path: string): string => `${SITE_URL}${path}`

const pillarSlugOf = (service: Service): string | undefined =>
  service.pillar && typeof service.pillar === 'object' && 'slug' in service.pillar
    ? (service.pillar.slug ?? undefined)
    : undefined

const STATIC_PATHS = [
  '/',
  '/case-studies',
  '/insights',
  '/services',
  '/touchstone-workshops',
  '/team',
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
    const [pageSlugs, caseStudySlugs, postSlugs, workshopSlugs, pillars, services] =
      await Promise.all([
        publishedSlugsFor('pages'),
        publishedSlugsFor('caseStudies'),
        publishedSlugsFor('posts'),
        publishedSlugsFor('workshops'),
        listServicePillars(),
        listServices(),
      ])

    for (const slug of pageSlugs) paths.add(`/${slug}`)
    for (const slug of caseStudySlugs) paths.add(`/case-studies/${slug}`)
    for (const slug of postSlugs) paths.add(`/insights/${slug}`)
    for (const slug of workshopSlugs) paths.add(`/touchstone-workshops/${slug}`)
    for (const pillar of pillars) {
      if (pillar.slug) paths.add(`/services/${pillar.slug}`)
    }
    for (const service of services) {
      const pillarSlug = pillarSlugOf(service)
      if (pillarSlug && service.slug) paths.add(`/services/${pillarSlug}/${service.slug}`)
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
