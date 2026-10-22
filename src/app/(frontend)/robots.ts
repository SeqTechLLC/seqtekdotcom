import type { MetadataRoute } from 'next'

// The lane's task definition sets NEXT_PUBLIC_SITE_URL at runtime, and the image is built once with
// it unset. A statically generated robots.txt would bake in the fallback origin, so render per request.
export const dynamic = 'force-dynamic'

const siteUrl = (): string =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://seqtek-preview.com').replace(/\/$/, '')

// Crawl everything public, keep crawlers out of the admin and the API, and point them at the
// sitemap. `/api/media/file/*` is the admin's media fallback; public pages serve media from
// `/media/*`, which stays crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
