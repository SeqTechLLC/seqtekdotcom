import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getServiceBySlug, getServicePillarBySlug } from '@/lib/payload'
import { getDraftBySlug } from '@/lib/preview'
import { buildMetadata } from '@/lib/metadata'
import { breadcrumbLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { PreviewBanner } from '@/components/layout/PreviewBanner'
import { RenderBlocks } from '@/components/sections/RenderBlocks'
import { resolveLayout } from '@/lib/resolveLayout'
import type { Service, ServicePillar } from '@/payload-types'

// ROADMAP SVC-2 (ADR 0009). Replaces the `[offering]` route, which resolved
// four bare `Page` slugs through hardcoded `OFFERING_TO_SLUG` / `OFFERING_TITLE`
// lookups — so a fifth offering meant editing four lists and deploying, which
// the ADR's own rule says only creating or fixing a *block* should require.
// Everything here now derives from the collections, like every other type.
//
// ONE ROUTE, TWO COLLECTIONS, ONE FLAT NAMESPACE. The menu is hierarchical and
// the URLs are not: a group page and a leaf page both live at `/services/<slug>`.
// That is deliberate (ROADMAP NAV-1) — a leaf cross-listed under two groups must
// still resolve to ONE address, so the namespace cannot be per-group, and
// nesting a leaf under its group would hand it two URLs the moment anything is
// cross-listed. The cost is that slugs must not collide across `services` and
// `servicePillars`; `resolveServicesSlug` below makes the precedence explicit
// rather than leaving it to whichever query happens to run first.
//
// Same cached-read-then-draftMode ordering as the other detail routes
// (draftMode() before unstable_cache throws DYNAMIC_SERVER_USAGE under ISR).
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

type Resolved =
  | { kind: 'service'; doc: Service }
  | { kind: 'group'; doc: ServicePillar }
  | { kind: 'none' }

/**
 * Leaf wins over group. Both collections enforce a unique slug internally, but
 * nothing enforces uniqueness BETWEEN them, so a collision is possible and this
 * decides it: the leaf is the page a visitor is far more likely to have been
 * linked to. A collision is a content error either way — the group would become
 * unreachable — so it is worth a deliberate order rather than an accident.
 */
async function resolveServicesSlug(slug: string, isDraft: boolean): Promise<Resolved> {
  const publishedService = await getServiceBySlug(slug)
  const service = isDraft
    ? ((await getDraftBySlug<Service>('services', slug)) ?? publishedService)
    : publishedService
  if (service) return { kind: 'service', doc: service }

  const publishedGroup = await getServicePillarBySlug(slug)
  const group = isDraft
    ? ((await getDraftBySlug<ServicePillar>('servicePillars', slug)) ?? publishedGroup)
    : publishedGroup
  if (group) return { kind: 'group', doc: group }

  return { kind: 'none' }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [service, group] = await Promise.all([getServiceBySlug(slug), getServicePillarBySlug(slug)])
  const doc = service ?? group
  if (!doc) return {}
  return buildMetadata(doc.seo, { title: doc.title })
}

export default async function ServicesSlugPage({ params }: Props) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const resolved = await resolveServicesSlug(slug, isDraft)
  if (resolved.kind === 'none') notFound()

  const { doc } = resolved
  // ROADMAP UI-2: collection-backed blocks get their items filled in here,
  // before the layout reaches the synchronous RenderBlocks dispatcher.
  const layout = (await resolveLayout(doc.layout as never)) as never

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: doc.title, path: `/services/${slug}` },
        ])}
      />
      {isDraft && <PreviewBanner />}
      <article
        data-testid={resolved.kind === 'service' ? 'service' : 'service-group'}
        data-service={slug}
      >
        <RenderBlocks blocks={layout} />
      </article>
    </>
  )
}
