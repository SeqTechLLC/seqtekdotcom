import type { LivePreviewConfig } from 'payload'

type DocLike = { slug?: string; pillar?: { slug?: string } | string | null }

const COLLECTION_PATHS: Record<string, (doc: DocLike) => string | null> = {
  pages: (doc) => (doc.slug ? `/${doc.slug}` : null),
  posts: (doc) => (doc.slug ? `/insights/${doc.slug}` : null),
  caseStudies: (doc) => (doc.slug ? `/case-studies/${doc.slug}` : null),
  services: (doc) => {
    if (!doc.slug) return null
    const pillarSlug = typeof doc.pillar === 'object' && doc.pillar ? doc.pillar.slug : undefined
    return pillarSlug ? `/services/${pillarSlug}/${doc.slug}` : `/services/${doc.slug}`
  },
}

const PREVIEW_SECRET = () => process.env.PREVIEW_SECRET ?? ''
const SITE_URL = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

/**
 * Build the live-preview URL for a draft document. Returns `null` when the
 * document has no slug yet (Payload hides the Preview button in that case).
 */
export const buildPreviewUrl = (collection: string, doc: DocLike): string | null => {
  const builder = COLLECTION_PATHS[collection]
  if (!builder) return null
  const _publicPath = builder(doc)
  if (!_publicPath) return null
  const slug = doc.slug ?? ''
  const secret = PREVIEW_SECRET()
  const qs = secret ? `?secret=${encodeURIComponent(secret)}` : ''
  return `${SITE_URL()}/preview/${collection}/${slug}${qs}`
}

export const previewBreakpoints: NonNullable<LivePreviewConfig['breakpoints']> = [
  { name: 'mobile', label: 'Mobile', width: 375, height: 667 },
  { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { name: 'desktop', label: 'Desktop', width: 1280, height: 800 },
]

/**
 * Convenience factory for `admin.livePreview` per-collection wiring.
 */
export const livePreviewFor = (collection: string): LivePreviewConfig => ({
  url: ({ data }) => buildPreviewUrl(collection, data as DocLike) ?? '',
  breakpoints: previewBreakpoints,
})
