import type { Post, SiteSetting } from '@/payload-types'

// spec 004 Phase 2 (T008). JSON-LD builders (research §D7). These return plain
// serializable objects; render them through the nonce-safe `<JsonLd>` server
// component (src/components/seo/JsonLd.tsx) so the emitted `<script>` carries
// the per-request CSP nonce — a raw un-nonced inline script is CSP-blocked
// (Constitution §IV). No em dashes in emitted copy.

export type JsonLdObject = Record<string, unknown>

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://seqtek-preview.com'

const absolute = (path: string): string =>
  path.startsWith('http')
    ? path
    : `${SITE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`

/** Organization schema for the homepage (research §D7). */
export const organizationLd = (siteSettings?: SiteSetting | null): JsonLdObject => {
  const name = siteSettings?.companyName ?? 'SEQTEK'
  const sameAs = [
    siteSettings?.socialLinks?.linkedinUrl,
    siteSettings?.socialLinks?.twitterUrl,
    siteSettings?.socialLinks?.facebookUrl,
  ].filter((u): u is string => typeof u === 'string' && u.length > 0)

  const address = siteSettings?.address
  const postalAddress =
    address && (address.street || address.city)
      ? {
          '@type': 'PostalAddress',
          ...(address.street ? { streetAddress: address.street } : {}),
          ...(address.city ? { addressLocality: address.city } : {}),
          ...(address.state ? { addressRegion: address.state } : {}),
          ...(address.zip ? { postalCode: address.zip } : {}),
          addressCountry: 'US',
        }
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: SITE_URL,
    ...(siteSettings?.tagline ? { description: siteSettings.tagline } : {}),
    ...(siteSettings?.email ? { email: siteSettings.email } : {}),
    ...(siteSettings?.phone ? { telephone: siteSettings.phone } : {}),
    ...(postalAddress ? { address: postalAddress } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

/** Article schema for `/insights/[slug]` (research §D7). */
export const articleLd = (post: Post): JsonLdObject => {
  const author =
    post.author && typeof post.author === 'object' && 'name' in post.author
      ? { '@type': 'Person', name: post.author.name }
      : undefined
  const image =
    post.featuredImage && typeof post.featuredImage === 'object' && 'url' in post.featuredImage
      ? (post.featuredImage.url ?? undefined)
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    url: absolute(`/insights/${post.slug}`),
    ...(image ? { image: [image] } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    ...(author ? { author } : {}),
    publisher: { '@type': 'Organization', name: 'SEQTEK' },
  }
}

export interface BreadcrumbItem {
  name: string
  /** Root-relative path, e.g. `/case-studies/acme`. */
  path: string
}

/** BreadcrumbList schema for nested detail routes (research §D7). */
export const breadcrumbLd = (trail: BreadcrumbItem[]): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absolute(item.path),
  })),
})
