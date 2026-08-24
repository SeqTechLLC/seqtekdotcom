import type { Metadata } from 'next'

import type { Media } from '@/payload-types'
import { siteSettings } from '@/lib/site-content'

// spec 004 Phase 2 (T007). Maps a document's `seo` group → Next `Metadata`,
// with site-level fallbacks.
//
// spec 011 T013: the company name and tagline used as fallbacks come from the
// code-owned `site-content.ts` constant, not from a CMS global. Site chrome is
// code-owned (ADR 0010) and these two values changed roughly once a decade —
// see the Site Settings withdrawal in FR-003/FR-004. The `%s | SEQTEK` title template lives on the
// root layout's metadata export, so `title` here is the bare page title and
// the framework wraps it. No em dashes in any emitted public copy (project
// convention). Research §D7.

/** The shared `seo` group shape (caseStudies / services / pages / posts / …). */
export interface SeoGroup {
  metaTitle?: string | null
  metaDescription?: string | null
  ogImage?: Media | string | number | null
}

export interface MetadataFallbacks {
  /** Bare page title (no site suffix — the layout template adds it). */
  title: string
  /** Description fallback when `seo.metaDescription` is empty. */
  description?: string | null
  /**
   * Emit the title as `{ absolute }` so the root layout's `%s | SEQTEK`
   * template is bypassed. Used by the homepage (which is itself the brand
   * landing — `SEQTEK | SEQTEK` would be silly).
   */
  absoluteTitle?: boolean
}

// Ultimate description fallback so EVERY page emits a meta description (a
// missing one fails the Lighthouse SEO gate). Used when neither the doc's
// `seo.metaDescription`, the per-page fallback, nor the site tagline is set.
// No em dashes (project rule).
const DEFAULT_DESCRIPTION =
  'SEQTEK is a Tulsa technology consultancy delivering strategy, software delivery, and localshoring across Oklahoma, Northwest Arkansas, and Kansas City.'

const ogImageUrl = (ogImage: SeoGroup['ogImage']): string | undefined => {
  if (ogImage && typeof ogImage === 'object' && 'url' in ogImage && ogImage.url) {
    return ogImage.url
  }
  return undefined
}

const firstNonEmpty = (...vals: Array<string | null | undefined>): string | undefined => {
  for (const v of vals) {
    const trimmed = v?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

/**
 * Build per-route `Metadata` from a doc's `seo` group with site-level
 * fallbacks. Collections with no `seo` group (e.g. `teamMembers`) pass `null`
 * and rely entirely on `fallbacks` (research §D7 caveat).
 */
export const buildMetadata = (
  seo: SeoGroup | null | undefined,
  fallbacks: MetadataFallbacks,
): Metadata => {
  const title = firstNonEmpty(seo?.metaTitle, fallbacks.title) ?? fallbacks.title

  const description =
    firstNonEmpty(seo?.metaDescription, fallbacks.description, siteSettings.tagline) ??
    DEFAULT_DESCRIPTION

  const image = ogImageUrl(seo?.ogImage)

  return {
    title: fallbacks.absoluteTitle ? { absolute: title } : title,
    description,
    openGraph: {
      title,
      ...(description ? { description } : {}),
      type: 'website',
      siteName: siteSettings.companyName,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      ...(description ? { description } : {}),
      ...(image ? { images: [image] } : {}),
    },
  }
}
