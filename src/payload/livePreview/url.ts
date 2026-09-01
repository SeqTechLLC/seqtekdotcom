import type { LivePreviewConfig } from 'payload'

export type PreviewCollection =
  | 'pages'
  | 'posts'
  | 'caseStudies'
  | 'services'
  | 'workshops'
  | 'teamMembers'
  | 'partners'

export const PREVIEW_COLLECTIONS: readonly PreviewCollection[] = [
  'pages',
  'posts',
  'caseStudies',
  'services',
  'workshops',
  'teamMembers',
  'partners',
] as const

type DocLike = { slug?: string }

const PUBLIC_PATH_BUILDERS: Record<PreviewCollection, (doc: DocLike) => string | null> = {
  pages: (doc) => (doc.slug ? `/${doc.slug}` : null),
  posts: (doc) => (doc.slug ? `/insights/${doc.slug}` : null),
  caseStudies: (doc) => (doc.slug ? `/case-studies/${doc.slug}` : null),
  // ROADMAP SVC-2 restored this builder. It was deleted under spec 011 T017
  // because PR #79 had retired the `/services/[pillar]` routes it pointed at,
  // leaving it to build preview URLs into 404s. `services` is now a routed,
  // draft-enabled, block-composed collection again — every tier resolves at a
  // flat `/services/<slug>` — and its route implements the full draft path, so
  // without this entry that branch would be unreachable dead code.
  services: (doc) => (doc.slug ? `/services/${doc.slug}` : null),
  workshops: (doc) => (doc.slug ? `/workshops/${doc.slug}` : null),
  teamMembers: (doc) => (doc.slug ? `/team/${doc.slug}` : null),
  partners: (doc) => (doc.slug ? `/partners/${doc.slug}` : null),
}

const SITE_URL = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

export const isPreviewCollection = (value: string): value is PreviewCollection =>
  (PREVIEW_COLLECTIONS as readonly string[]).includes(value)

/**
 * Resolve the public-route path for a draft document. Returns `null` when
 * the document has no slug yet. Re-exported so the `/preview` route handler
 * can compute the redirect target from the same source of truth.
 */
export const publicPathFor = (collection: PreviewCollection, doc: DocLike): string | null =>
  PUBLIC_PATH_BUILDERS[collection](doc)

/**
 * Build the live-preview URL for a draft document.
 *
 * The URL deliberately does NOT carry `PREVIEW_SECRET`. The previous design
 * embedded it as a query param, which leaked the env secret into (a) the
 * admin DOM (anyone with admin/editor role can inspect the iframe src),
 * (b) Referer headers for outbound clicks inside the preview frame, and
 * (c) CloudFront / ALB access logs. The route handler now gates on the
 * admin session cookie (`payload-token`) — same-origin so the cookie ships
 * with the iframe request — which is the real auth boundary anyway.
 */
export const buildPreviewUrl = (collection: string, doc: DocLike): string | null => {
  if (!isPreviewCollection(collection)) return null
  if (!doc.slug) return null
  // publicPath is resolved server-side by the route handler from the doc
  // record, so we don't ferry it through the URL — the only thing the
  // route needs is the collection + slug pair.
  return `${SITE_URL()}/preview/${collection}/${encodeURIComponent(doc.slug)}`
}

export const previewBreakpoints: NonNullable<LivePreviewConfig['breakpoints']> = [
  { name: 'mobile', label: 'Mobile', width: 375, height: 667 },
  { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { name: 'desktop', label: 'Desktop', width: 1280, height: 800 },
]

/**
 * Convenience factory for `admin.livePreview` per-collection wiring.
 */
export const livePreviewFor = (collection: PreviewCollection): LivePreviewConfig => ({
  url: ({ data }) => buildPreviewUrl(collection, data as DocLike) ?? '',
  breakpoints: previewBreakpoints,
})
