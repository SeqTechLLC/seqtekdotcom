import 'server-only'

import { getPayloadInstance } from './payload'

// spec 004 — the draft side of the render contract (route-render.md / D2).
// Detail routes branch on `draftMode().isEnabled`: published reads go through
// the `unstable_cache` readers in `payload.ts` (kept draft-free so the C2
// keystone scan holds), draft reads come through here. `draft: true` +
// `overrideAccess: true` is safe because draft mode is only enabled by the
// editorial-auth-gated `/preview/[collection]/[slug]` route.

export type PreviewCollection =
  | 'pages'
  | 'caseStudies'
  | 'posts'
  | 'services'
  | 'servicePillars'
  | 'workshops'
  | 'teamMembers'

export const getDraftBySlug = async <T>(
  collection: PreviewCollection,
  slug: string,
): Promise<T | null> => {
  const payload = await getPayloadInstance()
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    draft: true,
    overrideAccess: true,
    depth: 2,
    limit: 1,
  })
  return (docs[0] as T | undefined) ?? null
}
